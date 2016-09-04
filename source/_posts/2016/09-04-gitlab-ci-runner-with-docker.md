title: GitLab CI Runner with Docker
banner: gallery/taiwan/DSC03530.jpg
date: 2016-09-04 18:32:07
tags:
- ci
- Docker
---

## Install CI Runner:

Install a [CI Runner](ci-runner) on a machine is quite [easy](install-ci-runner), here is the [linux-repository](install-ci-runner-linux):
在一台普通机器上安装 [CI Runner](ci-runner) 应该是一件[很简单的事情](install-ci-runner)，下面是 [Linux 的安装方法](install-ci-runner-linux)：

[ci-runner]: https://about.gitlab.com/gitlab-ci/
[install-ci-runner]: https://gitlab.com/gitlab-org/gitlab-ci-multi-runner/#installation
[install-ci-runner-linux]: https://gitlab.com/gitlab-org/gitlab-ci-multi-runner/blob/master/docs/install/linux-repository.md


Add GitLab's official repository via apt-get or yum:

```sh
# For Debian/Ubuntu
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-ci-multi-runner/script.deb.sh | sudo bash

# For CentOS
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-ci-multi-runner/script.rpm.sh | sudo bash
```

<!-- more -->

Install `gitlab-ci-multi-runner`:

```sh
# For Debian/Ubuntu
sudo apt-get install gitlab-ci-multi-runner

# For CentOS
sudo yum install gitlab-ci-multi-runner
```


## Register a Specific Runner

```sh
sudo gitlab-ci-multi-runner register
```

Answer the following questions after this command:
运行上面这段脚本将需要你回答几个问题：

```text
Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/ci ):
https://gitlab.com/ci
Please enter the gitlab-ci token for this runner:
xxx
Please enter the gitlab-ci description for this runner:
my-runner
Please enter the gitlab-ci tags for this runner (comma separated):
ci,runner
INFO[0034] fcf5c619 Registering runner... succeeded
Please enter the executor: docker-ssh+machine, docker, docker-ssh, parallels, shell, ssh, virtualbox, docker+machine:
shell
```

You can find the answer of the first 2 questions in the `Specific runners` section, **Runners Page** of your gitlab repo(__Settings__ -> __Runners__). We choose `shell` executor for the first time. Refresh the **Runners Page** you will see `my-runner` in the `Specific runners` list.
头两个问题的答案就在项目的 **Runners 页面**（__Settings__ -> __Runners__）`Specific runners` 区域。方便验证起见，我们先选择 `shell` executor。刷新页面就能看的刚刚注册的 `my-runner` 出现在列表中。

![image from https://gitlab.com/help/ci/quick_start/README.md#configuring-a-runner](https://gitlab.com/help/ci/quick_start/img/runners_activated.png)

## Running the Specific Runner

Click the `Disable Shared runners` button on the **Runners Page** so we can just use our runner register just now on each build. After commiting _.gitlab-ci.yml_ (the file that is used by GitLab Runner to [manage your project's build](gitlab-ci-yaml)), we will see jobs running in the **Builds Page** (or **Pipelines Page**) on each push.
为了每次都运行我们刚刚注册的 runner，需要点击 **Runners 页** 的 `Disable Shared runners` 按钮，放弃 Gitlab 提供的共享 runner。提交了 _.gitlab-ci.yml_ [构建文件](gitlab-ci-yaml) 文件的项目，每次 push 都可以在 **Builds 页面** (or **Pipelines 页面**) 看到进度。

[gitlab-ci-yaml]: http://docs.gitlab.com/ce/ci/yaml/README.html

## Docker Executor

If you want to use Docker runner, install it before using the multi runner:
安装 Docker，用作 runner。

```sh
curl -sSL https://get.docker.com/ | sh
```

Now we can register a specific docker runner:
现在就能注册一个 docker runner：

```sh
sudo gitlab-ci-multi-runner register
```

```text
...
Please enter the executor: docker-ssh+machine, docker, docker-ssh, parallels, shell, ssh, virtualbox, docker+machine:
docker
Please enter the default Docker image (eg. ruby:2.1):
centos:7
```

Here we use a simple [centos7 docker image](docker-centos7). Now we have a pure environment at each build.
这里我们选了一个 [centos7 的 Docker 镜像](docker-centos7)，这样我们每次构建都有一个“纯净”的环境。

[docker-centos7]: https://hub.docker.com/_/centos/


### Create Docker Image

Centos7 might too simple to do complex build with special requirements. We can [build our own image](build-your-own-image) by [creating](create-dockerfile) a _Dockerfile_, Base `FROM` centos and installed with java7 using `RUN` command.
当我们需要复杂的构建环境时，Centos7 明显是不够用的。所以我们可以[自己做一个镜像](build-your-own-image)，只需[创建](create-dockerfile)一个 _Dockerfile_ 文件，声明基于（`FROM`）centos，且通过 `RUN` 命令安装 java7。

```dockerfile
FROM centos:7
MAINTAINER Hans Chan <icsbun@gmail.com>

# yum install dependences
RUN yum install -y java-1.7.0-openjdk \
                   java-1.7.0-openjdk-devel
```

[Build](build-and-push) it on your machine:
在你的机器上[构建](build-and-push)这个镜像：

```sh
docker build -t <docker-user-name>/<docker-image-name> .
```

Run it on your machine:
在你的机器上运行这个镜像：

```sh
# login bash
docker run -i -t <docker-user-name>/<docker-image-name> /bin/bash
# check the java version
java -version
```

Push it to [Docker Hub](docker-hub) if you [have an account](create-docker-account):
如果你有一个 [Docker Hub](docker-hub) 账户，你就能把你的镜像推送到公网上了：

```sh
docker push <docker-user-name>/<docker-image-name>
```

Here is a [full example](docker-centos6.6-java7-git) base on Centos6.6, which contains java7 and git CLI.
这里我写了一个[相对完整的示例](docker-centos6.6-java7-git)，包含了 java7 和 git 命令行等。

[build-your-own-image]: https://docs.docker.com/engine/getstarted/step_four/
[create-dockerfile]: https://docs.docker.com/engine/reference/builder/
[build-and-push]: http://csbun.github.io/blog/2015/06/docker-with-node/#build-and-push
[docker-hub]: https://hub.docker.com/
[create-docker-account]: https://docs.docker.com/engine/getstarted/step_five/
[docker-centos6.6-java7-git]: https://hub.docker.com/r/csbun/docker-centos6.6-java7-git/

### Config Specific Runner

[GitLab Runner configuration](advanced-configuration) uses the TOML format.
The file to be edited can be found in: _/etc/gitlab-runner/config.toml_ (on \*nix systems as root). Change the `image` parameter in [runners.docker] section to `<docker-user-name>/<docker-image-name>` created by yourself, restart runner an have fun!
[GitLab Runner 配置](advanced-configuration) 使用 TOML 格式的文件，放在 _/etc/gitlab-runner/config.toml_ （root 权限运行的 \*nix 系统）。把 [runners.docker] 段落中的 `image` 参数改成刚刚创建的 `<docker-user-name>/<docker-image-name>` 镜像，重启 runner 即可：

```sh
sudo gitlab-ci-multi-runner restart
```

[advanced-configuration]: https://gitlab.com/gitlab-org/gitlab-ci-multi-runner/blob/master/docs/configuration/advanced-configuration.md
