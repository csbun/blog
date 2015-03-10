---
layout: post
title:  "使用 NW.js 创建桌面应用"
date:   2015-03-10 19:50:29
categories: NW.js desktop node webkit
---

前段时间简单研究了一下 [NW.js](http://nwjs.io/)，基于 Chromium 和 node.js，可以使用 Web 技术来编写跨平台的桌面应用。

## 安装

其实理论上是可以不用安装 NW.js 到本地的，但是为了方便开发，也可以按照其[在 GitHub 上的介绍](https://github.com/nwjs/nw.js#downloads)进行下载安装。

### sublime 工具

这里我还安装了个 [sublime 工具](https://github.com/nwjs/nw.js/wiki/Debugging-with-Sublime-Text-2-and-3)，配置好后在根目录使用快捷键 `⌘ B` 就可以启动应用。

## 创建项目

并没有特别的要求，只要有 package.json 就可以了：

```json
{
  "name": "nw-demo",
  "version": "0.0.1",
  "main": "index.html",
  "window": {
    "toolbar": true,
    "width": 660,
    "height": 500
  }
}
```

其中 `"main": "index.html"` 指定了入口文件，那么这个 index.html 也是必须要存在的：

```html
<!DOCTYPE html>
<html>
<head>
    <title>demo</title>
</head>
<body>
    <h1>demo</h1>
</body>
</html>
```

## 启动项目

在 package.json 所在目录执行（Mac）：

```
/Applications/nwjs.app/Contents/MacOS/nwjs .
```

就会弹出应用窗口（内容为上述 index.html）。其他操作系统看[这里](https://github.com/nwjs/nw.js#quick-start)，我也没试过。

## 使用 JS

在 index.html 内，我们有两种方法来使用 JS：

```html
<!-- index.html -->
<script src="path/to/index.js"></script>
```

和

```html
<!-- index.html -->
<script>
// do something
</script>
```

这两种方式是无差异的。什么意思？就是第一种方式等同于把 index.js 的内容直接按第二种方式的方法贴在页面 `<script>` 标签中，和 index.js 本身所在的路径无关。

## 模块化

看起来这个这个 index.js 的文件路径时候没多大关系，但当项目大起来的时候，模块化的概念还是得引入，而此时模块路径就是一个不得不关注的话题了。

但是我翻了好几个 [demos repository](https://github.com/zcbenz/nw-sample-apps) 和 [List of apps and companies using nw.js](https://github.com/nwjs/nw.js/wiki/List-of-apps-and-companies-using-nw.js) 发现都没有使用任何模块化工具：无一例外地是把全部 js 以 `<script src="...">` 的方式插入页面。

但是我还是不甘心，还是试了一下：鉴于 NW.js 是基于 Node 的，那自然可以使用 CommonJS 规范：

```html
<!-- index.html -->
<!--
    这里不用 <script src="...">
    是为了让这个无效的 src 在 require 时不产生相对路径的困惑
-->
<script>
require('./js/index');
</script>
```

```javascript
/**
 * js/index.js
 */
require('./cmp/alert')();
```

```javascript
/**
 * js/cmp/alert.js
 */
module.exports = function () {
    alert('something');
};
```

完美运行，一切看起来很好。

## 使用 Node Module

回到 NW.js 基于 Node 上来，我们可以使用 Node 本身的 Module，也可以用 [npm](https://npm.com) 上的：

```
npm i --save jquery
```

```html
<!-- index.html -->
<ul id="files"></ul>
<script>require('./js/files')();</script>
```

```javascript
/**
 * js/files.js
 */
var fs = require('fs');
var $ = require('jquery');
var $files = $('#files');
module.exports = function () {
    fs.readdir(process.cwd(), function (err, files) {
        files.forEach(function (f) {
            $('<li>').html(f).appendTo($files);
        });
    });
}
```

完美运行，这里的 `require('fs')` 和 `process.cwd()` 都如同写 Node 一样，一切看起来很好。

## 使用 nw.gui

做桌面应用难免要使用到一些 [Native UI](https://github.com/nwjs/nw.js/wiki/Native-UI-API-Manual)，那么我们做个右击菜单：

```javascript
/**
 * js/menu.js
 */
// Load native UI library
var gui = require('nw.gui');

// Create an empty menu
var menu = new gui.Menu({ type: 'menubar' });

// Create a normal item with label and icon
var item = new gui.MenuItem({
    type: 'normal', 
    label: 'I\'m a menu item',
    click: function() {
        alert('WaW!');
    },
});

// Add some items
menu.append(item);
menu.append(new gui.MenuItem({ type: 'separator' }));
menu.append(new gui.MenuItem({ label: 'Item C' }));

document.body.addEventListener('contextmenu', function(ev) { 
    ev.preventDefault();
    menu.popup(ev.x, ev.y);
    return false;
});
```

```html
<!-- index.html -->
<script src="js/menu.js"></script>
```

用这样的方法插入 js 到 html 里，依旧是完美运行。但是如果使用上面的 require 的方式呢：

```html
<!-- index.html -->
<script>require('./js/menu');</script>
```

结果就是，报错：

```
Error: Cannot find module 'nw.gui'
```

嗯，我似乎明白为什么别人不用模块化了...

## 打包应用

官方的[介绍](https://github.com/nwjs/nw.js/wiki/How-to-package-and-distribute-your-apps)老长老长了，我用了 [node-webkit-builder](https://github.com/mllrsohn/node-webkit-builder)

```
npm i --save-dev node-webkit-builder
```

然后写个 build.js：

```javascript
var NwBuilder = require('node-webkit-builder');
var nw = new NwBuilder({
    files: [
        './package.json',
        './css/*',
        './img/*',
        './index.html',
        './js/**/**',
        './node_modules/jquery/dist/jquery.js'
    ],
    macIcns: './logo.icns',
    platforms: ['osx64'] // 'osx32', 'osx64', 'win32', 'win64'
});

//Log stuff you want
nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
    console.log('all done!');
}).catch(function (error) {
    console.error(error);
});
```

执行 `node build.js` 就可以了。生成的应用会在目录 `build/<package.name>/` 下面，按平台分成多个文件夹。

> 这里配置了应用的图标，随便找个可以转换 icns 文件的网站把自己的设计图搞上去生成就可以了。
