---
layout: post
title:  "ServiceWorker"
date:   2015-06-02 20:57:35
categories: ServiceWorker
---

我们知道，浏览器是单线程的，使用 ServiceWorker 可以在后台创建脱离于主线程的 worker 线程，用于异步处理一些与页面元素、界面交互无关的工作。

## 运行环境

### 浏览器支持

- Chrome >= 40.0
- Firefox >= 33.0
- Opera >= 24
- IE、Safari 不支持

### 需要 HTTPS

由于安全问题，ServiceWorker 只能在 HTTPS 环境下运行。但是在开发环境，`localhost` 和 `127.0.0.1` 也是允许的。

### 调试

Chrome DevTools 提供了查看当前运行中的 ServiceWorker 的工具，在浏览器中打开 [chrome://inspect/#service-workers](chrome://inspect/#service-workers) 即可。

另外，在开发者工具的 Sources 界面有一个 Service Workers 的 tab，在那也可以 Unregister 当前使用的 ServiceWorker。


## 生命周期

ServiceWorker 一般会经历下面一个生命周期：

- Download
- Install
- Activate

当浏览器下载好 ServiceWorker 之后会马上 install，install 成功后标记为 activated，之后进入闲置状态，等待事件触发。原则上，同一个 ServiceWorker 在其注册（Register）的域（Scope）下只会 install 和 activate 一次，即便重新页面刷新、同时多开都不会（因为 ServiceWorker 是完全脱离页面主线程在后台运行的）。

浏览器在一段时间后会重新下载 ServiceWorker（MDN 上说[不超过24小时](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker_API#Download.2C_install_and_activate)，我没有进行验证）。若下载后如果发现有更新，会在后台进行 install，但不会立即 activate 而是处于 waiting 状态。当没有页面加载旧的 ServiceWorker 时，新的 ServiceWorker 才会 activate（但我关掉 chrome 的所有 tab 再打开并没有触发新的 ServiceWorker，大概是还没有下载新的文件吧，有必要就在调试工具中干掉就好）。


## 使用 ServiceWorker

### register

我们可以在页面上用下面的方式注册（[register](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register)）一个 ServiceWorker：

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-test/sw.js', {
    scope: '/sw-test/'
  }).then(function (reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function (error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
};
```

这里指定了 scope 是 `/sw-test/`，不指定的话默认是最后这个 `.js` 文件所在的 path（MDN 上说默认是 `/` 是不对的），例如 `register('/s/w/sw.js')` 的 scope 为 `location.origin/s/w/`。而且指定的 scope 只能在默认的目录或之下，不能在其父级目录，例如，不能这样 `register('/s/w/sw.js', {scope: '/s/'})`。另外，这个地址也可以是相对路径。

`register()` 方法返回的是一个 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)，如果能够下载到这个 `/sw-test/sw.js` 文件就会进入 `then` 否则 `catch`。

### install

register 成功之后就会触发 ServiceWorker 的 [install 事件](https://developer.mozilla.org/en-US/docs/Web/API/InstallEvent)，可以在 `sw.js` 文件中绑定：

```javascript
// Set the callback for the install step
// 这里的 `self` 即为当前的 ServiceWorker，用 `this` 也可以
self.addEventListener('install', function (event) {
    // Perform install steps
});
```

通常我们在 ServiceWorker 里面需要缓存或者预加载一些静态资源，那么我们可以开启一个 [cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) 来保存他们：

```javascript
var CACHE_NAME = 'v1';
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        cache.addAll(urlsToCache).then(function () {
          console.log('cache success.');
        });
      }).catch(function (error) {
        // TODO 我在 chrome 上面跑会报 cache.addAll is not a function
        console.error('cache failed:', error);
      })
  );
});
```

### activate

上面说过旧的 ServiceWorker 全部失效后新的 ServiceWorker 才会 activated，那么我们可以在 activate 时将旧的不需要的 cache 清除掉：

```javascript
var expectedCacheNames = ['v2', 'v3'];
self.addEventListener('activate', function(event) {
  // Active worker won't be treated as activated until promise resolves successfully.
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (expectedCacheNames.indexOf(cacheName) == -1) {
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### fetch

在 ServiceWorker 闲置时，我们可以让其监听主线程上的 request，进行处理。例如，我们可以把一些请求的返回数据 cache 下来，这样即使应用在离线状态下也可以使用。（听起来和 Application Cache 好像吖）

```javascript
var CACHE_NAME = 'v1';
self.addEventListener('fetch', function (event) {
  var eventResponse = caches.match(event.request)
    .then(function (response) {
      // 命中 cache，直接返回
      if (response) {
        return response;
      }

      // 没有命中，则克隆一个 request 出来（因为 request 是 stream）
      var fetchRequest = event.request.clone();
      // 真实请求
      return fetch(fetchRequest).then(function (response) {
        // 假设我们只 cache 有效的 response
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // 因为 response 是 stream，所以要 clone 让浏览器和 cache 分别自行处理
        var responseToCache = response.clone();
        // 请求的返回值放入 cache
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseToCache);
        });
        // 同时输出
        return response;
      });
    });
  // 响应 fetch 事件输出
  event.respondWith(eventResponse);
});
```

这里的 fetch 会将页面上所有请求都截获，包括当前页面的 http、img、css、script 和 XMLHttpRequest 等，所以当我把服务停掉，刷新页面时都能正常访问！因为上述资源都被 cache 了，不会有请求到服务端，因此更新页面之后也不会立即更新！因此使用需谨慎，或者更改逻辑，区分资源，不要全部都 cache。


## 对比 web worker

<!-- TODO -->

- [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker)
- [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)


## 参考资料

- [ServiceWorker on MDN](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker)
- [ServiceWorker API on MDN](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker_API)
- [Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker_API/Using_Service_Workers)
- [Introduction to Service Worker](http://www.html5rocks.com/en/tutorials/service-worker/introduction/)