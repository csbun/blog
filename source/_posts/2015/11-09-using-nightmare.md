title: 使用 Nightmare 进行浏览器自动化测试
date: 2015-11-09 18:09:32
banner: gallery/taiwan/DSC03166.jpg
tags:
- test
- nightmare
---

[Nightmare](http://nightmarejs.org) is a high-level browser automation library. 和之前的 [PhantomJS](http://phantomjs.org/) 很像，但是 [Nightmare](http://nightmarejs.org) 是基于 [Electron](http://electron.atom.io/) 的，也就是还是基于 Chromium 和 Node.js。但是感觉其写法比 [PhantomJS](http://phantomjs.org/) 简单一些：

<!-- more -->

## 安装

```sh
npm i nightmare
```

## 使用

### 创建实例

```javascript
var Nightmare = require('nightmare');

var nightmare = Nightmare({ show: true }); // options
```

这里的 `options.show = true` 可以在运行时打开 [Electron](http://electron.atom.io/) 窗口，方便 [debug](https://github.com/segmentio/nightmare#debugging)，更多的 options 请看 [new BrowserWindow(options)](https://github.com/atom/electron/blob/master/docs/api/browser-window.md#new-browserwindowoptions)。

### 操作页面

因为需要使用了 ES6 的 generator，所以这里还要加入 [co](https://github.com/tj/co)，官网的 [Examples](https://github.com/segmentio/nightmare#examples) 使用的是 [vo](https://github.com/lapwinglabs/vo)。

```javascript
var co = require('co');
var RES_CLS = 'r';

// Node 运行环境
var googleUrl = 'https://www.google.com/';
co(function* () {
    var url = yield nightmare
        // 打开 Google
        .goto(googleUrl)
        // 在输入框中填写内容 'csbun npm'
        .type('input[name="q"]', 'csbun npm')
        // 点击搜索
        .click('input[type="submit"]')
        // 等待页面返回
        .wait('.' + RES_CLS)
        // 页面操作
        .evaluate(function (RES_CLS) {
            // 这里是浏览器的运行环境
            var resHref = '';
            var resH3 = document.getElementsByClassName(RES_CLS)[0];
            if (resH3) {
              console.log(resH3);
                var resA = resH3.getElementsByTagName('A')[0];
                if (resA) {
                    resHref = resA.href;
                }
            }
            // 返回给 Node
            return resHref;
        }, RES_CLS); // 传参
    // 关闭
    yield nightmare.end();
    return url;
}).then(function (res) {
    // 输出结果
    console.log('res: ' + res);
});
```

运行上述代码，将获得 Google 搜索 `csbun npm` 的第一个链接： [https://www.npmjs.com/~csbun](https://www.npmjs.com/~csbun)。

### 其他 [API](https://github.com/segmentio/nightmare#api)

#### evaluate

在上面的例子里面，我们可以看到，`.evaluate(fn, arg1)` 中的 `fn` 是浏览器的运行环境，是不能直接使用闭包中的其他变量的，必须通过 `evaluate` 的参数 `arg1` 传入。详情请看 [官方解释](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)。

#### wait

`wait(ms)`，`.wait(selector)`，`.wait(fn)` 这三个方法在页面进行异步操作的时候比较好用。[接口文档](https://github.com/segmentio/nightmare#waitms)。

例如发送请求，等待图片下载等，都可以通过上面的方式实现。


## 测试

有了 [Nightmare](http://nightmarejs.org)，我们就可以结合 [Mocha](http://mochajs.org/)，给我们的项目编写测试例，下面将以我的一个小项目 [resize-image](https://github.com/csbun/resize-image) 为例：

同样的，因为使用了 generator，我们加入 [mocha-generators](https://www.npmjs.com/package/mocha-generators)：

```javascript
/* test.js */
// enable generator `it('', function * () {})`
require('mocha-generators').install();

var Nightmare = require('nightmare');
var assert = require('assert');
```

### 本地服务器

然后我们需要一个本地服务器，基于 Node，我们可以很简单写就写一个出来：

```javascript
/* server.js */
var fs = require('fs');
var path = require('path');
var http = require('http');

var html = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf8');

var pngFile = path.join(__dirname, '../example/google.png');
var pngStat = fs.statSync(pngFile);

var jsFile = path.join(__dirname, '../index.js');
var jsStat = fs.statSync(jsFile);

module.exports = http.createServer(function (req, res) {
  if (req.url === '/index.js') {
    res.writeHead(200, {
        'Content-Type': 'text/javascript',
        'Content-Length': jsStat.size
    });
    fs.createReadStream(jsFile).pipe(res);
  } else if (req.url === '/google.png') {
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': pngStat.size
    });
    var readStream = fs.createReadStream(pngFile);
    readStream.pipe(res);
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  }
});

```

其中，`google.png` 只是一张普通的图片，`index.js` 则为 [resize-image](https://github.com/csbun/resize-image) 的源码，`test.html` 则为一个简单的测试页面：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Resize Image</title>
    <script type="text/javascript" src="index.js"></script>
  </head>
  <body>
    <img id="img" src="./google.png">
  </body>
</html>
```

### 测试代码

下面我们就能开始测试：

```javascript
/* test.js */
var PORT = 7500;
var ASSERT_SIZE = 200;

describe('resize-image', function () {
  // start server
  before(function (done) {
    require('./server').listen(PORT, done);
  });

  // test `.resize`
  it('.resize: Resize any image to ' + ASSERT_SIZE, function * () {
    var nightmare = Nightmare(); // 不要 show 了

    var min = yield nightmare
      .goto('http://0.0.0.0:' + PORT + '/')
      .evaluate(function (ASSERT_SIZE) {
        var img = document.getElementById('img');
        // resize
        var base64 = window.ResizeImage.resize(img, ASSERT_SIZE, ASSERT_SIZE, ResizeImage.PNG);
        // get resized image size
        var resizedImg = new Image();
        resizedImg.src = base64;
        return Math.min(resizedImg.width, resizedImg.height);
      }, ASSERT_SIZE)

    yield nightmare.end();
    assert.equal(min, ASSERT_SIZE);
  });
});
```

运行 `mocha`，执行结果如下：

```
  resize-image
    ✓ .resize: Resize any image to 200 (582ms)


  1 passing (595ms)
```

完成！没问题！完整的例子请看 [这里](https://github.com/csbun/resize-image/tree/master/test)。
