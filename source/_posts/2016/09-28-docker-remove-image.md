title: 删除本地 Docker 镜像
banner: gallery/taiwan/DSC03679.jpg
tags:
  - Docker
date: 2016-09-28 10:42:21
---


使用 Docker 会遗留一大堆不知道什么鬼的镜像，下面我们想办法干掉他们。

## TL;DR

```sh
docker ps -a | grep 'Exited' | awk '{print $1}' | xargs docker stop | xargs docker rm
docker images | grep '<none>' | awk '{print $3}' | xargs docker rmi
```

<!-- more -->

## 直接删除

启动 Docker（如果没有启动的话），mac 下运行如下命令：
```sh
boot2docker start
```

然后可以查看现有的本地镜像

```sh
docker images
```

从如下的输出结果可以看到有很多没有但占据硬盘空间的镜像：

```sh
REPOSITORY                         TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
csbun/docker-centos6.6-java7-git   1.0                 4daba39c348a        3 weeks ago         1.183 GB
csbun/docker-centos6.6-java7-git   latest              4daba39c348a        3 weeks ago         1.183 GB
<none>                             <none>              e146cf64f30e        3 weeks ago         1.181 GB
<none>                             <none>              139e0f6180fb        4 weeks ago         534 MB
...
centos                             6.6                 8668efb40032        12 weeks ago        202.6 MB
hello-world                        latest              91c95931e552        17 months ago       910 B
```

于是我们可以直接通过上面的 `IMAGE ID` 删除这个镜像

```sh
docker rmi <image-id>
```

如无意外，这个镜像嘟嘟嘟就会被干掉。然而很不幸大多数时候都会提示下来错误，表示镜像正在被某个容器 `container` 使用：

```
Error response from daemon: Conflict, cannot delete 91c95931e552 because the container 429166761c13 is using it, use -f to force
```

如上，`container id` 为 `429166761c13`，知道这个 id 我们就能停止容器，然后重新删除镜像：

```
docker ps -a | grep <container-id>
docker stop <container-id>
docker rm <container-id>
docker rmi <image-id>
```

## 批量删除

但是镜像好多怎么办？容器更多怎么办？只能写脚本批量删除了：

首先我们通过 `docker ps -a` 找出所有已经退出的容器并用 `docker stop` 和 `docker rm` 将其干掉，保证镜像没有被占用：

```sh
docker ps -a | grep 'Exited' | awk '{print $1}' | xargs docker stop | xargs docker rm
```

然后再尝试删除镜像：

```sh
docker images | grep '<none>' | awk '{print $3}' | xargs docker rmi
```

OK，一切都干净了。
