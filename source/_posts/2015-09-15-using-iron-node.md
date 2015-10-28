---
layout: post
title:  "使用 iron-node 进行 Node Debug"
date:   2015-09-15 15:05:33
tags:
- Node
- debug
---

简单折腾了一下 [iron-node](http://s-a.github.io/iron-node/)，调试 Node 再也不用苦逼地 console.log 了。


<!-- more -->

## 安装

```
npm i -g iron-node
```


## 启动

```
iron-node path/to/file.js
```

运行上述命令启动，会自动打开一个 Chrome Developer Tools 界面，运行 `node path/to/file.js` 的输出会在 Console 标签页中输出。


## 断点

最简单的断点方式当然是在源码中添加 `debugger;`，如这段：

```javascript
var inc = function (num) {
    debugger; // break point here
    return ++num;
};
console.log('inc(3) = ' + inc(3));
```

同时，也在 Sources 标签页 的 (no domain) 分类中可以看到运行的源码。这样就可以像平时调试页面一样点击行号添加删除断点。

> 尝试了一下使用 Map Workspace 无效，没有文件目录结果，这一点比较痛苦。


## 文件更新

当文件更新时，只要在 Chrome Developer Tools 界面按快捷键 `Command+R` 刷新即可，而且刷新后短点仍然存在。

> 焦点必须在 DevTool 上，而不是预览界面（显示 DEBUG.md 或 README.md 的 index.html）


## 使用 ES6

虽然 Node 已经升级的到 v4.0.0，支持 ES6 了，但是 iron-node 好像还没完全跟上，所以要开启一些 [v8 flags](https://github.com/thlorenz/v8-flags/blob/master/flags-0.11.md)。入口文件所在目录创建文件 `.iron-node.js.`，如在我的例子中，是开启箭头函数：

```javascript
module.exports = {
    v8: {
        flags : [
            '--harmony-arrow-functions'
        ]
    },
    app: {}
};
```

详情可以直接参考 [官方例子](https://github.com/s-a/iron-node/blob/master/.iron-node.js)。如果想设置为全局配置，就看 [这里](https://github.com/s-a/iron-node/blob/master/docs/CONFIGURATION.md)。



