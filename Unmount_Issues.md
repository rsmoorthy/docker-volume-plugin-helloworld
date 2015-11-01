During the demo at the Docker Meetup, there was a strange behaviour - which is mostly explained below. Please refer the 19th slide in https://goo.gl/6UZMcL

## Summary

As explained below, it seems that the SSHFS was `lazily` unmounted (*even though the unmount command we issued did not specify so*). A lazy unmount releases all the mount references, and does the actual unmount only after the resource is no more needed. That is what has happened in our case, which explains what we observed.

I still need to find out, how it unmounted `lazily` (equiv of `fusermount -uz /path`) - though we did not issue `-z` option.

I still think there is a bug with Docker, which should NOT have called the unmount, after second container stopped, while the first container was still referring it.

### The behaviour at Meetup:

* Start *first* and *second* container (as explained above)
* Run *docker stop second*
* The docker volume plugin unmounts the sshfs mount. A look at “mount” command shows that it was indeed unmounted.
* Access the docker container first and the Expected behavior was it should not see any the mounted files.
* But the behaviour was the sshfs files were still accessible and writable - which was strange.

### Analysis, post the meetup:

* After unmount, verified with mount command -- which clearly showed it was already unmounted
* Listing of files at the mount path (/tmp/mnt/ssh/testuser-localhost/) showed there were no files.
* But the “sshfs” process was still running and had NOT exited. And it looks like somehow the mount path still continued to be available to the first container.
```
rsm       6063  0.0  0.0  44480  5128 pts/11   Ss+  07:43   0:00 ssh -x -a -oClearAllForwardings=yes -oUserKnownHostsFile=/dev/null -oStrictHostKeyChecking=no -oNumberOfPasswordPrompts=1 -2 testuser@localhost -s sftp
root      6064  0.0  0.0 130808  7488 ?        Ss   07:43   0:00 sshd: testuser [priv]
testuser  6108  0.0  0.0 130808  4052 ?        S    07:43   0:00 sshd: testuser@notty
testuser  6109  0.0  0.0  12864  1980 ?        Ss   07:43   0:00 /usr/lib/openssh/sftp-server
rsm       6110  0.0  0.0 248660   356 ?        Ssl  07:43   0:00 sshfs -o reconnect -o password_stdin -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o allow_root -o uid=0 -o gid=0 testuser@localhost: /tmp/mnt/ssh/testuser-localhost
```
* Running *docker stop first*  - stopped the sshfs process

### Let us exclude Docker and try

* Open terminal one, and issue, which mounts SSH filesystem:
```
$ echo test123 | sshfs -o reconnect -o password_stdin -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o allow_root -o uid=0 -o gid=0 testuser@localhost: /tmp/mnt/sshtest
```
* On the terminal two, go to that directory:
```
$ cd /tmp/mnt/sshtest
```
* On the terminal one:
```
$ fusermount -u /tmp/mnt/sshtest
fusermount: failed to unmount /tmp/mnt/sshtest: Device or resource busy
$
```

**As you notice, if the resource is busy, unmount fails. But in our case, the unmount succeeds, the mount is no more in the mount table.

### Is it Lazy Unmounting?

* Do the same steps as above, but for unmount, do a `lazy` unmount:
```
$ fusermount -uz /tmp/mnt/sshtest
$
```
* Now, the mount is no more available in /etc/mtab (or in the mount command), but the SSHFS process still runs
* On terminal two, the files are still accessible at /tmp/mnt/sshtest
* Open a terminal three, and list files on /tmp/mnt/sshtest and you will see there are no files on that path


