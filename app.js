require('shelljs/global')

var express = require('express');
var jsonParser = require('./json-parser.js')

var app = express();
app.use(jsonParser())

var rootPath = "/tmp/mnt"
var mounts = {}

app.get('*', function (req, resp) {
	resp.status(403).send('Not Implemented')
})

app.post('/Plugin.Activate', function(req, resp) {
	var ret = {Implements: ["VolumeDriver"]}
	resp.json(ret).end()
})

app.post('/VolumeDriver.Create', function(req, resp) {
	console.log("Create: %j", req.body);
	var ret = {Err: null}
	resp.json(ret).end()
})

app.post('/VolumeDriver.Remove', function(req, resp) {
	console.log("Remove: %j", req.body);
	var ret = {Err: null}
	resp.json(ret).end()
})

app.post('/VolumeDriver.Mount', function(req, resp) {
	console.log("Mount: %j", req.body);
	if(!req.body || !req.body.Name)
		return resp.json({Err: "Invalid Volume_Name requested for Mount"}).end()

	var mountPath = getMountPath(req.body.Name)
	if(!mountPath)
		return resp.json({Err: "Volume_Name does not exist OR Invalid Volume_Name provided"}).end()
	if(req.body.Name.match("^ssh")) {
		if(mounts[mountPath])
			return resp.json({MountPoint: mountPath, Err: null}).end()
		sshMount(req.body.Name, function(err, out) {
			if(err) return resp.json({Err: err}.end())
			mounts[mountPath] = true
			console.log("\tSuccessfully mounted " + mountPath + " Out:" + out)
			resp.json({MountPoint: mountPath, Err: null}).end()
		})
	}
	else
		resp.json({MountPoint: mountPath, Err: null}).end()
})

app.post('/VolumeDriver.Path', function(req, resp) {
	console.log("Path: %j", req.body);
	if(!req.body || !req.body.Name)
		return resp.json({Err: "Invalid Volume_Name requested"}).end()

	var mountPath = getMountPath(req.body.Name)
	if(!mountPath)
		return resp.json({Err: "Volume_Name does not exist OR Invalid Volume_Name provided"}).end()
	console.log("\tResponse MountPoint: " + mountPath)
	resp.json({MountPoint: mountPath, Err: null}).end()
})

app.post('/VolumeDriver.Unmount', function(req, resp) {
	console.log("Unmount: %j", req.body);
	if(!req.body || !req.body.Name)
		return resp.json({Err: "Invalid Volume_Name requested"}).end()

	var mountPath = getMountPath(req.body.Name)
	if(!mountPath)
		return resp.json({Err: "Volume_Name does not exist OR Invalid Volume_Name provided"}).end()
	if(req.body.Name.match("^ssh") && mounts[mountPath]) {
		var out = exec("fusermount -u " + mountPath).output
		console.log("\tUnmounted the path " + mountPath + " Out: " + out)
		delete mounts[mountPath]
	}
	resp.json({MountPoint: mountPath, Err: null}).end()
})


function getSshArgs(volume_name)
{
	var m = volume_name.match("^ssh-//(.+)@(.+)-(.+)/(.*)$")
	if(!m)
		return null
	if(m.length == 5)
		return {user: m[1], passwd: m[2], host: m[3], dir: m[4]}
	else
		return {user: m[1], passwd: m[2], host: m[3], dir: ""}
}

function getMountPath(volume_name, create)
{
	if(volume_name.match("^ssh")) {
		var sshArgs = getSshArgs(volume_name)
		if(!sshArgs)
			return null
		var remoteDir = sshArgs.dir.replace(/\//g, "-")
		var userHost = sshArgs.user + "-" + sshArgs.host

		var path = rootPath + "/ssh/" + userHost
		if(remoteDir.length)
			path = path + "/" + remoteDir

		mkdir('-p', path)
		return path
	}
	if(!test('-d', rootPath + "/" + volume_name))
		return null
	return rootPath + "/" + volume_name
}

function sshMount(volume_name, cb)
{
	var mountPath = getMountPath(volume_name)
	var sshArgs = getSshArgs(volume_name)

	var sshCmd = "sshfs -o reconnect -o password_stdin -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
	sshCmd += " -o allow_root -o uid=0 -o gid=0 "
	sshCmd += sshArgs.user + '@' + sshArgs.host + ":"
	if(sshArgs.dir.length)
		sshCmd += sshArgs.dir

	sshCmd += " " + mountPath

	console.log("\tMounting with cmd: " + sshCmd)
	run_cmd(sshCmd, sshArgs.passwd, cb)
}

function run_cmd(cmd, input, cb)
{
	if(typeof cmd == "string")
		cmd = cmd.split(" ")

	var spawn = require('child_process').spawn
	var child = spawn(cmd[0], cmd.slice(1))
	var resp = ""

	child.stdout.on("data", function(buffer) { resp += buffer.toString(); })
	child.stdout.on("end", function(buffer) { cb(null, resp); })

	if(typeof input == "string" || input.length)
		child.stdin.write(input)
	child.stdin.end()
}


var server = app.listen(7010, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Docker Volume Plugin helloworld listening at http://%s:%s", host, port)
})
