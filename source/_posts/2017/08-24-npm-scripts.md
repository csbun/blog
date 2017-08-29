title: npm scripts 之 publish 和 install
banner: gallery/sri-lanka/P60417-160040.jpg
date: 2017-08-24 18:18:32
tags:
- npm
- publish
- install
---

npm [自身提供](https://docs.npmjs.com/misc/scripts)了一些 script，并且有一些特定的规则，最近用到了几个，在这里记录一下，下文提到的代码仓库在 [这里](https://github.com/csbun/npm-scripts-example) 可以看到。

<!-- more -->

## publish

通常，我们使用 `npm publish` 会把所在 package 的当前版本发布到 npm 上。但如果我们还希望有更多的操作，就可能需要用到下面这些：

- prepublish: 在打包和发布 **之前** 执行，同时在本地运行不含任何参数的 `npm install` 时执行（见下文）。
- prepare: 同样在打包和发布 **之前** 执行，同时在本地运行不含任何参数的 `npm install` 时执行（见下文）。它的执行时机在 `prepublish` 之后，在 `prepublishOnly` 之前。
- prepublishOnly: 在打包和发布 **之前** 执行。 **仅** 在运行 `npm publish` 前执行。
- prepack: 在 tar 文件被打包好 **之前** 执行（在运行 `npm pack`，`npm publish` 和安装 git 依赖时）。
- postpack: 在 tar 文件被打包好并移动到最终目录 **之后** 执行。
- publish、postpublish: 在 package 发布 **之后**。

说是这么说，但真正使用 `npm publish` 的时候，到底会执行那些 script？我们拿一个叫 `npm-scripts-example` 的例子来试一下

```json package.json
{
  "name": "npm-scripts-example",
  "scripts": {
    "prepublish": "# Run BEFORE the package is packed and published, as well as on local npm install without any arguments.",
    "prepare": "# Run both BEFORE the package is packed and published, and on local npm install without any arguments (See below). This is run AFTER prepublish, but BEFORE prepublishOnly.",
    "prepublishOnly": "# Run BEFORE the package is prepared and packed, ONLY on npm publish.",
    "prepack": "# Run BEFORE a tarball is packed (on npm pack, npm publish, and when installing git dependencies).",
    "postpack": "# Run AFTER the tarball has been generated and moved to its final destination.",
    "publish": "# Run AFTER the package is published.",
    "postpublish": "# Run AFTER the package is published.",

    ...
  },
}
```

在 npm@3（3.10.8）环境运行 `npm publish` 结果如下：

```sh
> npm-scripts-example@0.0.4 prepublish /path/to/npm-scripts-example
> # Run BEFORE the package is packed and published, as well as on local npm install without any arguments.

# 上传到 npm 的进度条出现在这里

+ npm-scripts-example@0.0.4


> npm-scripts-example@0.0.4 publish .
> # Run AFTER the package is published.


> npm-scripts-example@0.0.4 postpublish .
> # Run AFTER the package is published.
```

即

```
# npm@3
prepublish -> [上传至 npm] -> publish -> postpublish
```


在 npm@5（5.3.0）环境运行 `npm publish` 结果如下：

```sh
npm WARN prepublish-on-install As of npm@5, `prepublish` scripts are deprecated.
npm WARN prepublish-on-install Use `prepare` for build steps and `prepublishOnly` for upload-only.
npm WARN prepublish-on-install See the deprecation note in `npm help scripts` for more information.

> npm-scripts-example@0.0.5 prepublish .
> # Run BEFORE the package is packed and published, as well as on local npm install without any arguments.


> npm-scripts-example@0.0.5 prepare .
> # Run both BEFORE the package is packed and published, and on local npm install without any arguments (See below). This is run AFTER prepublish, but BEFORE prepublishOnly.


> npm-scripts-example@0.0.5 prepublishOnly .
> # Run BEFORE the package is prepared and packed, ONLY on npm publish.


> npm-scripts-example@0.0.5 prepack .
> # Run BEFORE a tarball is packed (on npm pack, npm publish, and when installing git dependencies).


> npm-scripts-example@0.0.5 postpack .
> # Run AFTER the tarball has been generated and moved to its final destination.

# 上传到 npm 的进度条出现在这里

> npm-scripts-example@0.0.5 publish .
> # Run AFTER the package is published.


> npm-scripts-example@0.0.5 postpublish .
> # Run AFTER the package is published.

+ npm-scripts-example@0.0.5
```

即

```
# npm@5
prepublish -> prepare -> prepublishOnly -> prepack -> postpack -> [上传至 npm] -> publish -> postpublish
```

可以看到想在 npm@3 环境下 publish 之前干点什么（例如做个自动压缩之类的），只能用 `prepublish`，然而在 npm@5 就要被舍弃了吖。如果可以限制该 package 的开发者都是 npm@5 环境，那么，直接改成 `prepare` 是没有问题的，而是否能改成 `prepublishOnly`，**还** 取决于这个脚本，是不是要在 package 开发者本地运行 `install` 之后执行。

## install

前面提到 `prepublish` 和 `prepare` 会 “同时在本地运行不含任何参数的 `npm install` 时执行”。于是我们再改动一下上面的例子，加上 install 相关的 scripts：

```json package.json
{
  "scripts": {
    ...

    "preinstall": "# Run BEFORE the package is installed.",
    "install": "# Run AFTER the package is installed.",
    "postinstall": "# Run AFTER the package is installed.",

    ...
  },
  "dependencies": {
    "lodash": "^4.17.4"
  }
}
```

### Local npm install without any arguments

在当前 package 中运行 `npm install`， npm@3 环境结果如下：

```sh
# fetch node modules 的进度条出现在这里

> npm-scripts-example@0.0.5 preinstall /path/to/npm-scripts-example
> # Run BEFORE the package is installed.

# extract node modules 的进度条出现在这里

> npm-scripts-example@0.0.5 install /path/to/npm-scripts-example
> # Run AFTER the package is installed.


> npm-scripts-example@0.0.5 postinstall /path/to/npm-scripts-example
> # Run AFTER the package is installed.


> npm-scripts-example@0.0.5 prepublish /path/to/npm-scripts-example
> # Run BEFORE the package is packed and published, as well as on local npm install without any arguments.

npm-scripts-example@0.0.5 /path/to/npm-scripts-example
└── lodash@4.17.4
```

注意到，除了预料中的 `preinstall`，`install` 和 `postinstall`，在最后还执行了 `prepublish`。


即

```
# npm@3
[fetch] -> preinstall -> [extract] -> install -> postinstall -> prepublish
```

按惯例我们继续试试 npm@5 的结果：

```sh
# fetch node modules 的进度条出现在这里

> npm-scripts-example@0.0.5 preinstall /path/to/npm-scripts-example
> # Run BEFORE the package is installed.

# extract node modules 的进度条出现在这里

> npm-scripts-example@0.0.5 install /path/to/npm-scripts-example
> # Run AFTER the package is installed.


> npm-scripts-example@0.0.5 postinstall /path/to/npm-scripts-example
> # Run AFTER the package is installed.

npm WARN prepublish-on-install As of npm@5, `prepublish` scripts are deprecated.
npm WARN prepublish-on-install Use `prepare` for build steps and `prepublishOnly` for upload-only.
npm WARN prepublish-on-install See the deprecation note in `npm help scripts` for more information.

> npm-scripts-example@0.0.5 prepublish /path/to/npm-scripts-example
> # Run BEFORE the package is packed and published, as well as on local npm install without any arguments.


> npm-scripts-example@0.0.5 prepare /path/to/npm-scripts-example
> # Run both BEFORE the package is packed and published, and on local npm install without any arguments (See below). This is run AFTER prepublish, but BEFORE prepublishOnly.

added 1 package in 2.348s
```

即

```
# npm@3
[fetch] -> preinstall -> [extract] -> install -> postinstall -> prepublish -> prepare
```

几乎没有任何区别，只是和 publish 一样警告了一下以后不要用 prepublish 了。

### Local npm install with arguments

那么，如果是带有参数的 `npm install` 呢？我们试试 `npm install lodash` 看看？

结果便是，无论 npm@3 还是 npm@5 都只是默默吧 lodash 安装下来，并不会执行任何 script。


### Install package

最后，我们试试在其他地方安装这个 package 的情况：

在 npm@3 和 npm@5 环境下，若 npm-scripts-example 被首次安装，则无论是否 `npm install` 是否带参数（即使用 `npm install` 或 `npm install npm-scripts-example`），结果均是：

```sh
> npm-scripts-example@0.0.5 preinstall /path/to/project/node_modules/.staging/npm-scripts-example-62ae822f
> # Run BEFORE the package is installed.


> npm-scripts-example@0.0.5 install /path/to/project/node_modules/npm-scripts-example
> # Run AFTER the package is installed.


> npm-scripts-example@0.0.5 postinstall /path/to/project/node_modules/npm-scripts-example
> # Run AFTER the package is installed.

npm-scripts-example-main@0.0.1 /path/to/project
└── npm-scripts-example@0.0.5
```

即

```
[fetch] -> preinstall -> [extract] -> install -> postinstall
```
