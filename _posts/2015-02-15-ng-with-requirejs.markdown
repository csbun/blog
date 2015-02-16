---
layout: post
title:  "AngularJS with RequireJS"
date:   2015-02-15 18:52:39
categories: Angular RequireJS
---

## 前言

虽然 [Angular](https://angularjs.org/) 本身提供 `module` 的方法，但是她仅仅只是一个不全面的 __依赖管理__，并没有 __加载__ 的功能，于是我第一反应就是用上 [RequireJS](http://requirejs.org/)。

## 准备

我习惯用 [bower](http://bower.io/)，下载这些东西很简单：

```
bower install --save requirejs
bower install --save angular
bower install --save angular-route
```

## 目录结构

这次我的目录结构不想按官方 example 那样 `service, resource, controller, ...`划分，而是直接按 module 划分，粗略如下

```
ape
├── index.html
└── public
    ├── bower_components
    │   ├── angular
    │   ├── angular-route
    │   └── requirejs
    ├── dashboard
    │   └── dashboard.html
    ├── business
    │   ├── business.controller.js
    │   ├── business.html
    │   └── business.service.js
    ├── modules.js
    └── routes.js
```

> 嗯，我们的项目就叫 ape 吧。

## 编码

捣鼓的过程并没有我想象中简单，这里我就直接写出最终的结果：

### 入口

`index.html` 只加载 `require.js`。

```html
<!DOCTYPE HTML>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>ng-RequireJS</title>
</head>

<body ng-controller="AppCtrl" class="nifty-ready pace-done">
    <h1>{{title}}<!-- 这里 `两个大括号包着 title` 显示不出开，囧 --></h1>
    <div ng-view></div>
</body>

<script src="public/bower_components/requirejs/require.js"></script>
<script type="text/javascript">
require.config({
    paths: {
        'angular': 'public/bower_components/angular/angular',
        // 'angular-resource': 'lib/angular-resource',
        'angular-route': 'public/bower_components/angular-route/angular-route',
        'modules': 'public/modules',
    },
    shim: {
        'angular': {
            exports : 'angular'
        },
        // 'angular-resource': { deps:['angular']},
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

这里不用 `<html ng-app="ape">`，而是后面使用 `angular.bootstrap` 来启动。而且必须要这么做，不然会报找不到 module 之类的错误。

### 模块声明

我在 `modules.js` 中声明了全部的 `module`，方便使用。

```javascript
define([
    'angular',
    'angular-route'
], function (angular) {
    'use strict';

    return {
        business: angular.module('business', []),
        ape: angular.module('ape', [
                'ngRoute',
                'business'
            ])
    };
});
```

### 路由

`routes.js` 是 `require.config` 定义的入口文件，在这里指定路由 hash，并用 `angular.bootstrap` 

```javascript
define([
    'angular',
    'modules',
    'public/business/business.controller'
], function (angular, modules) {
    'use strict';

    // 其实这里也可以使用 angular.module('ape').config(...)
    modules.ape
        .config([
            '$routeProvider',
            function ($routeProvider) {
                $routeProvider
                    .when('/dashboard', {
                        templateUrl: 'public/dashboard/dashboard.html'
                    })
                    .when('/business', {
                        controller: 'BusinessCtrl',
                        templateUrl: 'public/business/business.html'
                    })
                    .otherwise({
                        redirectTo: '/dashboard'
                    });
            }
        ])
        .controller('AppCtrl', [
            '$scope', 
            function ($scope) {
                $scope.title = 'APE';
            }
        ]);

    angular.bootstrap(document, ['ape']);
});
```

### 子模块

子模块基本就是业务内容了，这里以 business 模块为例：

#### business.service.js

```javascript
define([
    'angular',
    'modules'
], function (angular, modules) {
    'use strict';

    modules.business
        .service('BusinessService', function () {
            return {
                // ...
            };
        });
});
```

#### business.controller.js

```javascript
define([
    'modules',
    './business.service'
], function (modules) {
    'use strict';

    modules.business
        .controller('BusinessCtrl', [
            '$scope',
            'BusinessService',
            function ($scope, BusinessService) {
                // ...
            }
        ]);
});
```


## 后记

按 RequireJS 的逻辑，其实根据依赖关系，在进入到 `router.js` 时就要把全部文件都加载下来，但这样总比把全部的 script 一个个插入到 html 强（当然要是代码合并的话就没什么好讲了）。

另外还无意中发现一个 [ocLazyLoad](https://github.com/ocombe/ocLazyLoad)，实现懒加载 Angular 模块，有空再研究一下。

