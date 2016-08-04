title: Vue 2.0 Server-Side Rendering
banner: gallery/taiwan/P50926-141725.jpg
date: 2016-08-03 16:52:04
tags:
- Vue
- ssr
---

[Vue 2.0](https://github.com/vuejs/vue/issues/2873) is now in beta6. What I am going to do is checkout how to use [SSR (server-side rendering)](https://www.npmjs.com/package/vue-server-renderer).

<!-- more -->

## Simple Example

Let's make a project first and install some dependencies:

```bash
mkdir vue-ssr
cd vue-ssr
npm init
npm i vue@next vue-server-renderer --save
```

Here is what we get in *package.json*:

```json package.json
{
  "name": "vue-ssr",
  "version": "1.0.0",
  "dependencies": {
    "vue": "^2.0.0-beta.6",
    "vue-server-renderer": "^2.0.0-beta.6"
  }
}
```

Now we can render a Vue instance to string:

```javascript ssr.js
const Vue = require('vue');
const renderer = require('vue-server-renderer').createRenderer();

const Cmp = Vue.component('my-cmp', {
  template: `<p>this is a component</p>`,
});

const App = Vue.component('my-app', {
  components: {
    MyCmp,
  },
  template: `
    <div class="server-uptime">
      <h1>{{name}}</h1>
      <h2>age {{age}}</h2>
      <my-cmp></my-cmp>
    </div>
  `
});

const vm = new App({
  data: {
    name: 'Hans',
    age: 18,
  }
})

renderer.renderToString(vm, (err, html) => {
  if (err){
    console.error(err.message);
    console.error(err.stack);
  }
  console.log(html);
});
```

Run `node ssr.js` comes out the html string:

```html
<div server-rendered="true" class="server-uptime"><h1>Hans</h1> <h2>age 18</h2> <p>this is a component</p></div>
```

 The root element has a `server-rendered="true"` attribute. We'll talk about it [later](#TODO).

## Bundle Renderer

In most cases, we use numerous *.vue* files. As we have:

```html src/App.vue
<template>
  <div class="my-app">
    <h1>{{name}}</h1>
    <h2>age: {{age}}</h2>
    <my-cmp :name="name"></my-cmp>
  </div>
</template>

<script>
import MyCmp from './MyCmp.vue';

function randNum() {
  return Math.round(Math.random() * 100);
}

export default {
  components: {
    MyCmp,
  },
  data() {
    return {
      name: `Hans-${randNum()}`,
      age: randNum(),
    };
  },
};
</script>

<style>
.my-app {
  background: #eee;
}
</style>
```

```html src/MyCmp.vue
<template>
  <div>
    <p>Hello {{ name }}</p>
    <p>Welcome to China!</p>
  </div>
</template>

<script>
export default {
  props: [ 'name' ],
  replace: false,
};
</script>
```

In our server-side entry point, export a function. The function will receive the render context object (passed to bundleRenderer.renderToString or bundleRenderer.renderToStream), and should return a Promise, which should eventually resolve to the app's root Vue instance:

```javascript server.js
// server-entry.js
import Vue from 'vue';
import App from './App.vue';
const app = new Vue(App);

// the default export should be a function
// which will receive the context of the render call
export default function(context) {
  return new Promise((resolve, reject) => {
    resolve(app);
  });
};
```

We can easily use [webpack](https://webpack.github.io/) + [vue-loader](https://www.npmjs.com/package/vue-loader) with the bundleRenderer.

```bash
npm i webpack vue-loader@next babel-loader babel-preset-es2015 --save-dev
```

 We do need to use a slightly different *webpack.config.js* and entry point for our server-side bundle.

```javascript webpack/webpack.server.js
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  target: 'node', // !different
  entry: path.join(projectRoot, 'src/server.js'),
  output: {
    libraryTarget: 'commonjs2', // !different
    path: path.join(projectRoot, 'dist'),
    filename: 'bundle.server.js',
  },
  module: {
    loaders: [
      {
        test: /\.vue$/,
        loader: 'vue',
      },
      {
        test: /\.js$/,
        loader: 'babel',
        include: projectRoot,
        exclude: /node_modules/,
      },
    ]
  },
};
```

And *.babelrc* is needed:

```json .babelrc
{
  "presets": [ "es2015" ]
}
```

Run `webpack --config webpack/webpack.server.js` we'll get a *dist/bundle.server.js* file as the server-side bundle which can be read in server-side.

```javascript ssr-bundle.js
const fs = require('fs');
const path = require('path');
const vueServerRenderer = require('vue-server-renderer');

const filePath = path.join(__dirname, './dist/bundle.server.js')
const code = fs.readFileSync(filePath, 'utf8');
const bundleRenderer = vueServerRenderer.createBundleRenderer(code);

bundleRenderer.renderToString((err, html) => {
  if (err){
    console.log(err.message);
    console.log(err.stack);
  }
  console.log(html);
});
```

Run `node ssr-bundle.js` comes out a similar html string:

```html
<div server-rendered="true" class="my-app"><h1>Hans-97</h1> <h2>age&colon; 20</h2> <div><p>Hello Hans-97</p> <p>Welcome to China&excl;</p></div></div>
```

## Client Side Hydration

First of all, we have to create another bundle file for client-side. A *webpack.client.js* is needed. It is almost the same with *webpack.server.js* except **NOT** having `target: 'node'` and `output.libraryTarget: 'commonjs2'`, which bundle the client-side entry file:

```javascript src/client.js
import Vue from 'vue';
import App from './App.vue';

const VueApp = Vue.extend(App);
new VueApp({
  el: '.my-app',
});
```

Then we will improve the above *ssr-bundle.js* example to an express server:

```javascript server/index.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const vueServerRenderer = require('vue-server-renderer');

const app = express();

// Server-Side Bundle File
const serverBundleFilePath = path.join(__dirname, '../dist/bundle.server.js')
const serverBundleFileCode = fs.readFileSync(serverBundleFilePath, 'utf8');
const bundleRenderer = vueServerRenderer.createBundleRenderer(serverBundleFileCode);

// Client-Side Bundle File
const clientBundleFilePath = path.join(__dirname, '../dist/bundle.client.js');
const clientBundleFileUrl = '/bundle.client.js';

// Server-Side Rendering
app.get('/', function (req, res) {
  bundleRenderer.renderToString((err, html) => {
    if (err){
      res.status(500).send(`
        <h1>Error: ${err.message}</h1>
        <pre>${err.stack}</pre>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Vue 2.0 SSR</title>
          </head>
          <body>
            ${html}
            <script src="${clientBundleFileUrl}"></script>
          </body>
        </html>`);
    }
  });
});

// Client-Side Bundle File
app.get(clientBundleFileUrl, function (req, res) {
  const clientBundleFileCode = fs.readFileSync(clientBundleFilePath, 'utf8');
  res.send(clientBundleFileCode);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`);
});
```

>  For each render call, the code will be re-run in a new context using Node.js' vm module. This ensures your application state is discrete between requests, and you don't need to worry about structuring your application in a limiting pattern just for the sake of SSR.

Now, start the server and hit [http://127.0.0.1:3000/](http://127.0.0.1:3000/) on your favorite browser. But we get a warning message in the DevTool:

```
[Vue warn]: The client-side rendered virtual DOM tree is not matching server-rendered content. Bailing hydration and performing full client-side render.
```

Cause we have the `data()` function returning a random value in *src/App.vue*, so we got different html string form server and client via virtual-DOM. Let's make some change:

```html src/App.vue
<template>
  <div class="my-app">
    <h1>{{name}}</h1>
    <h2>age: {{age}} <button @click="plus">+1</button></h2>
    <my-cmp :name="name"></my-cmp>
  </div>
</template>

<script>
import MyCmp from './MyCmp.vue';

export default {
  components: {
    MyCmp,
  },
  data() {
    return {
      name: 'Hans',
      age: 0,
    }
  },
  created() {
    console.log('created > ' + this.age);
    ++this.age;
  },
  methods: {
    plus() {
      this.age++;
    },
  },
};
</script>

<style>
.my-app {
  background: #eee;
}
</style>
```

Refresh the page and click the `+1` button. See what's happening on both server and client side. Checkout [this repo](https://github.com/csbun/vue2-ssr-example) to see the full example.
