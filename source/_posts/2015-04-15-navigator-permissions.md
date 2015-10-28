---
layout: post
title:  "用 navigator.permissions 检查浏览器权限"
date:   2015-04-15 21:27:51
tags:
- permissions
---

Chrome 43 增加了 `navigator.permissions` 接口用于检查当前浏览器权限状态。

<!-- more -->

`query()` 方法可以查看指定的权限，返回的是 ES6 的 Promise 对象，而 permission 的值有：

- granted: the user has explicitly accepted the application to send notification
- denied: the user has explicitly denied the application to send notification
- default: the user decision is unknown, but the application will act as if denied were picked

> 我在 44.0.2367.0 canary (64-bit) 测试的结果，并不是 `default` 而是 `prompt`。
> 目前 Firefox 和 Safari 貌似还没实现这个功能。

下面的例子是查看是否有 geolocation 权限，且监听该权限的变化：

```javascript
navigator.permissions.query({
  name: 'geolocation'
}).then(function (permissionStatus) {
  // 当前权限
  console.log('geolocation permission status is ', permissionStatus.status);
  // 监听改变
  permissionStatus.onchange = function() {
    console.log('geolocation permission status has changed to ', this.status);
  };
});
```

参考文章：

[Permissions API for the Web](http://updates.html5rocks.com/2015/04/permissions-api-for-the-web)
