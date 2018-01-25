title: Preact 源码解析 —— h/createElement
banner: gallery/taiwan/P51001-124945.jpg
date: 2018-01-25 20:04:25
tags:
- Preact
---

Preact 中的 [`h` 方法](https://github.com/developit/preact/blob/master/src/h.js)，相当于 React 中的 `createElement`，在 JSX 中用于生产 VNode 的方法。

<!-- more -->

## TL;DR;

请直接看最后，[带注释的源码](#带注释的源码)。

## 什么是 JSX

按照源码指示的[这篇文章](https://jasonformat.com/wtf-is-jsx/)，这有一个最简单的例子：

```jsx
/** @jsx h */
let foo = <div id="foo">Hello!</div>; 
```

Babel 等工具可以将其转化为

```javascript
var foo = h('div', {id:"foo"}, 'Hello!');
```

至于为什么叫 `h`，是因为这个 idea 最初来自 [hyperscript](https://github.com/hyperhype/hyperscript) ("hyper~~text~~" + "~~java~~script")。

## 什么是 VNode

字面解析，VNode = "V~~irtual~~" + "Node"，虚拟 DOM 节点，大概会是以下这么一个结构：

```javascript
{
  nodeName: "div",
  attributes: {
    "id": "foo"
  },
  children: ["Hello!"]
}
```

看起来很简单嘛，3行代码实现 `h` 方法：

```javascript
function h(nodeName, attributes, ...args) {  
      let children = args.length ? [].concat(...args) : null;
      return { nodeName, attributes, children };
}
```

但是，实时当然没有那么简单。

## 源码解析

光看代码有点难解释，我们先来一个尽可能复杂的简单例子：

```jsx
/** @jsx h */
import { Component } from 'preact';

function getItem(text, idx) {
  return <li key={`p${idx}`}>{text}</li>;
}

class Section extends Component {
  render() {
    const { children, ...rest } = this.props;
    return <section {...rest}>{children}</section>;
  }
}

const node = <Section id="root" style={{ color: 'red' }}>
  <ul id="list">
    { [ 'Hello', 'World' ].map(getItem) }
  </ul>
  <div id="text">
    number: {18};
    string: {'str'};
    boolean: {true};
    {/* comment */}
  </div>
</Section>;
```

通过 Babel 即可转换为 js 内容：

```javascript
var _preact = require('preact');

function getItem(text, idx) {
  return h(
    'li',
    { key: 'p' + idx },
    text
  );
}

var Section = function (_Component) {
  _inherits(Section, _Component);
  function Section() {
    /* 这里简化了部分代码 */
  }
  _createClass(Section, [/* 这里简化了部分代码 */]);
  return Section;
}(_preact.Component);

var node = h(
  Section,
  { id: 'root', style: { color: 'red' } },
  h(
    'ul',
    { id: 'list' },
    ['Hello', 'World'].map(getItem)
  ),
  h(
    'div',
    { id: 'text' },
    'number: ',
    18,
    '; string: ',
    'str',
    '; boolean: ',
    true,
    ';'
  )
);
```

为了更加直观，我们可以将 `Section` 和 `.map(getItem)` 的代码执行结果获取出来，得到：

```javascript
var Section = function () { /* ... */ };

var node = h(
  Section,
  { id: 'root', style: { color: 'red' } },
  h(
    'ul',
    { id: 'list' },
    [ h('li', { key: 'p0' }, 'Hello'), h('li', { key: 'p1' }, 'World') ]
  ),
  h(
    'div',
    { id: 'text' },
    'number: ',
    18,
    '; string: ',
    'str',
    '; boolean: ',
    true,
    ';'
  )
);
```

下面我们将看看，这里面的 5 个 `h()` 或做些什么。为了避免源码解析中有任何差异，我这里参照的是 Preact@8.2.7 的[代码](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js)：


### 单个 Child 的简单 VNode

我们首先处理两个最简单的 `<li>`： `h('li', { key: 'p0' }, 'Hello')`。首先，可以看到 [L39](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L39) 到 [L45](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L45)，将第三个及以后的参数都作为 children 推入 stack，如果有 attributes.children，也推入 stack，并删除这个属性。于是，我们将得到：

```javascript
stack = [ 'Hello' ];
```

接下来开始通过 `while (stack.length)` 遍历这个数组，但实际上自有 `'Hello'` 这一个 `child`，且 [L53](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L53) 到 [L57](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L57) 判断 `simple` 为 `true`，所以我们在 [L63](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L63) 得到：

```javascript
children = [ 'Hello' ];
```

因此由 [L73](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L73) 到 [L77](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L77) 得到这个 VNode，更直观地，我们用一个 JSON 来记录：

```javascript
{
  nodeName: 'li',
  children: [ 'Hello' ],
  attributes: { key: 'p0' },
  key: 'p0',
}
```

### Simple Child 优化

再看看 `h('div', { id: 'text' }, ... }` 这部分，和上面的 `li` 差不多，(`{/* comment */}` 部分已经在 Babel 中被去除)，注意全部内容已经反序：

```javascript
stack = [
  ';'
  true,
  '; boolean: ',
  'str',
  '; string: ',
  18,
  'number: ',
];
```

而因为 [L53](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L53) 到 [L57](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L57) 判断 `simple` 一直为 `true`（因为 L51 和 L54，boolean 后面的 `true` 被转换成了 ''），所以 child 一直在 我们在 [L60](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L60) 进行字符串拼接，最终得到：

```javascript
{
  nodeName: 'div',
  children: [ 'number: 18; string: str; boolean: ;' ],
  attributes: { id: 'text' },
}
```


### 数组 Child 的优化

回到刚刚构建好的两个 `<li>`，现在可以看看 `<ul>`，伪代码表示：

```javascript
h(
  'ul',
  { id: 'list' },
  [ VNode('p0'), VNode('p1') ] // 这里是一个数组，不是两个分开的参数
),
```

在 `while` 之前得到的是：

```javascript
stack = [ [ VNode('p0'), VNode('p1') ] ];
```

如果还是原本的套路，最终 children 也将会是一个“数组套数组”的结构，于是可以看到 [L48](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L48) 将数组的内容再次拆开 push 进 stack。于是可以得到一个更好看的结果：


```javascript
{
  nodeName: 'ul',
  children: [ VNode('p0'), VNode('p1') ],
  attributes: { id: 'list' },
}
```

### 自定义 Component

最后一个 `h` 是最外层的 `<Section>`，这里有一个最大的差异在于， `nodeName = Section` 已经不是一个类似 `div` 一般的字符串，而是一个 `Component`，即为一个 `function`，在 [L53](https://github.com/developit/preact/blob/17cc8deddd3d4e592685dfa42e832f6e8d2cb795/src/h.js#L53) 中可以看到这类的 nodeName 是 __不 simple__ 的，于是直接会把说有 child push 进 children 里面。

```javascript
{
  nodeName: Section, // Section is a function
  children: [ VNode('ul#list'), VNode('div#text') ],
  attributes: { id: 'root', style: { color: 'red' } },
}
```

注意，因为 __不 simple__，即使 stack 里有连串的 string 或 number，也不会做拼接：

```javascript
h(
  Section,
  null,
  'string: ',
  'str',
  ';'
);
// =>
{
  nodeName: Section, // Section is a function
  children: [ 'string: ', 'str', ';' ],
}
```

### 最终结果

```javascript
{
  nodeName: Section, // Section is a function
  attributes: { id: 'root', style: { color: 'red' } },
  children: [{
    nodeName: 'ul',
    attributes: { id: 'list' },
    children: [{
      nodeName: 'li',
      key: 'p0',
      attributes: { key: 'p0' },
      children: [ 'Hello' ],
    }, {
      nodeName: 'li',
      key: 'p1',
      attributes: { key: 'p1' },
      children: [ 'World' ],
    }],
  }, {
    nodeName: 'div',
    children: [ 'number: 18; string: str; boolean: ;' ],
    attributes: { id: 'text' },
  }],
}
```

## 带注释的源码

最后将上面的全部内容写成注释，放到源码中：

```javascript
import { VNode } from './vnode';
import options from './options';

// 问题点：为了防止公共变量污染，放到 h 方法里面会不会更好？还是说是性能考虑？
const stack = [];

const EMPTY_CHILDREN = [];

/**
 * JSX/hyperscript reviver.
 */
export function h(nodeName, attributes) {
  // 问题点：children=EMPTY_CHILDREN 为何不直接在这里直接初始化 children=[]
  // 那下面也可以减少一次判断 `else if (children===EMPTY_CHILDREN)`
  let children=EMPTY_CHILDREN, lastSimple, child, simple, i;
  // 首先将 children 反序推入 stack
  for (i=arguments.length; i-- > 2; ) {
    stack.push(arguments[i]);
  }
  // 如果有 attributes.children，也推入 stack，并删除这个属性
  if (attributes && attributes.children!=null) {
    if (!stack.length) stack.push(attributes.children);
    delete attributes.children;
  }
  // 循环遍历 stack/children
  while (stack.length) {
    if ((child = stack.pop()) && child.pop!==undefined) {
      // 如果 child 本身也是个数组（也可能来自上面的 attributes.children），那也将其反序 push 到 stack 中（之后在 while 又会被 pop 出来）
      for (i=child.length; i--; ) stack.push(child[i]);
    }
    else {
      // boolean 值转为 null？
      if (typeof child==='boolean') child = null;

      // 当 nodeName 不是函数（自定义的 Component），且 child 是 null、number、string 时视为 simple，且全部转为 string
      if ((simple = typeof nodeName!=='function')) {
        if (child==null) child = '';
        else if (typeof child==='number') child = String(child);
        else if (typeof child!=='string') simple = false;
      }

      if (simple && lastSimple) {
        // 如果连续两个 child 都是 simple 的，那自接将当期 child 字符串拼接到上一个后面
        children[children.length-1] += child;
      }
      else if (children===EMPTY_CHILDREN) {
        // 第一个 child
        children = [child];
      }
      else {
        // 其他不 simple 的 child
        children.push(child);
      }

      lastSimple = simple;
    }
  }

  // 构建 VNode
  let p = new VNode();
  p.nodeName = nodeName;
  p.children = children;
  p.attributes = attributes==null ? undefined : attributes;
  p.key = attributes==null ? undefined : attributes.key;

  // if a "vnode hook" is defined, pass every created VNode to it
  if (options.vnode!==undefined) options.vnode(p);

  return p;
}
```
