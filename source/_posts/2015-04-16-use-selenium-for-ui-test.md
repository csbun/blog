---
layout: post
title:  "使用 Selenium 进行 UI 测试"
date:   2015-04-16 17:58:21
tags:
- Selenium
- ui
- test
---

`注：` 本文__未完成__。
看看这个 [使用 browser-perf 测试网页性能](http://csbun.github.io/blog/2015/02/use-browser-perf/) 也用了 Selenium

<!-- more -->

## 准备环境

[Selenium](http://www.seleniumhq.org/) 虽然官网做得很丑，但是他所支持的环境还是很全面的，这里我记录一下我在 node 上的使用过程。

首先我们创建一个 npm 项目，然后下载 [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)

```
npm init
npm i --save selenium-webdriver
```


## 最简单的测试

嗯，安装 npm 上的介绍，我们可以开始写一些测试代码了，创建一个 index.js：

```javascript
var webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;

var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

driver.get('http://www.google.com/ncr');
driver.findElement(By.name('q')).sendKeys('webdriver');
driver.findElement(By.name('btnG')).click();
driver.wait(until.titleIs('webdriver - Google Search'), 1000);
driver.quit();
```

运行 `node index.js` 就会看到你的 Firefox 弹出来然后打开了 google 首页，接着搜索了 'webdriver' 之后就关闭了。

> 假如你的网速不够快，在 1000ms 内还没跳转到搜索页（until.titleIs('webdriver - Google Search')）就会爆一个 timeout 的错误。


## Firefox IDE

不想写代码的话，还有 [Selenium IDE](http://www.seleniumhq.org/projects/ide/) 可以用。装到 Firefox 里面就可以了。点击插件按钮弹出工具框，然后选择需要的 Command 等，执行也能在 Log 中看到执行效果。


## 添加 webdriver

上面我们用到的是默认的 Firefox，如果要使用别的浏览器，就得下载一个扩展的 webdriver，官网上的 [Third Party Browser Drivers](http://www.seleniumhq.org/download/) 可以下载得到。解压下来是个可执行的文件，官方建议放在环境变量 PATH 目录下。但我没这么做（我就是想试试而已），我直接把解压出来的 [chromedriver](http://chromedriver.storage.googleapis.com/index.html?path=2.15/) 放在执行 node 的目录下，可以达到同样的效果。

然后修改一下 index.js 

```javascript
var driver = new webdriver.Builder()
    .forBrowser('chrome')
```

再次运行时弹出来的就是 chrome 了。


### Selenium for Android

TODO [selendroid](http://selendroid.io/)
这部分有点麻烦，后续再做。

## The Standalone Selenium Server

如果全部工作都是在当前一台机器上完成，其实不需要 Selenium Server，但如果我们将这些东西部署在某个远程机器上，又没办法运行其命令行，那么 Selenium Server 就提供了这么一个中间的 proxy，让你可以远程运行你的测试脚本。（官网还介绍了[其他情况](http://www.seleniumhq.org/docs/03_webdriver.jsp#webdriver-and-the-selenium-server)）

### 安装及启动

在安装可 JDK之后，在[这里下载](http://selenium-release.storage.googleapis.com/index.html)最新版本的 jar 包（假设我现在下载的是 2.45），然后运行

```
java -jar selenium-server-standalone-2.45.0.jar
```

这时候访问 [http://localhost:4444/wd/hub](http://localhost:4444/wd/hub) 就能看到 Server 了！

### 运行测试

之前我们已经有 chromedriver，我们可以在界面上 __Create Session__ 选择 Browser 为 __chrome__。

TODO 没搞懂怎么用

## 参考资料

- [沉鱼](https://github.com/fool2fish) 翻译的 [selenium 中文文档](https://github.com/fool2fish/selenium-doc)
- [Look! No Hands! - Using Selenium and Node.js for interactive UI testing](http://randomjavascript.blogspot.co.uk/2015/04/look-no-hands-using-selenium-and-nodejs.html)