---
layout: post
title:  "用 MutationObserver 和 Mutation events 监听 DOM 变化"
date:   2015-05-13 14:44:37
tags:
- Mutation Observer
- events
- DOM
---

最近需要做一个功能，检查页面 DOM 变化，然后对变化的某些 DOM 进行一些操作。于是上网搜索到 [MutationObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver)，中文文档已经很清楚了，看起来使用也很简单，于是就写下这么一个方法：

<!-- more -->

```javascript
var observeDOMChanges = (function () {
    // 对变化的 dom 的操作
    var changedHandler = function (element) {
        // do with element ...
    };
    // 兼容浏览器前缀
    var MutationObserver = window.MutationObserver ||
                           window.WebKitMutationObserver ||
                           window.MozMutationObserver;
    // MutationObserver 配置
    var MutationObserverConfig = {
        // 监听子节点
        childList: true,
        // 监听 href 属性
        attributes: true,
        // 监听整棵树
        subtree: true
    };
    // 监听器
    var observer = MutationObserver ? new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            // 处理 变化的 DOM
            changedHandler(mutation.target);
            // 处理 新增的 DOM
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(changedHandler);
            }
            // 删除的 DOM 无需处理 (mutation.removedNodes)
        });
    }) : undefined;
    
    return observer ? function () {
            observer.observe(document.body, MutationObserverConfig);
        } : function () {
            console.log('MutationObserver not support!');
        };
    }
})();
```

但是看看浏览器兼容情况，IE 要 11+ 吖！搞不来，于是只能把被抛弃的 [Mutation events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Mutation_events) 捡过来，据说性能也不是很好。

> This feature has been removed from the Web. Though some browsers may still support it, it is in the process of being dropped. Do not use it in old or new projects. Pages or Web apps using it may break at any time.

代码片段如下：

```javascript
var observeDOMChanges = (function () {
    // ...
    var bindMutationEvents = function (eventName) {
        document.body.addEventListener(eventName, function (e) {
            changedHandler(e.target);
        });
    };
    return function () {
        bindMutationEvents('DOMSubtreeModified');
        bindMutationEvents('DOMNodeInserted');
    };
})();
```

因为 Mutation events 也只支持到 IE9+，所以我们可以用 `addEventListener` 来进行判断，将兼容判断加起来完整代码就是：

```javascript
var observeDOMChanges = (function () {
    // 对变化的 dom 的操作
    var changedHandler = function (element) {
        // do with element ...
    };
    // 检查 MutationObserver 浏览器兼容
    var MutationObserver = window.MutationObserver ||
                           window.WebKitMutationObserver ||
                           window.MozMutationObserver;
    if (MutationObserver) {
        // MutationObserver 配置
        var MutationObserverConfig = {
            // 监听子节点
            childList: true,
            // 监听 href 属性
            attributes: true,
            // 监听整棵树
            subtree: true
        };
        // 监听器
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // 处理 变化的 DOM
                changedHandler(mutation.target);
                // 处理 新增的 DOM
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(changedHandler);
                }
                // 删除的 DOM 无需处理 (mutation.removedNodes)
            });
        });
        return function () {
            // 开始监听
            observer.observe(document.body, MutationObserverConfig);
        };
    } else if (document.body.addEventListener) {
        // addEventListener 和 Mutation events 都是 IE 9 以上才支持
        var bindMutationEvents = function (eventName) {
            document.body.addEventListener(eventName, function (e) {
                changedHandler(e.target);
            });
        };
        var binded = false;
        return function () {
            if (binded) {
                return;
            }
            binded = true;
            bindMutationEvents('DOMSubtreeModified');
            bindMutationEvents('DOMNodeInserted');
        };
    } else {
        // IE 8- 就不管了
        return function () {
            console.log('MutationObserver not support!');
        };
    }
})();
```

嗯，IE8- 怎么就可以放弃了呢？但是实在是没有什么好的办法，可以尝试用 `setTimeout` 定时去检查吧，但估计写起来又一大堆了 ╮(╯_╰)╭


另外在吐槽一点，Mutation events 在 webkit 上支持的情况和 IE 上是不同的，`DOMSubtreeModified` 在 IE 上可以监听到 attr 变化的，但 webkit 上是不行（不用 MutationObserver 的情况下）：

```javascript
// definition ...
observeDOMChanges();

// test
var el = document.createElement('a');
// works in IE and webkit via `DOMNodeInserted`
document.body.appendChild(el);
setTimeout(function() {
    // <a> -> <a href="xxx">
    // works in IE and webkit via `DOMSubtreeModified`
    el.href = 'path/to/somewhere';
    setTimeout(function() {
        // <a href="a"> -> <a href="b">
        // works in IE via `DOMSubtreeModified`
        // NOT works in webkit
        el.href = 'path/to/somewhere/else';
    }, 1000);
}, 1000);
```

所以，wekit 内核老老实实用 MutationObserver，是最好的。但某些 webkit 内核浏览器既不支持 MutationObserver，Mutation events 又支持不好，老衲就无能为力了。

最后，提醒一点：监听 DOM 变化修改 DOM 有风险，容易造成无限循环，上述例子的 `changedHandler` 必须做好判断，避免陷入无限循环中。
