---
layout: post
title:  "Using Contenteditable"
date:   2015-09-21 15:14:03
categories: contentEditable
---

最近才发现的这个东西啊，但是查了一下 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable)，貌似已经很普及了，连 IE6 都支持（虽然有一大堆的 bug）。

## 用法

### JavaScript

很简单的，就是随便在页面上搞个元素，然后设置为可编辑：

```html
<div>
    <p id="editable">I'm editable!</p>
</div>
<script type="text/javascript">
var el = document.getElementById('editable');
el.contentEditable = 'true';
</script>
```

其中 `contentEditable` 的值是字符串，有三种选择：

- `'true'` 可编辑的
- `'false'` 不可编辑的
- `'inherit'` 继承父元素的状态

### Attribute

这个是 HTML5 中一个新的全局属性，[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable)：

```html
<div>
    <p contenteditable="true">I'm editable!</p>
</div>
```


## 用途

当我看到这货，我第一反应就是拿来做“自定义页面”，运营人员应该会觉得很实在，大致原理如下：

- 运营端从数据存储服务输出页面
- 页面中可自定义的部分标识为 contenteditable
- 运营人员修改该部分内容后点击保存
- 获取 contenteditable 元素的 innerHTML，回传至数据存储服务
- 终端用户使用更新后的数据存储服务的数据渲染页面

这里有一个我用 localStorage 用作虚拟的数据存储服务：

<p data-height="750" data-theme-id="18973" data-slug-hash="avNpZw" data-default-tab="result" data-user="csbun" class='codepen'>See the Pen <a href='http://codepen.io/csbun/pen/avNpZw/'>avNpZw</a> by csbun (<a href='http://codepen.io/csbun'>@csbun</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

## 实例

这里有更多有趣的实例：

- [substance](http://substance.io/)
- [ContentTools](http://getcontenttools.com/demo)
