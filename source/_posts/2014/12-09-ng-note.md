---
layout: post
title:  "Angular 1.x 学习笔记 —— 入门"
date:   2014-12-09 21:11:20
tags:
- Angular
---

最简单的例子
---

### example

```html
<body ng-app="app">
    <p><input ng-model="text"></p>
    <p>input: {{text}}</p>
</body>
```

```javascript
angular.module('app', []);
```

<!-- more -->

### ng-app

ng 脚本的作用域

### data-binding

数据模型



- `{% raw %}{{model}}{% endraw %}` 用于数据展示
- `ng-model` 实现的是数据的双向绑定



稍微有点功能
---

### example

```html
<body ng-controller="Ctrl">
    <p><input ng-model="text"></p>
    <p><button ng-click="showMe()">Show Me</button></p>
</body>
```

```javascript
angular.module('app', [])
    .controller('Ctrl', function ($scope) {
        $scope.text = 'hello!';
        $scope.showMe = function () {
            alert($scope.text);
        };
    });
```

### controller

控制器，操作 `ng-controller`。

### $scope

可以认为就是上面那个被操作的 controller 的作用域


迭代器
---

### example

```html
<ul>
    <li ng-repeat="item in list">
        <span item="{{age}}">{{item.name}}</span>
        <span class="gray">{{item.carrier}}</span>
    </li>
</ul>
```

```javascript
$scope.list = [{
    age: 2,
    carrier: 'AT&T',
    name: 'MOTOROLA ATRIX\u2122 4G'
}, ...];
```


依赖注入
---

### example

```javascript
angular.module('app', [])
    .service('DataService', function () {
        var data = [{
            age: 2,
            carrier: 'AT&T',
            name: 'MOTOROLA ATRIX\u2122 4G'
        }, ...];
        return {
            all: function() {
                return data;
            }
        };
    })
    .controller('Ctrl', function ($scope, DataService) {
        $scope.list = DataService.all();
    });
```

注意到 `service` 里的 `DataService` 是我们自定义的，但在下面的 `controller` 中却可以直接使用。这个是 ng 过控制器构造函数的参数名字来推断依赖服务名称。

### 更好理解的方式

```javascript
angular.module('app', [])
    .service('DataService', function () {
        // ...
    })
    .controller('Ctrl', [
        '$scope',
        'DataService',
        function ($scope, DataService) {
            // ...
        }
    ]);
```

`controller` 传入数组：数组最后一个元素是 `controller` 的构造函数，前面的元素是需要注入到这个 `controller` 的服务。

这样也同时解决了压缩代码时变量名混淆的问题。

> 还有一种 `Ctrl.$inject = ['$scope', 'DataService'];` 的形式，但个人不太喜欢。


Directive
---

### example

```html
<body ng-controller="Ctrl">
    <p>First Directive</p>
    <list></list>

    <p>Second Directive</p>
    <list></list>
</body>
```

```javascript
angular.module('app', [])
    .service('DataService', function () {
        // ...
    })
    .controller('Ctrl', angular.noop)
    .directive('list', function (DataService) {
        return {
            restrict: 'E',
            templateUrl: 'tpl/list.html',
            link: function ($scope) {
                $scope.list = DataService.all();
            }
        };
    });
```

### restrict

[官网解释](https://docs.angularjs.org/guide/directive)

>The restrict option is typically set to:
> - `'A'` - only matches attribute name
> - `'E'` - only matches element name
> - `'C'` - only matches class name
>
>These restrictions can all be combined as needed:
> - `'AEC'` - matches either attribute or element or class name


### link vs controller

网上有好多讨论，大致意思是：

- `link` 做的是数据、事件绑定、dom 修改一类的操作（在 dom 渲染后）
- `controller` 主要做业务逻辑，directive 之间的通信（[官网](https://docs.angularjs.org/guide/directive)有例子）

### $scope

没有指定的情况下，`$scope` 指向的是所在的 controller 的作用域。因此上面的例子中的 `$scope` 是同一个！若有任何操作，两边是同步的。

可以通过下面的方式指定 `scope`。

```javascript
app.directive('list', function (DataService) {
    return {
        restrict: 'E',
        scope: {}, // look at this!!!
        templateUrl: 'tpl/list-2.html',
        link: function ($scope) {
            console.log($scope.list);
            $scope.list = DataService.all();
        }
    };
});
```

### $element

- 封装了简单的 jQuery 操作
- 可配合 jQuery 使用

### attrs

当前 directive 的 attributes


Filters
---

### example

```html
<input type="text" placeholder="Search" ng-model="search.$">
<ul class="a">
    <li ng-repeat="item in list | filter:search:strict">
        <span item="{{age}}">{{item.name}}</span>
        <span class="gray">{{item.carrier}}</span>
    </li>
</ul>
```

### 自定义

```html
<span>{{num | fixedTwo}}</span>
```

```javascript
app.filter('fixedTwo', function () {
    return function (input) {
        try {
            return input.toFixed(2);
        } catch (e) {
            return input;
        }
    };
});
```


Module
---

### example

```javascript
angular.module('util', [])
    .service('DataService', function ($http) {
        // ...
    })
    .controller('UtilCtrl', angular.noop)
    .directive('list', function (DataService) {
        // ...
    });

angular.module('app', ['util']);
```

这里模块 `app` 引用了模块 `util`，因此可以使用其中的指令 `list`。


Route
---

### example

使用插件 `angular-route`。

```html
<div ng-view></div>
```


```javascript
angular.module('app', ['ngRoute', 'util'])
    .config(function($routeProvider) {
        // 路由配置
        $routeProvider.when('/home', {
                templateUrl: 'tpl/home.html',
                controller: 'HomeCtrl'
            })
            .when('/detail', {
                templateUrl: 'tpl/detail.html',
                controller: 'DetailCtrl'
            })
            // 默认进入 页面管理
            .otherwise({
                redirectTo: '/home'
            });
    })
    .controller('HomeCtrl', function ($scope) {
        $scope.id = 'Home';
    })
    .controller('DetailCtrl', function ($scope) {
        $scope.name = 'Detail';
    });
```


一些链接
---

- [官网](https://angularjs.org/)
- [AngularJS中文社区](http://angularjs.cn/)

