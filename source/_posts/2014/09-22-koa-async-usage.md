---
layout: post
title:  "Koa 中异步方法的使用"
date:   2014-09-22 15:59:22
tags:
- koa
- async
- generator
---

## 使用 Generator 简化异步回调

```javascript
var gen;
function async() {
    setTimeout(function () {
        gen.next(100);
    });
}
function * genFn() {
    var res = yield async();
    console.log('res is: ' + res);
}

gen = genFn();
gen.next();
```

输出的结果是

```
res is: 100
```

<!-- more -->

如果将后面的 `.next()` 封装起来，就变成这样

```javascript
// 当前的 Generator
var activeGenerator;

// 处理 g.next() 功能
function gNext() {
    return function (err, data) {
        if (err) {
            throw err;
        }
        // 前文中的 g.next()，并把回调函数的结果作为参数传递给 yield
        activeGenerator.next(data)
    }
}

// 控制工具
function gQueue(generatorFunc) {
    activeGenerator = generatorFunc(gNext());
    activeGenerator.next();
}

function asyncFunc(cb) {
    // 这个函数模拟一个异步操作，将在 1 秒后触发回调函数
    setTimeout(function() {
        cb(null, 100);
    }, 1000)
}

// 声明一个 Generator 并传给 gQueue
gQueue(function * flow(next) {
    console.log('start');

    // 执行异步函数 asyncFunc，并把 next 注册在其回调函数里
    var y = yield asyncFunc(next);

    // 回调执行完成后，会触发 g.next()，此时 y 的值为 asyncFunc 回调里的 100
    console.log('y is', y);

    // 同上
    var z = yield asyncFunc(next);
    console.log('z is ', z);

    console.log('end')
});

// console log
// start
// y is 100
// z is  100
// end
```

> 参考文章: [使用 (Generator) 生成器解决 JavaScript 回调嵌套问题](http://huangj.in/765)

## Koa 中的应用

koa 使用的就是上面的原理，按照 [co](https://github.com/visionmedia/co) 的用法，就可以这样

main.js

```javascript
// ...

var template = require('./template');
// 区域根目录
app.use(function * (next) {
    yield next;
    // 渲染模板
    this.body = yield template.tpl('tplName');
});

// ...
```

template.js

```javascript
exports.tpl = function (path) {
  return function (cb) {
        var tmpl = new Template(path); // 某种模板渲染器的构造函数
        // 成功异步回调
        tmpl.on('success', function (res) {
            cb(null, res);
        });
        // 失败异步回调
        tmpl.on('error', function (err) {
            cb(err, null);
        });
    };
};
// ...
```

注意到 `gNext` 输出的是如下形式的 function

```javascript
function (err, data) {
    // 处理 err 和 data
}
```

因此 `template.js` 中的 cb 便是上述形式。

> 参考文章: [探索Javascript异步编程](http://blog.sae.sina.com.cn/archives/4341)
