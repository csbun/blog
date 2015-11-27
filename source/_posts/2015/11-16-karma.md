title: 使用 Karma 在真实浏览器上测试
banner: gallery/taiwan/DSC03221.jpg
tags:
  - test
  - Karma
  - webpack
  - ci
date: 2015-11-16 11:57:26
---


## 安装

```sh
npm i -g karma-cli
```

## 初始化

进入项目跟目录，初始化 karma 配置文件：

```
npm i karma --save-dev
karma init
```

<!-- more -->

问一[大堆问题](https://karma-runner.github.io/0.13/intro/configuration.html)，回答就是了。`Tab` 为选择，`Enter` 为确认。本文中：

- 不使用 RequireJS
- frameworks 选取 Mocha
- browsers 选择 Chrome 和 PhantomJS

## Mocha

假设我们的项目已经有源码：

```javascript
// add.js
module.exports = function (a, b) {
    return a + b;
};
```

和测试代码：

```javascript
// test/index.js
var assert = require('assert');
var add = require('../add');

describe('add', function () {
    it('add(1, 1) should be 2', function () {
        assert.equal(2, add(1, 1));
    });
});
```

运行 `mocha` 是没有问题的。但是运行 `karma start` 就傻逼了，说他不认识 `require`（这货默认是选择 RequireJS 的）。`ctrl-c` 退出。

## 安装插件

为了解决这个问题，我们需要类似 webpack 或 Browserify 之类的问题来预处理我们源码，而这些，都是能直接通过 [插件](https://www.npmjs.com/browse/keyword/karma-plugin) 搞定！

### karma-webpack

首先使用 [karma-webpack](https://github.com/webpack/karma-webpack) 解决上面 `require` 的问题：

```sh
npm i karma-webpack --save-dev
```

修改 `karma.conf.js`：

```js
module.exports = function(config) {
  config.set({
    // ...
    // 为测试文件添加 webpack preprocessors
    preprocessors: {
      'test/*.js': ['webpack']
    },
    // ...
  })
}
```

再次运行一下 `karma start` 运行结果将包含以下内容：

```
`webpack: bundle is now VALID.`
PhantomJS 1.9.8 (Mac OS X 0.0.0): Executed 1 of 1 SUCCESS (0.002 secs / 0 secs)
Chrome 46.0.2490 (Mac OS X 10.10.5): Executed 1 of 1 SUCCESS (0.007 secs / 0 secs)
TOTAL: 2 SUCCESS
```

嗯，在 PhantomJS 和 Chrome 下面都运行成功了。

### karma-babel-preprocessor

下面我们再把 `test.js` 改一下，弄两个简单的 ES6 进去：

```js
const assert = require('assert');
const add = require('../add');

describe('add', () => {
    it('add(1, 1) should be 2', () => {
        assert.equal(2, add(1, 1));
    });
});
```

结果，Chrome (46.0) 通过了，但 PhantomJS (1.9.8) 没有，于是再来一个插件 [karma-babel-preprocessor](https://github.com/babel/karma-babel-preprocessor)：

```sh
npm i karma-babel-preprocessor babel-preset-es2015 --save-dev
```

同样在 `karma.conf.js` 中添加 `preprocessors`，以及 babel [配置](https://github.com/babel/karma-babel-preprocessor#configuration)：

```js
    preprocessors: {
      'test/*.js': ['webpack', 'babel']
    },
    babelPreprocessor: {
      options: {
        presets: ['es2015'],
      }
    },
// ...
```

很好，`TOTAL: 2 SUCCESS`！于是，把 `add.js` 该成 ES6 也没有问题了：

```js
module.exports = (a, b) => {
    return a + b;
};
```

## 实战

再拿出上次的 [resize-image](https://github.com/csbun/resize-image) 来折腾，依照上面的方法处理，因为我们还需要加载一个图片进来所以用到了 [url-loader](https://github.com/webpack/url-loader)，直接通过 npm 安装即可使用：

```sh
npm i url-loader --save-dev
```

然后编写我们的测试脚本：

```js
'use strict';

const resizeImage = require('../index');
const assert = require('assert');

const ASSERT_SIZE = 200;

describe('resize-image', function () {
    it('.resize: Resize any image to ' + ASSERT_SIZE, function (done) {
        let img = new Image();
        // use [url-loader](https://github.com/webpack/url-loader)
        img.src = require('url!../example/google.png');
        img.onload = function () {
            let base64 = resizeImage.resize(img, ASSERT_SIZE, ASSERT_SIZE, resizeImage.PNG);
            let resizedImg = new Image();
            resizedImg.onload = function () {
                let minWH = Math.min(resizedImg.width, resizedImg.height);
                assert.equal(minWH, ASSERT_SIZE);
                done();
            };
            resizedImg.src = base64;
        };

    });
});
```

browsers 配置了除了 IE 以外的全部浏览器：

```js
    browsers: [
      'Chrome',
      'ChromeCanary',
      'Firefox',
      'Safari',
      'PhantomJS',
      'Opera'
    ],
```

运行 `karma start --single-run` 全部通过。


### coverage

之前的 {% post_link js-unit-test-coverage-ci 博客 %} 中提到了使用 [istanbul](https://github.com/gotwarlost/istanbul) 做代码覆盖率，这里同样有这样的插件实现 [karma-coverage](https://github.com/karma-runner/karma-coverage)：

```sh
npm i karma karma-coverage --save-dev
```

在 `karma.conf.js` 中配置：

```js
    preprocessors: {
      'test/index.js': ['webpack', 'babel', 'coverage']
    },

    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },
```

再次运行 `karma start --single-run` 即可在 `coverage` 文件夹中看到覆盖率报告。但我们可以看到报告里的覆盖率很低，因为 webpack 打包好后的文件包含了很多我们不需要检查的内容（webpack，test 等），于是我们需要 [istanbul-instrumenter-loader](https://www.npmjs.com/package/istanbul-instrumenter-loader)：

```sh
npm i istanbul-instrumenter-loader --save-dev
```

再修改一下 `karma.conf.js`：

```js
    preprocessors: {
      'test/index.js': ['webpack', 'babel'] // 这里不需要说明 coverage
    },

    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },
    // 添加以下部分
    webpack: {
      module: {
        postLoaders: [{
          test: /index\.js$/, // 源文件
          exclude: /(test|node_modules|bower_components)\//, // 排除的文件
          loader: 'istanbul-instrumenter'
        }]
      }
    },
```

再次运行 `karma start --single-run` 就能看到报告里只剩下我们的 `index.js` 了。


### Travis CI & COVERALLS

[Travis CI](https://travis-ci.org/) 提供了一个 [Firefox 的运行环境](http://docs.travis-ci.com/user/firefox/)，于是我们要配置一下 `.travis.yml`：

```yaml
language: node_js
node_js:
  - "4.2"
before_script:
  - export DISPLAY=:99.0
  - sh -e /etc/init.d/xvfb start
```

同时我们将 coverage 报告类型改为 lcov：

```js
    coverageReporter: {
      type : 'lcov',
      dir : 'coverage/'
    },
```

方便我们上传到 [COVERALLS](https://coveralls.io/)：

```sh
npm i coveralls --save-dev
```

`package.json` 也要加入 test 脚本

```json
{
  "name": "resize-image",
  "main": "index.js",
  "scripts": {
    "test": "./node_modules/karma/bin/karma start --browsers Firefox --single-run && find coverage -name lcov.info -print0 | xargs -0 cat | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage"
  }
}
```

提交代码，虽然 [Travis CI](https://travis-ci.org/) 上的输出提示是：

```
Firefox 31.0.0 (Linux 0.0.0): Executed 0 of 1 SUCCESS (0 secs / 0 secs)
 SUCCESS (0 secs / 0.026 secs)
 SUCCESS (0.052 secs / 0.026 secs)
```

但实际上已经成功了，[COVERALLS](https://coveralls.io/) 上已经能看到覆盖率报告！
