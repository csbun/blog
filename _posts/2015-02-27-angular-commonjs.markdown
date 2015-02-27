---
layout: post
title:  "Angular 1.3.14 开始支持 CommonJS"
date:   2015-02-27 20:19:06
categories: Angular CommonJS Browserify
---

年前才刚刚写了篇关于[AngularJS with RequireJS](http://csbun.github.io/blog/angular/requirejs/2015/02/15/ng-with-requirejs.html)的文章，没想到前两天 Angular 在最新的 [1.3.14 更新文档](http://angularjs.blogspot.com/2015/02/new-angularjs-releases-140-beta5-and.html)中就提到支持 CommonJS 了。

今天有空，就把正在写的使用 RequireJS 的系统从之前的 CommonJS 模式，然后用 Browserify 构建。

## 模块加载

### RequireJS 模式

先看这一段用 RequireJS 写的代码

```javascript
define([
    'angular',
    'angular-route'
], function (angular) {
    'use strict';

    var ape = angular.module('ape', [
        'ngRoute'
    ]);
    return ape;
});
```

其中的 `angular` 和 `'angular-route'` 都是我用 bower 下载并在 `require.config()` 中定义的：

```javascript
require.config({
    paths: {
        'angular': 'public/bower_components/angular/angular',
        'angular-route': 'public/bower_components/angular-route/angular-route',
    },
    shim: {
        'angular': {
            exports : 'angular'
        },
        'angular-route': {
            deps: ['angular'],
            exports: 'angular-route'
        }
    },
    deps: ['public/routes']
});
</script>
</html>
```

可见这里的配置比较繁琐，而且我们还要被强迫要去了解 `angular-route` 的 module 定义是 `'ngRoute'`。


### CommonJS 模式

下面我们改用 CommonJS，首先下载不使用 bower，直接上 npm：

```
npm i --save angular
npm i --save angular-router
```

代码中的应用也非常简单（index.js）：

```javascript
'use strict';

var angular = require('angular');
var ape = angular.module('ape', [require('angular-route')]);

module.exports = ape;
```

没有任何配置。剩下的就是 Browserify 的事了：

```
browserify public/index.js -o build/bundle.js
```


## 模块定义

下面就是让自己定义的 module 也可以像上面那样使用，假定我们要定义一个别的什么模块（my.module.js）：

```javascript
'use strict';

var MODULE_NAME = 'my-module';
var angular = require('angular');

angular.module(MODULE_NAME, []);

module.exports = MODULE_NAME;
```

那么在上面的那个 index.js 中就可以用同样的方法：

```javascript
var ape = angular.module('ape', [
    require('angular-route'),
    require('./my.module'),
]);
```


## 更多技巧

根据上面的这个技巧，我们还可以做更多，例如我们想要提供一个 Service（my.service.js）：

```javascript
'use strict';

var SERVICE_NAME = 'MyService';
var angular = require('angular');

angular.module(require('./my.module'))
    .service(SERVICE_NAME, [function () {
        return {
            someMethod: function () {
                // ...
            }
        };
    }]);

module.exports = SERVICE_NAME;
```

然后在同样在 index.js 中使用：

```javascript
var ape = angular.module('ape', [
        require('angular-route'),
        require('./my.module'),
    ])
    .controller('AppCtrl', [
        require(./my.service),
        function (MyService) {
            // 这里的 MyService 是形参，不一定要和上面的 SERVICE_NAME 相同
            MyService.someMethod();
            // ...
        }
    ]);;
```

依旧，没有任何配置，使用过程中也不需要关注 my.module 和 my.service 到底起的是什么名字，只要知道文件名（路径）与其提供的 API 即可（这里的 API 指 someMethod）。

## 问题

用 Browserify 是爽了很多，配置少了，代码简洁了。虽然很久之前就是知道 Browserify，但真正开始用还是最近，难免还是会遇到有一些问题：

### require(controller) 问题

按上面的作法我写了个 my.controller.js

```javascript
var CTRL_NAME = 'MyCtrl';
var angular = require('angular');

angular.module('activity')
    .controller(CTRL_NAME, ['$scope', function ($scope) {
        // ...
    }]);

module.exports = CTRL_NAME;
```

但在 index.js 中却无法这样使用：

```javascript
ape.config(['$routeProvider', function ($routeProvider) {
    // 配置路由
    $routeProvider
        .when('/my', {
            controller: require('./my.controller'),
            templateUrl: 'path/to/my.controller/tpl.html'
        });
}])
```

只能这样：

```javascript
var CTRL_NAME = require('./my.controller');
ape.config(['$routeProvider', function ($routeProvider) {
    // 配置路由
    $routeProvider
        .when('/my', {
            controller: CTRL_NAME,
            templateUrl: 'path/to/my.controller/tpl.html'
        });
}])
```

### 非标准的模块

很多可以使用 bower, component, duo 可以下载的包，并不都发布到 npm 上，甚至没有 package.json 文件。这使我感觉 js 的各个生态圈的混乱，想单独使用一个包管理工具是有一定难度的。

当然，大部分的包管理工具还是提供各组配置来解决问题，Browserify 有 `browser` 配置。对于不是 CommonJS 的模块，可以使用 [browserify-shim](https://github.com/thlorenz/browserify-shim)（但我目前没用到）。

### 资源定位问题

在我看来 Browserify 最初是设计给 js 使用，对其他静态资源诸如 css、font、image 等的支持并不好。

虽然有类似 [cssify](https://www.npmjs.com/package/cssify)、[browserify-css](https://www.npmjs.com/package/browserify-css)、[insert-css](https://www.npmjs.com/package/insert-css) 等工具，但是其资源定位还是没有解决：

例如 css 中定义了一个 `background-image` 地址，那么合并后这个资源的地址该怎么办，似乎上面的工具没有很好地解决。至少我使用 cssify 去加载 [font-awesome](https://www.npmjs.com/package/font-awesome) 时就遇到了找不到字体文件的尴尬（路径完全不对）。

可能是我刚使用 Browserify 不久，不是非常了解，这个问题后续应该详细研究一下。

### 合并成一个大文件

Browserify 合并成一个大文件（甚至包含 css），体积不小，似乎和惯用的“按需加载”有矛盾的地方。
