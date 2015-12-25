title: Tree-shaking ES2015
banner: gallery/taiwan/DSC03388.jpg
tags:
  - ES2015
  - Browserify
  - Rollup
  - webpack
date: 2015-12-25 21:27:23
---

🌲🎅 ~~ 圣诞快乐 ~~ 🎉✨

## Rollup

之前看到 [rollup.js](http://rollupjs.org/) 就觉得很有趣，后来终于有空，把我的小项目 [silly-datetime](https://github.com/csbun/silly-datetime) 改成了 ES2015 然后用 Rollup 转成 CommonJS 和 UMD 两个版本分别给 [npm](https://www.npmjs.com/) 和 [Bower](http://bower.io/) 使用。

<!-- more -->

简单贴一下使用方法：在项目根目录下创建一个 _[rollup.js](https://github.com/csbun/silly-datetime/blob/master/rollup.js)_ 文件，调用 Rollup 的 API，内容如下：

```javascript
var rollup = require( 'rollup' );
var babel = require('rollup-plugin-babel');

rollup.rollup({
  // 入口文件
  entry: 'src/index.js',
  plugins: [
    babel()
  ]
}).then( function ( bundle ) {
  // CommonJS
  bundle.write({
    format: 'cjs',
    dest: 'dest/index.js'
  });
  // UMD
  bundle.write({
    format: 'umd',
    moduleName: 'SillyDatetime',
    dest: 'dest/index.umd.js'
  });
});
```

命令行运行这个文件 `node rollup.js` 即可生成 `dest/index.js` 和 `dest/index.umd.js`。如果希望方便改组件被别的项目调用，就需进行一些配置声明，包括 _package.json_

```json
{
  "main": "dest/index.js",
  "jsnext:main": "src/index.js"
}
```

和 _bower.json_：

```json
{
  "main": "dest/index.umd.js",
}
```

然而这并不是 Rollup 最强大功能的体现，因为这看不出 Tree-shaking。

## Tree-shaking

> eliminate unused library code

我们可以看到 [silly-datetime](https://github.com/csbun/silly-datetime) 提供了 `format`、`fromNow` 和 `locate` 3 个方法，然而大部分时间我们只需要用到其中的一个，如果将这么一个完整的文件 bundle 起来，将有很多无用的代码。

下面，我们将创建这么一个示例说明情况，首先我们新建一个项目，引用上述的 [silly-datetime](https://github.com/csbun/silly-datetime):

```sh
npm init
npm i silly-datetime --save
touch index.js
```

然后我们修改 _index.js_ ：

```javascript
'use strict';

import { format } from 'silly-datetime';

let getStr = () => {
    return format(new Date());
};

let formatedDate = getStr();
console.log(`now is ${formatedDate}`);
```

### Browserify

我们先试试 Browserify，但在这之前我们需要添加一下 babel 插件：

```sh
npm i babelify babel-preset-es2015 --save-dev
```

并配置一下 _package.json_

```json
{
  "browserify": {
    "transform": [
      [ "babelify", { "presets": [ "es2015" ] } ]
    ]
  }
}
```

运行 `browserify index.js > dest/bundle.browserify.js` 后我们可以看到 bundle 文件用的是之前已经用 rollup 生成的 `node_modules/silly-datetime/dest/index.js`。于是我们将源码复制出来

```sh
cp node_modules/silly-datetime/src/index.js lib/silly-datetime.es2015.js
```

并改一下 _index.js_：

```javascript
import { format } from './lib/silly-datetime.es2015.js';
```

再来一次如何？看到 bundle 文件已经将 ES2015 转成了 CommonJS 的 ES5:

```javascript
// ...
{1:[function(require,module,exports){
'use strict';

var _datetimeEs = require('./lib/silly-datetime.es2015.js');

var getStr = function getStr() {
    return (0, _datetimeEs.format)(new Date());
};

var formatedDate = getStr();
console.log('now is ' + formatedDate);

},{"./lib/silly-datetime.es2015.js":2}],2:[function(require,module,exports){
'use strict';
/* 注意这里 */
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.format = format;
exports.locate = locate;
exports.fromNow = fromNow;

// ...
}]}
```

明显这里的 `locate` 和 `fromNow` 是不会被消灭的，即使使用了 [UglifyJS](https://github.com/mishoo/UglifyJS)。另外，细心的同学会发现这段代码：

```javascript
(0, _datetimeEs.format)(new Date());
```

为什么会这样？看一下 [Dr. Axel Rauschmayer](http://rauschma.de/) 的 [Why is (0,obj.prop)() not a method call?](http://www.2ality.com/2015/12/references.html)。

### Rollup

我们看看 Rollup 的表现，一样要添加 babel 插件：

```sh
npm i rollup-plugin-babel babel-preset-es2015-rollup --save-dev
```

并配置一下 _rollup.config.js_（详见 [Command-Line-Interface](https://github.com/rollup/rollup/wiki/Command-Line-Interface)）：

```javascript
import babel from 'rollup-plugin-babel';

export default {
  entry: 'index.js',
  dest: 'dest/bundle.rollup.js',
  format: 'umd',
  plugins: [ babel() ]
};
```

和 _.babelrc_（详见 [rollup-plugin-babel](https://github.com/rollup/rollup-plugin-babel)）：

```json
{
  "presets": [ "es2015-rollup" ]
}
```

这个时候执行 `rollup -c rollup.config.js` 我们能看到生成的代码量非常的少：

```javascript
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}(this, function () { 'use strict';

  function getDateObject(datetime) {
    // ...
  }

  function format(datetime, formatStr) {
    // ... 这里使用了 getDateObject()
  }

  // import { format } from 'silly-datetime';

  var getStr = function getStr() {
      return format(new Date());
  };

  var formatedDate = getStr();
  console.log('now is ' + formatedDate);

}));
```

可以看出，完全没有多余的代码，而且甚至模块都没有了，看不到任何的 `require` 定义，`import` 的内容直接 inline 到主文档中了。

<!-- 这回我就好奇了，如果依赖关系再复杂一点，还会是怎样呢？且听下回分解。 TODO: 复杂的例子 -->

但是，上面这两个例子都有一个问题，为嘛我需要将源码复制出来？难道不能直接 import ？

> Yes, we can!

文章最上面我们的组件已经定义了 `"jsnext:main": "src/index.js"`，所以在使用 rollup 的这个 [语法糖](https://github.com/rollup/rollup/wiki/jsnext:main) 后，我们就能直接将该组件 import 进来：

```javascript
import { format } from 'silly-datetime';
```

但是这样的 bundle 文件不会包含 npm package 的源码，紧急只是转化成 `var format = require('silly-datetime);`，所以我们还需要安装一个插件：

```sh
npm install --save-dev rollup-plugin-npm
```

加到配置里 _rollup.config.js_ 面去：

```javascript
import babel from 'rollup-plugin-babel';
import npm from 'rollup-plugin-npm';

export default {
  entry: 'index.js',
  dest: 'dest/bundle.rollup.js',
  format: 'umd',
  plugins: [
    babel(),
    npm({
      jsnext: true,
    })
  ]
};
```

出来的 bundle 文件就和上面的效果一样了~

### webpack 2

终于到这一步了，就是因为看了 Axel 的这篇 [Tree-shaking with webpack 2 and Babel 6](http://www.2ality.com/2015/12/webpack-tree-shaking.html) 才有了这篇文章。

[webpack](https://webpack.github.io/) 2 目前还是 beta 版本，但是我们还是可以使用的。按照博士的说法，因为 [babel-preset-es2015](https://www.npmjs.com/package/babel-preset-es2015) [包含](https://github.com/babel/babel/blob/7b369674163e40241ff41e63458c8d98298e942a/packages/babel-preset-es2015/package.json) 了 [babel-plugin-transform-es2015-modules-commonjs](https://www.npmjs.com/package/babel-plugin-transform-es2015-modules-commonjs)，而 commonjs 的打包方式注定不能实现我们的 Tree-shaking 大计，所以我们不能直接使用 babel-preset-es2015，而是直接使用他所包含的除了 commonjs 以外的其他全部依赖 plugin。

这回要安装的东西就多了，如果是 npm2 的就在 _package.json_ 里直接添加 devDependences 好了：

```json
{
  "devDependencies": {
    "webpack": "^2.0.2-beta",
    "babel-loader": "^6.2.0",
    "babel-plugin-transform-es2015-template-literals": "^6.3.13",
    "babel-plugin-transform-es2015-literals": "^6.3.13",
    "babel-plugin-transform-es2015-function-name": "^6.3.13",
    "babel-plugin-transform-es2015-arrow-functions": "^6.3.13",
    "babel-plugin-transform-es2015-block-scoped-functions": "^6.3.13",
    "babel-plugin-transform-es2015-classes": "^6.3.13",
    "babel-plugin-transform-es2015-object-super": "^6.3.13",
    "babel-plugin-transform-es2015-shorthand-properties": "^6.3.13",
    "babel-plugin-transform-es2015-computed-properties": "^6.3.13",
    "babel-plugin-transform-es2015-for-of": "^6.3.13",
    "babel-plugin-transform-es2015-sticky-regex": "^6.3.13",
    "babel-plugin-transform-es2015-unicode-regex": "^6.3.13",
    "babel-plugin-check-es2015-constants": "^6.3.13",
    "babel-plugin-transform-es2015-spread": "^6.3.13",
    "babel-plugin-transform-es2015-parameters": "^6.3.13",
    "babel-plugin-transform-es2015-destructuring": "^6.3.13",
    "babel-plugin-transform-es2015-block-scoping": "^6.3.13",
    "babel-plugin-transform-es2015-typeof-symbol": "^6.3.13",
    "babel-plugin-transform-es2015-modules-commonjs": "^6.3.13",
    "babel-plugin-transform-regenerator": "^6.3.13",
  }
}

```

`npm i` 时会说 peer dependency 冲突，请忽略之，因为我们在用 beta 的 webpack。然后写一下我最不喜欢的 _webpack.config.js_：

```javascript
var path = require('path');
var webpack = require('webpack'); // webpack 2
var dir = __dirname;

module.exports = {
    entry: path.join(dir, 'index.js'),
    output: {
        path: path.join(dir, 'dest'),
        filename: 'webpack.bundle.js',
    },
    module: {
        loaders: [{
            loader: 'babel-loader',
            test: dir,
            query: {
                // presets: ['es2015'],

                // All of the plugins of babel-preset-es2015,
                // minus babel-plugin-transform-es2015-modules-commonjs
                plugins: [
                    'transform-es2015-template-literals',
                    'transform-es2015-literals',
                    'transform-es2015-function-name',
                    'transform-es2015-arrow-functions',
                    'transform-es2015-block-scoped-functions',
                    'transform-es2015-classes',
                    'transform-es2015-object-super',
                    'transform-es2015-shorthand-properties',
                    'transform-es2015-computed-properties',
                    'transform-es2015-for-of',
                    'transform-es2015-sticky-regex',
                    'transform-es2015-unicode-regex',
                    'check-es2015-constants',
                    'transform-es2015-spread',
                    'transform-es2015-parameters',
                    'transform-es2015-destructuring',
                    'transform-es2015-block-scoping',
                    'transform-es2015-typeof-symbol',
                    ['transform-regenerator', { async: false, asyncGenerators: false }],
                ]
            }
        }]
    },

    plugins: [
        // Avoid publishing files when compilation fails
        new webpack.NoErrorsPlugin()
    ],
};
```

因为 webpack 也不认识 `jsnext:main`，我们还是需要直接 import ES2015 的源码：

```javascript
import { format } from './lib/silly-datetime.es2015.js';
```

运行 `webpack` 看看 _dest/webpack.bundle.js_（我稍微删减并格式化了一下代码）：

```javascript
/******/ (function(modules) { // webpackBootstrap
      // ...
/******/ })([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

  /* harmony export */ exports["format"] = format;
  /* unused harmony export locate */;
  /* unused harmony export fromNow */;

  function getDateObject(datetime) {
    // ...
  }

  function format(datetime, formatStr) {
    // ... 这里使用了 getDateObject()
  }

  function locate(arg) {
    // ...
  }

  function fromNow(datetime) {
    // ...
  }

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

  /* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_silly_datetime_es2015_js__ = __webpack_require__(0);
  'use strict';

  var getStr = function getStr() {
    return /* harmony import */ __WEBPACK_IMPORTED_MODULE_0__lib_silly_datetime_es2015_js__["format"](new Date());
  };

  var formatedDate = getStr();
  console.log('now is ' + formatedDate);

/***/ }
/******/ ]);
```

从第 7 至 9 行可以看到， `locate` 和 `fromNow` 并没有被 export，虽然下方还能看到这两个方法的声明，但是只要经过 UglifyJs，这两个方法必然 [会被消除](http://www.2ality.com/2015/12/webpack-tree-shaking.html#how_webpack_2_eliminates_unused_exports)：

> ##### How webpack 2 eliminates unused exports
webpack 2, a new version that is in beta, eliminates unused exports in two steps:

> - First, all ES6 module files are combined into a single bundle file. In that file, exports that were not imported anywhere are not exported, anymore.

> - Second, the bundle is minified, while eliminating dead code. Therefore, entities that are neither exported nor used inside their modules do not appear in the minified bundle. Without the first step, dead code elimination would never remove exports (registering an export keeps it alive).

可以运行 `webpack --optimize-minimize` 看到执行效果：

```
Hash: b8357dea1720f84e6a76
Version: webpack 2.0.2-beta
Time: 9812ms
            Asset       Size  Chunks             Chunk Names
webpack.bundle.js  935 bytes       0  [emitted]  main
    + 2 hidden modules

WARNING in webpack.bundle.js from UglifyJs
Dropping unused function locate [./lib/silly-datetime.es2015.js:84,16]
Dropping unused function fromNow [./lib/silly-datetime.es2015.js:120,16]
Dropping unused variable LOCALE_EN [./lib/silly-datetime.es2015.js:55,6]
Dropping unused variable LOCALE_ZH_CN [./lib/silly-datetime.es2015.js:66,6]
Dropping unused variable _curentLocale [./lib/silly-datetime.es2015.js:77,4]
Dropping unused variable DET_STD [./lib/silly-datetime
```

文件体积由原来的 5.68 kB 下降到了 935 bytes（当然这里也有 UglifyJs 的功劳）。

### 再回到 Browserify

受上面的启发，在 Browserify 里面也能这样麽？我把 _package.json_ 配置成这样：

```json
{
  "browserify": {
    "transform": [
      [ "babelify", {
        "plugins": [
          "transform-es2015-template-literals",
          "transform-es2015-literals",
          "transform-es2015-function-name",
          "transform-es2015-arrow-functions",
          "transform-es2015-block-scoped-functions",
          "transform-es2015-classes",
          "transform-es2015-object-super",
          "transform-es2015-shorthand-properties",
          "transform-es2015-computed-properties",
          "transform-es2015-for-of",
          "transform-es2015-sticky-regex",
          "transform-es2015-unicode-regex",
          "check-es2015-constants",
          "transform-es2015-spread",
          "transform-es2015-parameters",
          "transform-es2015-destructuring",
          "transform-es2015-block-scoping",
          "transform-es2015-typeof-symbol",
          ["transform-regenerator", { "async": false, "asyncGenerators": false }]
        ]
      } ]
    ]
  }
}
```

再运行 `browserify index.js > dest/bundle.browserify.js`，结果以失败告终...
没有 commonjs，browserify 应该还是干不来的，如果有成功的童鞋麻烦告诉我怎么破。

## 碎碎念

本文特别是 webpack 一节，参(chao)考(xi) [Tree-shaking with webpack 2 and Babel 6](http://www.2ality.com/2015/12/webpack-tree-shaking.html)。上面大部分源码可以在我的 GitHub 上面 [找到](https://github.com/csbun/tree-shaking-demo)。

