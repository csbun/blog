---
layout: post
title:  "利用 sendBeacon 发送统计信息"
date:   2014-12-10 17:37:53
categories: log async
---

## 前言

今天看到这样一篇文章《[Send beacon data in Chrome 39](http://updates.html5rocks.com/2014/10/Send-beacon-data-in-Chrome-39)》

大致是说 `navigator.sendBeacon` 可以用来发送一些小量的数据，特别适合统计场景，且这个请求是异步的，不受浏览器行为限制：即使浏览器关闭请求也能照样发出。

## 用法

官网定义

```java
partial interface Navigator {
    boolean sendBeacon(DOMString url, optional (ArrayBufferView or Blob or DOMString or FormData)? data = null);
};
```

使用

```javascript
var data = new FormData();
navigator.sendBeacon('path/to/beacon', data);
```

就是这样，会发出一个 `POST` 请求。

## 测试

于是我做了个测试，测试环境：

- 浏览器：Chrome，版本 41.0.2244.0 canary (64-bit)
- 后端服务器：koa，v0.11.0

### 前端

前端设置了以下三种情况：

#### get

```javascript
window.addEventListener('unload', function () {
    $.get('/log/get', { type: 'get' }, function (res) {
        console.log(res);
    });
});
```

#### post

```javascript
window.addEventListener('unload', function () {
    $.post('/log/post', { type: 'post' }, function (res) {
        console.log(res);
    });
});
```

#### sendBeacon

```javascript
window.addEventListener('unload', function () {
    var data = new FormData();
    data.append('type', 'beacon');
    navigator.sendBeacon('/log/beacon', data);
});
```

### 后端
```javascript
var koa = require('koa'),
    route = require('koa-route'),
    koaBody = require('koa-body');

var app = koa();
app.use(koaBody());

// log
app.use(function * (next) {
    var start = new Date();
    yield next;
    var ms = new Date() - start;
    console.log('[' + this.method + ']' + ms + 'ms: ' + this.url);
});

// 延迟输出
function output (cb) {
    setTimeout(function() {
        cb(null, JSON.stringify({
            success: true
        }));
    }, 1000);
}

// 模拟 sendBeacon
app.use(route.post('/log/beacon', function * () {
    logger('beacon: ' + this.request.body);
    this.body = yield output;
}));

// 模拟 post
app.use(route.post('/log/post', function * () {
    logger('post: ' + this.request.body);
    this.body = yield output;
}));

// 模拟 get
app.use(route.get('/log/get', function * () {
    logger('get: ' + this.request.body);
    this.body = yield output;
}));
```

### 用例

- 点击页面中的链接（外链）
- 刷新页面
- 关闭页面（CTRL + w）
- 关闭浏览器（CTRL + q）

### 结果

- get: 无统计日志
- post: 无统计日志
- beacon: 4种情况都有统计日志

虽然在 beacon 中能获取到统计日志，但 body 中没有获得信息。在 Inspector 中看到请求的信息是在 `Request Payload` 中，有待考察。

## 奇怪现象

将上述前端代码改成

```javascript
window.addEventListener('unload', function () {
    $.get('/log/get', { type: 'get' }, function (res) {
        console.log(res);
    });
    $.post('/log/post', { type: 'post' }, function (res) {
        console.log(res);
    });
});
```

那么后端通常能获得第一个 `get` 的请求。假如先写 `$.post` 则同样会有 `post` 请求。

### zepto 的问题？

于是我自己写一个 XMLHttpRequest，这个现象就消失了。有待考察。


## 后记

据说只有 Chrome 37 以上可以用，我试了一下 UC浏览器 不行，呵呵。

