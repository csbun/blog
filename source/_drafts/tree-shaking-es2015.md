title: Tree-shaking ES2015
tags:
- ES2015
- Rollup
- webpack
---

## Rollup

之前看到 [rollup.js](http://rollupjs.org/) 就觉得很有趣，后来终于有空，把我的小项目 [silly-datetime](https://github.com/csbun/silly-datetime) 改成了 ES2015 然后用 Rollup 转成 CommonJS 和 UMD 两个版本分别给 [npm](https://www.npmjs.com/) 和 [Bower](http://bower.io/) 使用。

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

命令行运行这个文件 `node rollup.js` 即可生成 `dest/index.js` 和 `dest/index.umd.js`。如果希望方便改组件被别的项目调用，就需进行一些配置声明：

- _package.json_

```json
{
  "main": "dest/index.js",
  "jsnext:main": "src/index.js"
}
```

- _bower.json_

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
/**
 * 注意这里
 */
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.format = format;
exports.locate = locate;
exports.fromNow = fromNow;

// ...
}]}
```

明显这里的 `locate` 和 `fromNow` 是不会被消灭的，即使使用了 [UglifyJS](https://github.com/mishoo/UglifyJS)。

### Rollup

我们看看 Rollup 的表现，一样要添加 babel 插件：

```sh
npm i rollup-plugin-babel --save-dev
```

并配置一下 _rollup.config.js_：

```javascript
import babel from 'rollup-plugin-babel';

export default {
  entry: 'index.js',
  dest: 'dest/bundle.rollup.js',
  format: 'umd',
  plugins: [ babel() ]
};
```






