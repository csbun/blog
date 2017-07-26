title: 我试了一下 weex
banner: gallery/sri-lanka/P60412-162831.jpg
date: 2017-06-15 20:03:59
tags:
- weex
- vue
---

## 致读者

weex 有风险，入门需谨慎。

<!-- more -->

## 入门

### Hello World

什么都不装，先到 [dotWe](http://dotwe.org/vue) 中看看效果：

{% asset_img dotWe.png dotWe %}

这是一段 vue 的代码，一个图标和一行文字：

```vue
<template>
  <div class="wrapper">
    <image :src="logoUrl" class="logo"></image>
    <text class="title">Hello {{target}}</text>
  </div>
</template>

<style>
  .wrapper { align-items: center; margin-top: 120px; }
  .title { font-size: 48px; }
  .logo { width: 360px; height: 82px; }
</style>

<script>
  export default {
    data: {
      logoUrl: 'https://alibaba.github.io/weex/img/weex_logo_blue@3x.png',
      target: 'World'
    }
  }
</script>
```

将其贴在左侧代码区，点击 `RUN` 即可在 preview 区看到 Web 实现的效果。如果要看 Native 版，则可以下载 [Weex Playground][weex-playground]，安装到手机中后扫描右侧的 QRCode 即可。

dotWe 只能运行一个 vue 文件，做单个组件的测试还是可以的，在实际业务应用的时候明显是不够，因此我们需要一个完整的工程项目。

### 初始化

在已经有 Node 的前提下，安装配套工具并初始化项目：

```sh
npm install -g weex-toolkit
weex init weex-challenger
cd weex-challenger
npm i
```

注：我这里使用的版本是 weex-toolkit(1.0.5)

### 运行

#### Web

开两个命令行分别运行：

```sh
npm run dev
```

```sh
npm run serve
```

看到 `serving /Users/hans/workspace/weex-challenger on port 8080` 即可打开 [http://127.0.0.1:8080/](http://127.0.0.1:8080/)。然而很不幸页面是空白的，因为还有一个 [commit](https://github.com/weexteam/weex-toolkit/commit/5793aa32d120ff2b8b629f7b860862d7a31dfc6a) 没有发布。所以我们只要同样改一下 _weex.html_ 的 15 行 `weex-vue-render` 的路径即可：

```html
  <script src="./node_modules/weex-vue-render/dist/index.js"></script>
```

👈 左边的预览窗口就会出现 weex 的 LOGO。完整代码请看 [这里](https://github.com/csbun/weex-challenger/tree/v0.1.0)。

{% asset_img preview.png Web 预览效果 %}

#### Native

同样使用 [Weex Playground][weex-playground] 扫描上面 [http://127.0.0.1:8080/](http://127.0.0.1:8080/) 中的的二维码，即会在 Native App 中打开一个新的 Page 显示上面相同的界面。

[weex-playground]: https://weex.incubator.apache.org/cn/playground.html

### 单页面应用

SPA 的应该是一个很常见的需求，我们现在就在默认的初始化项目上使用 Vue 全家桶实现一个简单的单页面应用。

#### vue-router

假设我们的场景是有 Foo，Bar 两个 Tab，点击分别进入两个不同的页面。首先我们要有一个入口组件承载 _app.vue_：

```vue
<template>
  <div @androidback="back">
    <div class="nav">
      <text class="nav-i" @click="jumpFoo">Foo</text>
      <text class="nav-i" @click="jumpBar">Bar</text>
    </div>
    <router-view style="flex:1"></router-view>
  </div>
</template>

<script>
  export default {
    methods: {
      back: function() {
        this.$router.back();
      },
      jumpFoo: function() {
        this.$router.push('/foo');
      },
      jumpBar: function() {
        this.$router.push('/bar/0');
      },
    }
  }
</script>
```

其中 `jumpFoo` 和 `jumpBar` 是使用 [Weex 官方限制](https://weex.incubator.apache.org/cn/references/vue/difference-of-vuex.html#编程式导航) 的 [编程式导航](https://router.vuejs.org/zh-cn/essentials/navigation.html) 的方式来实现页面跳转。

在 _router.js_ 文件中，我们给 `FooView` 和 `BarView` 绑定对应的路径 `/foo` 和 `/bar`：

```javascript
import Router from 'vue-router';
import FooView from './foo.vue';
import BarView from './bar.vue';

Vue.use(Router);

export default new Router({
  routes: [
    { path: '/foo', component: FooView },
    { path: '/bar/:id', component: BarView },
  ],
});
```

最后在入口文件 _app.js_ 中绑定 `App` 和 `router`：

```javascript
import App from './src/app.vue';
import router from './src/router';

export default new Vue(Vue.util.extend({ el: '#root', router }, App));

router.push('/foo');
```

完整的代码示例请看 [这里](https://github.com/csbun/weex-challenger/tree/v0.2.0)，更新的内容看这个 [commit](https://github.com/csbun/weex-challenger/commit/8e7f0443a0336f30cdc33ee9fc3bc4ae1b079a1b)。

## 发布

因为玩过 [React Native](https://facebook.github.io/react-native/)，打包成一个应用本是一件不复杂的事情，然而在 weex 中就没那么规范了。

[weex-toolkit](https://www.npmjs.com/package/weex-toolkit) 虽然已经集成了 [weexpack](https://www.npmjs.com/package/weexpack) 的功能，但二者初始化出来的项目完全不同。也就是 `weex-toolkit init` != `weexpack create`，以致于后面的 `weexpack platform` 也无法继续。暂时没空折腾了。。。
