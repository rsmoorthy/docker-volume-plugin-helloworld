// Most Simple - No error Handling app. Just for demo
var express = require('express');
var jsonParser = require('./json-parser.js')

var app = express();
app.use(jsonParser())

app.get('*', function (req, resp) {
	resp.status(403).send('Not Implemented')
})

app.post('/Plugin.Activate', function(req, resp) {
	resp.json( {Implements: ["VolumeDriver"] }).end()
})

app.post('/VolumeDriver.Create', function(req, resp) {
	resp.json( {Err: null }).end()
})

app.post('/VolumeDriver.Remove', function(req, resp) {
	resp.json( {Err: null }).end()
})

app.post('/VolumeDriver.Mount', function(req, resp) {
	resp.json( {MountPoint: "/tmp/mnt/" + req.body.Name, Err: null}).end()
})

app.post('/VolumeDriver.Path', function(req, resp) {
	resp.json( {MountPoint: "/tmp/mnt/" + req.body.Name, Err: null}).end()
})

app.post('/VolumeDriver.Unmount', function(req, resp) {
	resp.json( {MountPoint: "/tmp/mnt/" + req.body.Name, Err: null}).end()
})

var server = app.listen(7010, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Docker Volume Plugin helloworld listening at http://%s:%s", host, port)
})
