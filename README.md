## docker-volume-plugin-helloworld

A Hello world Docker Volume Plugin, that shows how to write a simple Docker Volume Plugin.

Look at fordemo.js for a very simple (not practical) volume plugin, only for demonstration purposes.

The app.js is a more complete Volume Plugin, that uses SSHFS for underlying filesystem, instantied from Docker through the Volume Plugin.

## How to setup

* Create a file `helloworld.json` and place it in `/etc/docker/plugins`

```
{
    "Name": "plugin-helloworld",
    "Addr": "http://localhost:7010"
}
```

* Install SSHFS

```
sudo apt-get install sshfs
```

* Download this volume plugin and start it

```
git clone https://github.com/rsmoorthy/docker-volume-plugin-helloworld.git
cd docker-volume-plugin-helloworld
npm install .
node app.js
```

* Now start a docker container, and use this volume-plugin

```
docker run --rm -v "ssh-//user@passwd-host/":/data \
        --volume-driver=helloworld busybox ls -l /data
```

* Mount in one container and share it with others. Note that the first container needs to be `started`, for other containers to access the files

```
docker run -d --name first -v "ssh-//user@passwd-host/":/data \
        --volume-driver=helloworld ubuntu

docker start first
docker run --rm --volumes-from first busybox ls -l /data
# Shows the remote files
docker stop first
docker run --rm --volumes-from first busybox ls -l /data
# Empty files
```

* Unmount Issues

Please refer to [Unmount Issues](https://github.com/rsmoorthy/docker-volume-plugin-helloworld/blob/master/Unmount_Issues.md) for an explanation of the problem faced during the Docker Meetup.


