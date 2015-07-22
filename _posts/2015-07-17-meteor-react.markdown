---
layout: post
title:  "Meteor + React"
date:   2015-07-17 22:13:05
categories: Meteor React
---

## Install

如果还没有安装 [Meteor](https://www.meteor.com/)，那么在命令行中输入：

If you have not yet installed Meteor, do that:

```sh
curl https://install.meteor.com | /bin/sh
```

## Init

安装成功之后初始化项目也是相当容易的。
同时，因为我们要使用 [React 插件](https://atmospherejs.com/meteor/react)，于是在创建项目之后就立马添加了插件。

```sh
meteor new project-name
cd project-name
meteor add react
```

## Structuring

### Html

[Meteor](https://www.meteor.com/) 是会自动将需要的包和文件插入到 html 中的，因此我们可以看到 `project-name.html` 中只声明的简单的 `<head>` 和 `<body>` 没有看到任何的 `<script>` 或 `<link>` 等。

### Server and Client

[Meteor](https://www.meteor.com/) 的本意就是服务端和客户端跑同一份代码，但有一些代码的确也是只在服务端或客户端运行的，可以用以下方法区别：

```javascript
if (Meteor.isClient) {
  // do CLIENT things here
}
if (Meteor.isServer) {
  // do SERVER things here
}
```

特别的，可以在根目录下创建 `client` 和 `server` 文件夹，其中的文件就分别只在客户端和服务端运行。其他更复杂的情况可以看 [这里](http://docs.meteor.com/#/full/structuringyourapp)

### File Load Order

这里直接引用官网的介绍了：

> 1. HTML template files are always loaded before everything else
> 2. Files beginning with main. are loaded last
> 3. Files inside any lib/ directory are loaded next
> 4. Files with deeper paths are loaded next
> 5. Files are then loaded in alphabetical order of the entire path

## Run

运行工程，跑起来

```sh
meteor
```

## Add ReactRouter

平常我使用 [React](facebook.github.io/react/) 都会同时使用 [React Router](http://rackt.github.io/react-router/)，但在 [Meteor](https://www.meteor.com/) 中却没有这么容易，因为它自身的 npm 很不好使（不是我们平常的 `npm i` 能解决的）。好在 [教程](http://react-in-meteor.readthedocs.org/en/latest/client-npm/) 写得比较清楚：

### Add the relevant Meteor packages

添加 `meteorhacks:npm` 和 `cosmos:browserify`

```sh
meteor add meteorhacks:npm cosmos:browserify
```

### Add the npm modules you want to packages.json

在项目根目录创建 `packages.json` 文件，用来声明 dependences

```json
{
  "react-router": "0.13.3",
  "externalify": "0.1.0"
}
```

### Configure Browserify and transforms in app.browserify.options.json

添加 `lib/app.browserify.options.json` 用于声明 Browserify 的配置：

```json
{
  "transforms": {
    "externalify": {
      "global": true,
      "external": {
        "react": "React.require"
      }
    }
  }
}
```

### Add the appropriate require statements to app.browserify.js

创建 `lib/app.browserify.js` 文件，在这里面就可以引用 npm 包了！

```javascript
ReactRouter = require("react-router");
```

### Use React Router

我们可以在 `client/main.jsx` 中定义路由：

```javascript
var { Link, Route, DefaultRoute, RouteHandler } = ReactRouter;

var App = React.createClass({
  render() {
    return <div>
        <nav>
          <Link to="home">HOME</Link>
        </nav>
        <RouteHandler/>
      </div>;
  }
});


var Somewhere = React.createClass({
  render() {
    return <div>Somewhere</div>;
  }
});

var routes = (
  <Route name="home" path="/" handler={App}>
    <Route name="somewhere" path="pate/:to/:somewhere" handler={Somewhere}/>
    { /* more <Route> here */ }
    <DefaultRoute handler={ProjectList}/>
  </Route>
);

Meteor.startup(function () {
  ReactRouter.run(routes, function (Handler) {
    React.render(<Handler/>, document.body);
  });
});

```

## less

如果要使用 [less](http://lesscss.org)，也是很简单的，

```sh
meteor add less
```

之后在根目录创建 less 文件即可。不需要手动编译也不需要插入文件到 html 中。

## Router

比较出名的第三方插件有下面两个：

There are two main third-party packages to choose between:

- [Iron Router](https://atmospherejs.com/iron/router)
- [Flow Router](https://atmospherejs.com/meteorhacks/flow-router)

但是因为我只需要一个简单的服务端的路由，所以我就用了官方提供的 [这个](http://docs.meteor.com/#/full/webapp)：

But I just want an simple server-side router, so I use the [offical one](http://docs.meteor.com/#/full/webapp):

```sh
meteor add webapp
```

例如我们需要一个地址为 `http://localhost:3000/mock` 的接口，返回 JSON 数据：

For example, we create an api on `http://localhost:3000/mock` which provide a JSON response:

```javascript
WebApp.connectHandlers.use('/mock', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  var mockData = {
    mock: true
  };
  res.end(EJSON.stringify(mockData), 'utf-8');
});
```

其中的 `req` 和 `res` 就 [Node.js](https://nodejs.org/) 的 [http.IncomingMessage](https://nodejs.org/api/http.html#http_http_incomingmessage) 和 [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)，用法也相同。

The `req` and `res` in the callback function is the same on [Node.js](https://nodejs.org/api/http.html#http_http)

## Reference

[METEOR Documentation](http://docs.meteor.com/#/full/)

[Two weeks with React + Meteor](http://info.meteor.com/blog/two-weeks-with-react-and-meteor)

[Getting Started with Meteor, React, and React Router](http://alexgaribay.com/2015/07/06/getting-started-with-meteor-react-and-react-router/)

[Using client-side modules from NPM with Browserify](http://react-in-meteor.readthedocs.org/en/latest/client-npm/)

[React Router](http://rackt.github.io/react-router/)
