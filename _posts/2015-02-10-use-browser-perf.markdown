---
layout: post
title:  "使用 browser-perf 测试网页性能"
date:   2015-02-10 09:53:01
categories: browser-perf Selenium performance
---

## 安装环境

- npm 安装 [browser-perf](https://github.com/axemclion/browser-perf)
- 下载 [Selenium Server](http://www.seleniumhq.org/download/)

## 启动 Selenium Server

在下载到的 `selenium-server-standalone-2.x.x.jar` 所在目录下运行：

{% highlight ruby %}
java -jar selenium-server-standalone-2.x.x.jar -role hub
{% endhighlight %}

此时访问 `http://localhost:4444/grid/console` 即可看到启动效果。

> 相关 [wiki](https://code.google.com/p/selenium/wiki/Grid2)

如果要使用浏览器测试，则得运行：

{% highlight ruby %}
java -jar selenium-server-standalone-2.x.x.jar -browser
{% endhighlight %}


## 测试

在命令行执行：

{% highlight ruby %}
browser-perf http://yourwebsite.com --browsers=chrome,firefox --selenium=localhost:4444/wd/hub
{% endhighlight %}

> 前提是你本机安装了这些浏览器

各个浏览器弹出来打开 http://yourwebsite.com 之后就会出现一个性能报表，各项目详解见[这里](https://github.com/axemclion/browser-perf/wiki/Metrics)


## 使用第三方 WebDriver

[Selenium Server](http://www.seleniumhq.org/) 的[下载页](http://www.seleniumhq.org/download/)提供了很多第三方 WebDriver。这里我下载了第三方的 [chromedriver](https://sites.google.com/a/chromium.org/chromedriver/)，和 `selenium-server-standalone-2.x.x.jar` 放在同一目录，然后运行：

{% highlight ruby %}
java -jar selenium-server-standalone-2.x.x.jar -Dwebdriver.chrome.driver=chromedriver
{% endhighlight %}

后面的操作就一样了。
