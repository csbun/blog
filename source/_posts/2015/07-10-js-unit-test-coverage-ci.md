---
layout: post
banner: gallery/taiwan/DSC03507.jpg
title:  "JS 单元测试代码覆盖率和持续集成"
date:   2015-07-10 19:43:29
tags:
- test
- coverage
- ci
---

本来只是想给我的 [lazy-cache](https://github.com/csbun/lazy-cache) 加个 badge 装一下逼的，没想到会扯到这么多东西。

<!-- more -->

## NodeICO

就是这货

[![NPM](https://nodei.co/npm/lazycache.png?compact=true)](https://nodei.co/npm/lazycache/)

没有什么技术含量，只要是 npm 包，按[官网](https://nodei.co/)上的方法，把这段内容写在 README 里就可以了：

```
[![NPM](https://nodei.co/npm/<package>.png)](https://nodei.co/npm/<package>/)
```

至于各种 Styles，都是参数问题，官网提供的在线工具非常方便。


## Unit Test

因为只用过 [mocha](http://mochajs.org/)，没有对比过别的，就在 `test/test.js` 写了几个用例，这个没什么好讲的。

只要在 `package.json` 里面写明 test 的命令就可以了：

```json
{
  "name": "lazycache",
  "version": "0.0.1",
  "description": "automatic reset cache asynchronously when expired",
  "main": "index.js",
  "scripts": {
    "test": "./node_modules/mocha/bin/_mocha --harmony"
  },
  "devDependencies": {
    "mocha": "^2.2.5"
  }
}
```

因为我用了 ES6 的东西，需要 `--harmony`，这样 `npm test` 就可以运行测试了，很好。


## CI

网上找到了 [Travis CI](https://travis-ci.org/) 好像很出名的样子，于是用 Github 帐号登录之后就能把项目勾选进去。

![盗了官网的一张图](https://travis-ci-org.global.ssl.fastly.net/images/svg/hooks-step-1-01-a62331c87f58ada70c9b273ea15d2215.svg)

项目的跟目录添加 `.travis.yml` 文件，具体写法可以[在这里看](http://docs.travis-ci.com/user/getting-started/)，我的 [JavaScript 项目](http://docs.travis-ci.com/user/languages/javascript-with-nodejs/)是这样写的：

```
language: node_js
node_js:
  - "0.12"
```

这时候只要 push 上 Github 就会触发构建，在 [Travis CI](https://travis-ci.org/) 的控制面板上就能看到项目的构建情况。

点击项目名称后面的这个按钮 ![Build Status](https://travis-ci.org/csbun/lazy-cache.svg?branch=master)，复制里面的 Markdown Badge 到 README，搞定！


## Coverage

只是一个 `build|passing` 肯定没办法满足，搞个单元测试代码覆盖率想必是极好的。[COVERALLS](https://coveralls.io/) 就是这么个东西，网站颜值还不错~

项目还得再加点东西，因为我是用 mocha 的，按[说明](https://github.com/nickmerwin/node-coveralls/blob/master/README.md)，我需要装这些：

```
npm i --save-dev coveralls mocha-lcov-reporter
```

然后用 [istanbul](https://github.com/gotwarlost/istanbul) 做代码覆盖率，再装上：

```
npm i --save-dev istanbul
```

然后按照[说明](https://github.com/nickmerwin/node-coveralls#user-content-istanbul)，改一下 test 命令：

```
node --harmony node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage
```

再提交上 Github，[Travis CI](https://travis-ci.org/) 和 [COVERALLS](https://coveralls.io/) 都应该能看到构建结果了！

在 [COVERALLS](https://coveralls.io/) 的项目详情页，右侧状态栏的 `README BADGE` 点击 `BADGE URLS` 把东西复制出去就好了！


## References

- [Project status badges](http://bahmutov.calepin.co/project-status-badges.html)
- [Use istanbul test coverage on koa](https://cnodejs.org/topic/53145f8b33dbcb076d0b3352)
- [NodeICO](https://nodei.co/)
- [Travis CI](https://travis-ci.org/)
- [COVERALLS](https://coveralls.io/)
