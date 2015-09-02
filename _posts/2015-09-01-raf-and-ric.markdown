---
layout: post
title:  "requestAnimationFrame 和 requestIdleCallback"
date:   2015-09-01 21:06:01
categories: requestAnimationFrame requestIdleCallback
---

## requestAnimationFrame

`requestAnimationFrame` 应该不是一个新鲜货了，[Angular](https://angularjs.org/) 就有 [$$rAF](https://github.com/angular/angular.js/blob/master/src/ng/raf.js)，[iScroll](http://cubiq.org/iscroll-5) 也用他来实现动画功能，很久之前也在某些博客中看到某些 MVVM 框架的 `nextTick` 是用 `requestAnimationFrame` 实现的（[Avalon](http://rubylouvre.github.io/mvvm/) 还是 [Vue](http://vuejs.org/) 不记得了）。

[MDN](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) 上是这么介绍的：

> The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint.

非常详细，也就是在下次 repaint 之前赶紧把 callback 的内容执行一遍。如果需要做一个连续动画，就需要在 callback 里面再调用一次 `requestAnimationFrame`，像这样：

```javascript
function animationCallback() {
    doSomeAnimation();
    if (!animationNotEnd) {
        requestAnimationFrame(animationCallback);
    }
}
requestAnimationFrame(animationCallback);
```

通常我的显示器都是 60Hz 的，因此刷新频率也就是每秒 60 次，相当于每 16.7 毫秒执行一次上面的 `animationCallback`。这个不禁然人想起了 `setTimeout`，特别是我们在写 canvas 的时候也经常会有类似的用法：

```javascript
function animationCallback() {
    doSomeAnimation();
    if (!animationNotEnd) {
        setTimeout(animationCallback, 16);
    }
}
setTimeout(animationCallback, 0);
```

简直就是一毛一样，但是 `setTimeout` 是不可预测的，很不靠谱哇，关于这点可以阅读这篇文章 [On the nature of timers](http://blog.getify.com/on-the-nature-of-timers/)。又由于兼容性问题，就有了这个 [polyfill](https://gist.github.com/paulirish/1579671)。


## requestIdleCallback

`requestIdleCallback` 这货又是什么鬼？从名字上看，应该是 **请求**(request) **空闲**(Idle) 的 **回调**(Callback)，
