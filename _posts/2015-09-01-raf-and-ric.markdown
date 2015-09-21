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
animationCallback();
```

简直就是一毛一样，但是 `setTimeout` 是不可预测的，很不靠谱哇，关于这点可以阅读这篇文章 [On the nature of timers](http://blog.getify.com/on-the-nature-of-timers/)。又由于兼容性问题，就有了这个 [polyfill](https://gist.github.com/paulirish/1579671)。


## requestIdleCallback

这货又是什么鬼？网上的资源非常少，能找到的只有这篇 [Using requestIdleCallback](https://developers.google.com/web/updates/2015/08/27/using-requestidlecallback)，而本文下列内容，大部分都是参(chao)考(xi)上面这篇文章。

从名字上看，`requestIdleCallback` 应该是 **请求**(request) **空闲**(Idle) 的 **回调**(Callback)，顾名思义，就是在浏览器空闲的时候进行一些操作。  
所谓的空闲时间，我们还是要回到刚刚的说到刷新频率中来，当浏览器在这个 16.7ms 的区间中，浏览器的计算、重绘等工作并不一定需要用尽这全部的时间，而剩下的时间就是“空闲时间”。当然，如果用户并没有任何操作时，也是有一大堆的“空闲时间”的，这就没有刷新频率什么事了。  
有了这些空闲时间，我们可以进行一些 **不是非常重要的工作**，如记录统计日志等。这样的好处是这些所谓的 **不是非常重要的工作** 就不会和用户操作冲突（例如点击需要动画且记录日志），影响用户体验。

> requestIdleCallback 现在只是草案，下面涉及到的代码是在 Chrome Canary(47.0.2499.0) 上运行的。

### 使用 requestIdleCallback

`requestIdleCallback` 接收 2 个参数，一个回调函数和一个超时时间：

```javascript
var myNonEssentialWork = deadline => {
    console.log(deadline.timeRemaining());
    // ...
};
var timeout = 2000;
requestIdleCallback(myNonEssentialWork, timeout);
```

- 当“空闲”时会调用 myNonEssentialWork 函数
- 如果一直“不空闲”，超过 timeout 时长也会执行 myNonEssentialWork
- myNonEssentialWork 接收一个 IdleCallbackDeadline 对象
    + deadline.timeRemaining() 当前的空闲时间还剩多少
    + deadline.didTimeout 是否因为超时强制执行


### 使用 requestIdleCallback 更新 DOM

当我们有类似 “图片懒加载” 或者 “滚动加载更多” 这一类需求的时候，就可以用 `rIC` 和 `rAF` 组合的最佳实践来完成：

首先，在空闲时间将需要的文档片段创建好：

```javascript
let documentFragment;
let myNonEssentialWork = deadline => {
    if (!documentFragment) {
        documentFragment = document.createDocumentFragment();
    }

    // 这要有时间且还有活，就干
    while (deadline.timeRemaining() > 0 && elementsToAdd.length > 0) {
        // 创建代码片段
        let elToAdd = elementsToAdd.pop();
        let el = document.createElement(elToAdd.tag);
        el.textContent = elToAdd.content;
        documentFragment.appendChild(el);

        // 不要着急插入 body，交给下一个 rAF
        ++countNonEssentialWork;
        scheduleVisualUpdateIfNeeded();
    }
    // 如果还有任务，就下个 空闲时间 再工作
    if (elementsToAdd.length > 0) {
        requestIdleCallback(myNonEssentialWork, timeout);
    }
};
```

通过 rAF 将代码片段插入 body 中：

```javascript
let isVisualUpdateScheduled = false;
let appendDocumentFragment = () => {
    document.body.appendChild(documentFragment);
    documentFragment = null;
    isVisualUpdateScheduled = false;
}

let scheduleVisualUpdateIfNeeded = () => {
    if (!isVisualUpdateScheduled) {
        isVisualUpdateScheduled = true;
        requestAnimationFrame(appendDocumentFragment);
    }
}
```

我们来一个完整的代码看看吧：

```javascript
var elementsToAdd = [];

function test(num) {
    'use strict';
    for (let i = 0; i < num; i++) {
        elementsToAdd.push({
            tag: 'p',
            content: Math.random()
        });
    }
    start();
}


function start() {
    'use strict';
    let documentFragment;
    let isVisualUpdateScheduled = false;
    const timeout = 2000;
    
    // 记录 appendDocumentFragment 运行了多少次
    let countAppendDocument = 0;
    // 记录 myNonEssentialWork 的 while 运行了多少次
    let countNonEssentialWork = 0;

    let appendDocumentFragment = () => {
        console.log('countAppendDocument:', ++countAppendDocument);
        document.body.appendChild(documentFragment);
        documentFragment = null;
        isVisualUpdateScheduled = false;
    }

    let scheduleVisualUpdateIfNeeded = () => {
        if (!isVisualUpdateScheduled) {
            isVisualUpdateScheduled = true;
            requestAnimationFrame(appendDocumentFragment);
        }
    }
    
    let myNonEssentialWork = deadline => {
        if (!documentFragment) {
            documentFragment = document.createDocumentFragment();
        }

        // 这要有时间且还有活，就干
        while (deadline.timeRemaining() > 0 && elementsToAdd.length > 0) {
            // 创建代码片段
            var elToAdd = elementsToAdd.pop();
            var el = document.createElement(elToAdd.tag);
            el.textContent = elToAdd.content;

            documentFragment.appendChild(el);

            // 不要着急插入 body，交给下一个 rAF
            ++countNonEssentialWork;
            scheduleVisualUpdateIfNeeded();
        }
        console.log('countNonEssentialWork:', countNonEssentialWork);
        console.log('elementsToAdd.length:', elementsToAdd.length);
        if (elementsToAdd.length > 0) {
            requestIdleCallback(myNonEssentialWork, timeout);
        }
    };

    requestIdleCallback(myNonEssentialWork, timeout);
}
```

运行 `test(10000)`，看看结果：

```
countNonEssentialWork: 241
elementsToAdd.length: 9759
countAppendDocument: 1
countNonEssentialWork: 4878
elementsToAdd.length: 5122
countAppendDocument: 2
countNonEssentialWork: 10000
elementsToAdd.length: 0
countAppendDocument: 3
```

> 我试过几次，每次的运行结果都不一样，append 次数有多有少，看来真的是看浏览器是不是“空闲”了。
