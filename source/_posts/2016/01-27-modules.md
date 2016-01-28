title: Modules in CommonJS and ES2015
banner: gallery/taiwan/DSC03467.jpg
date: 2016-01-27 16:20:18
tags:
- ES2015
- CommonJS
---

## CommonJS

Let's see 2 examples in CommonJS:

<!-- more -->

- Example 1

```javascript
// ----- lib.js -----
var count = 0;
exports.up = function () {
    return ++count;
}
exports.count = count;
```

```javascript
// ----- main.js -----
var lib = require('./lib');

console.log(lib.count); // 0
console.log(lib.up());  // 1
console.log(lib.count); // 0
```

In this case, `lib.count` in _main.js_ would not change after function `lib.up` called. In _lib.js_ we can see, `count` is a __number__, which is [primitive](https://developer.mozilla.org/en-US/docs/Glossary/Primitive), so is `exports.count`. Thus, `exports.count` won't change when we change `count`. We can change it to make a different:

```javascript
// ----- lib.change.js -----
var count = 0;
exports.up = function () {
    return exports.count = ++count;
}
exports.count = count;
```

The follow example may looks better.

- Example 2

```javascript
// ----- lib.2.js -----
var out = {
    count: 0,
    up: function () {
        return ++out.count;
    }
};
module.exports = out;
```

```javascript
// ----- main.2.js -----
var lib = require('./lib.2');

console.log(lib.count); // 0
console.log(lib.up());  // 1
console.log(lib.count); // 1
```

## ES2015 modules

It's simple to make __Example 2__ works in ES2015:

```javascript
// ----- lib.js -----
export let count = 0;
export function up() {
    return ++count;
};

export function unused() {
    return --count;
}
```

```javascript
// ----- main.js -----
import { count, up } from './lib';
console.log(count);
console.log(up());
console.log(count);
```

### Babel

Using [Babel](http://babeljs.io/) and [babel-preset-es2015](https://www.npmjs.com/package/babel-preset-es2015) make it similar to our `lib.change.js`:

- babel lib.js

```javascript
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.up = up;
// ----- lib.js -----
var count = exports.count = 0;
function up() {
    return exports.count = count += 1;
};
```

- babel main.js

```javascript
'use strict';

var _lib = require('./lib');

console.log(_lib.count); // ----- main.js -----

console.log((0, _lib.up)());
console.log(_lib.count);
```

### Rollup

[Rollup](http://rollupjs.org/) bundle up with less code:

```javascript
'use strict';

// ----- lib.js -----
let count = 0;
function up() {
    return ++count;
};

console.log(count);
console.log(up());
console.log(count);
```


## Read More

- [ECMAScript 6 modules: the final syntax](http://www.2ality.com/2014/09/es6-modules-final.html)


