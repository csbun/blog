---
layout: post
title:  "Docker With Node"
date:   2015-06-18 20:41:05
tags:
- Docker 
- Node
---

## Install Docker

We can use docker CLI by install [Boot2Docker](http://docs.docker.com/installation/mac/) or GUI via [Kitematic](https://kitematic.com/)

<!-- more -->

### Install [Boot2Docker](http://docs.docker.com/installation/mac/)

```
boot2docker init
```

> This creates a new virtual machine. You only need to run this command once.

```
boot2docker start
```

Then u will see at the first time

```
To connect the Docker client to the Docker daemon, please set:
    export DOCKER_HOST=tcp://192.168.59.103:2376
    export DOCKER_CERT_PATH=/Users/xxx/.boot2docker/certs/boot2docker-vm
    export DOCKER_TLS_VERIFY=1
```

Do it then run `boot2docker start` again. this time we get

```
Waiting for VM and Docker daemon to start...
.o
Started.
...
Your environment variables are already set correctly.
```

Now we get `docker` in our cli, next time we will just run `boot2docker start` to get it. (Or just run the `boot2docker` Application)

### Install [Kitematic](https://kitematic.com/)

click `Docker CLI` at bottom left and run the cli

## Get Node Image

```
docker pull node
```

## Run Node

```
mkdir docker-node-test
cd docker-node-test
touch index.js
touch Dockerfile
npm init
```

Edit index.js

```javascript
console.log('Hello World');
```

Edit Dockerfile

```
FROM node:onbuild
```

> The 'onbuild' version is based on the plain 'iojs' version used above, but it copies your node application to the container and then runs its. Creating a derivative of this image can be as simple as referencing it and specifying the port you want to expose.


## Build and Push

```
docker login
```

This will run only once if we did not login

```
docker build -t csbun/docker-node-test .
...
docker push csbun/docker-node-test
...
```

Then u can see ur repo on [Docker Hub](https://registry.hub.docker.com/repos/) and [Kitematic](https://kitematic.com/)


## Run a Web App

### Edit Project

In this example we use [Koa](http://koajs.com/) as a server:

```
npm i koa —save
```

Update index.js

```javascript
'use strict';

var app = require('koa')();
app.use(function * (next) {
  this.body = 'Hello World';
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Koa server listening on port ' + port);
});
```

Update Dockerfile

```
FROM node:onbuild
expose 3000
```

Here are something about [expose](https://docs.docker.com/reference/builder/#expose)

### Build and Run

This time, we build it in our local VM. First we need to get the IP of the virtual host:

```
boot2docker ip
```

The VM's Host only interface IP address is: `192.168.59.103`. Then build and run:

```
docker build -t docker-node-test .
...
docker run --rm  -p 40100:3000 docker-node-test
```

Now test it on `http://192.168.59.103:40100/`.

> If we use Kitematic, the ip of it is different from what we get from boot2docker.

## Stop Container

See what’s running in docker

```
docker ps
```

Then we can something like this:

```
CONTAINER ID        IMAGE                           ...
678e64c1fe45        docker-node-test:latest   ...
```

To stop this image, run

```
docker stop 678e64c1fe45
```


## References

- [Up and running with io.js and Docker](http://blog.codefresh.io/up-and-running-with-io-js-and-docker/)
- [Introduction to Docker for the Node.js Developer](https://github.com/lukebond/requirelx-dockerlisbon-talk-2015-05/blob/master/requirelx-2015-05.md)
- [Docker Cheat Sheet](https://github.com/wsargent/docker-cheat-sheet)
