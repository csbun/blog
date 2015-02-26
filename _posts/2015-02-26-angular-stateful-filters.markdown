---
layout: post
title:  "Angular Stateful Filters"
date:   2015-02-26 16:53:52
categories: Angular Stateful Filter Ajax
---

在 Angular 里面，经常使用 filter 来处理一些数据的显示问题。但当 filter 要使用到异步数据时就会变得有些麻烦，试了网上很多解决方案都不行，才发现和 Angular 版本升级有关：

Angular 在 1.3.0 之后的版本提出了 [Stateful filters](https://docs.angularjs.org/guide/filter) 的概念，但不是很推荐使用。

> ### Stateful filters
> 
> It is strongly discouraged to write filters that are stateful, because the execution of those can't be optimized by Angular, which often leads to performance issues. Many stateful filters can be converted into stateless filters just by exposing the hidden state as a model and turning it into an argument for the filter.
> 
> If you however do need to write a stateful filter, you have to mark the filter as $stateful, which means that it will be executed one or more times during the each $digest cycle.

使用方法只需对 filter 的返回函数加上这个 `$stateful` 属性即可：

```javascript
filterFn.$stateful = true;
```

下面是我自己的例子：
{% raw %}

```html
<div ng-controller="BusinessCtrl">
    <p>{{ bid | businessDisplay }}</p>
</div>
```
{% endraw %}

```javascript
angular.module('business', [])
    .factory('BusinessResource', [
        '$resouce',
        function ($resouce) {
            return $resource('api/business/:id');
        }
    ])
    .controller('BusinessCtrl', [
        '$scope',
        function ($scope) {
            $scope.bid = 1;
        }
    ])
    .filter('businessDisplay', [
        'BusinessResource',
        function (BusinessResource) {
            var businesses = BusinessResource.query();

            function realFilter (input) {
                var output = input;
                input = parseInt(input, 0);
                if (angular.isArray(businesses)) {
                    businesses.forEach(function (b) {
                        if (b.id === input) {
                            output = b.name;
                            return false;
                        }
                    });
                }
                return output;
            }
            // Stateful filters
            // 确保 BusinessResource.query() 异步请求之后 filter 重新执行
            realFilter.$stateful = true;

            return realFilter;
        }
    ]);
```
