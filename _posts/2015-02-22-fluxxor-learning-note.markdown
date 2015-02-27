---
layout: post
title:  "Fluxxor 学习笔记"
date:   2015-02-22 12:03:53
categories: react flux fluxxor
---

## 从 Flux 开始

前段时间想真正用 React 写个运营管理后台，然后就抓起 Flux 开搞，模式基本就是我之前写的[这篇文章](http://csbun.github.io/blog/flux/react/2014/12/31/flux-learning-note.html) 那样。但问题很快就出现了，一个字“繁琐”：我要写大量的 actions 和 stores，每个 store 还要写一些相似的逻辑去 bind 对应的 actions。

## 转向 Fluxxor

于是，出于偷懒的长远考虑，我开始尝试用 [Fluxxor](http://fluxxor.com/) 来重写我刚刚写好的小模块，并在内添加一些新的功能。

### Router

使用 [react-router](https://github.com/rackt/react-router) 路由作为程序入口：

```javascript
var React = require('react');
var Router = require('react-router');

var DefaultRoute = Router.DefaultRoute;
var Route = Router.Route;

// ...

// react-router
var routes = (
    <Route name="app" path="/" handler={Application}>
        <Route name="activity" handler={Activity} />
        <Route name="business" handler={Business} />
        <DefaultRoute handler={Dashboard} />
    </Route>
);
Router.run(routes, function (Handler) {
    React.render(<Handler flux={flux}/>, document.body);
});
```

其中的 `Application` 可以认为是全局的 view，必须指定 `RouteHandler`（有点像 Angular 的 ng-view）。

```javascript
'use strict';

var React = require('react/addons');
var Router = require('react-router');
var cx = React.addons.classSet;
var RouteHandler = Router.RouteHandler;

// 应用本身
var Application = React.createClass({
    // 初始化数据
    getInitialState: function (argument) {
        return {};
    },
    // 渲染
    render: function() {
        // id="container" 的 className
        var clazz = cx({
            'show-menu': this.state.isMenuShow
        });

        return (
            <div id="container" className={clazz}>
                ...
                <div id="page-content">
                    {/** @jsx {RouteHandler} [主体内容：通过 react-router 渲染] */}
                    <RouteHandler />
                </div>
            </div>
        );
    }
});
module.exports = Application;
```

另外的 `Activity`、`Business` 和 `Dashboard` 均为 View 层的 React Components，和常规的 Flux 写法没明显区别，这里暂时不详述。

### flux

我们为全局定义一个 flux。理论上，整个系统是可以只需要一个 flux 的：

```javascript
var Fluxxor = require('fluxxor');

var stores = {};
var actions = {};
var flux = new Fluxxor.Flux(stores, actions);

// react-router
// ...
Router.run(routes, function (Handler) {
    React.render(<Handler flux={flux}/>, document.body);
});
```

我理解这里 `new Fluxxor.Flux` 是通过 Fluxxor 向 Flux 注册 stores 和 actions，前者会自动完成 `(actions) -> Dispatcher -> (registered callback) -> Stores ` 这一过程。

### actions

#### 定义

在 View 层我们会抛出一些事件，这时我们可以在 `SomeModuleActions.js` 中定义：

```javascript
var request = require('superagent');
var ApplicationConstants = require('../constants/ApplicationConstants');

module.exports = function () {
    return {
        // 显示、收起左侧菜单
        toggleMainNav: function () {
            this.dispatch(ApplicationConstants.TOGGLE_MAIN_NAV, {});
        },
        // 加载某些数据
        load: function (query) {
            var that = this;
            that.dispatch(ApplicationConstants.LOAD, {});
            request.get(ApplicationConstants.URL_LOAD)
                .type('application/json')
                .end(function (res) {
                    if (200 === res.status && res.body.success) {
                        that.dispatch(ApplicationConstants.LOAD_SUCCESS, res.body);
                    } else {
                        that.dispatch(ApplicationConstants.LOAD_FAIL, res);
                    }
                });
        }
    };
};
```

#### 注册

上面我们在 `ApplicationActions.js` 中定义了两个 action，于是我们可以将其注册到 Flux 中：

```javascript
var stores = {};
var actions = require('./actions/ApplicationActions');
var flux = new Fluxxor.Flux(stores, actions);
```

此时，相当于：

```javascript
var actions = {
    toggleMainNav: function () {...},
    load: function () {...}
}
```

但很快，我就发现：当模块变多时，各个模块的 actions，很容易就和其他模块重名，很不利于多人并行开发。

还好 Fluxxor 提供了“命名空间”的模式，于是可以这么用：

```javascript
var actions = {
    ApplicationActions: require('./actions/ApplicationActions'),
    SomeOtherActions: require('./actions/SomeOtherActions')
}
```

这样就相当于：

```javascript
var actions = {
    ApplicationActions: {
        toggleMainNav: function () {...},
        load: function () {...}
    },
    SomeOtherActions: {
        ...
    }
}
```

#### 调用

这样看起来优雅多了。下面在 View 层就可以调用了，我们向 `Application.react.js` 添加对应的 action：

```javascript
var Application = React.createClass({
    // ...
    componentDidMount: function () {
        // 创建时加载数据
        this.getFlux().ApplicationActions.load();
    },
    render: function() {
        // ...
        return (
            <div id="container" className={clazz}>
                ...
                <a className="mainnav-toggle" href="#" onClick={this._onToggleMainNav}>
                    <i className="fa fa-navicon fa-lg" />
                </a>
            </div>
        );
    },
    // 点击 toggle 事件
    _onToggleMainNav: function (e) {
        e.preventDefault();
        this.getFlux().actions.ApplicationActions.toggleMainNav();
    }
});
```

### stores

#### 定义

接下来就要让 action 影响到 store 去。在 `ApplicationStore.js` 中定义：

```javascript
var Fluxxor = require('fluxxor');
var ApplicationConstants = require('../constants/ApplicationConstants');

var ApplicationStore = Fluxxor.createStore({
    initialize: function () {
        this.isMenuShow = true;
        this.loading = false;
        this.error = null;
        this.list = [];
        this.isLoaded = false;

        this.bindActions(
            ApplicationConstants.TOGGLE_MAIN_NAV, this.onToggleMainNav,
            ApplicationConstants.LOAD, this.onLoad,
            ApplicationConstants.LOAD_SUCCESS, this.onLoadSuccess,
            ApplicationConstants.LOAD_FAIL, this.onLoadFail
        );
    },

    _emitChange: function () {
        this.emit('change');
    },

    onToggleMainNav: function () {
        this.isMenuShow = !this.isMenuShow;
        this._emitChange();
    },

    // 准备加载数据
    onLoad: function () {
        this.loading = true;
        this._emitChange();
    },

    // 加载成功
    onLoadSuccess: function (payload) {
        this.loading = false;
        this.isLoaded = true;
        this.error = null;
        this.list = payload.list;
        this._emitChange();
    },

    // 加载失败
    onLoadFail: function (payload) {
        this.loading = false;
        this.error = payload.error;
        this._emitChange();
    }
});
module.exports = ApplicationStore;
```
其中的 `this.bindActions` 方法把 action 绑定了对应的 handler。

#### 注册

然后注册到 flux 中：

```javascript
var ApplicationStore = require('./stores/ApplicationStore');
var stores = {
    ApplicationStore: new ApplicationStore()
};
var actions = {...};
var flux = new Fluxxor.Flux(stores, actions);
```

#### 使用

在 View 层我们就可以把这些数据放到 state 中：

```javascript
var React = require('react/addons');
var Fluxxor = require('fluxxor');

var FluxMixin = Fluxxor.FluxMixin(React);
var StoreWatchMixin = Fluxxor.StoreWatchMixin;
var cx = React.addons.classSet;

var ApplicationStoreName = 'ApplicationStore';

var Application = React.createClass({
    mixins: [FluxMixin, StoreWatchMixin(ApplicationStoreName)],

    // 初始化数据
    getInitialState: function (argument) {
        return {};
    },
    // 获取 fluxxor 注入的 store
    getStateFromFlux: function () {
        var flux = this.getFlux();
        return flux.store(ApplicationStoreName);
    },
    // 渲染
    render: function() {
        var clazz = cx({
            'show-menu': this.state.isMenuShow
        });
        return ...;
    }
});
```


