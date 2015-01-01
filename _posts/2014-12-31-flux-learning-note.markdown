---
layout: post
title:  "Flux 学习笔记"
date:   2014-12-31 16:43:56
categories: flux, react
---

大部分和 Flux 有关的东西都能看到这么一个图，讲述 Flux “单向数据流”的概念。

<img src="https://github.com/facebook/flux/raw/master/docs/img/flux-diagram-white-background.png" style="max-width:700px;">

相同的，Geek 一点的有下面这个：

{% highlight ruby %}
Views ---> (actions) ---> Dispatcher --> (registered callback) --> Stores -----+
Ʌ                                                                              |
|                                                                              V
+- (Controller-Views "change" event handlers) - (Stores emit "change" events) -+
{% endhighlight %}

官网说 Flux 有 3 个主要的组成部分：__dispatcher__、__stores__ 和 __views__。同时，我觉得 __action__ 也是一个非常重要的概念。

> 注：文中代码大部分截取自 [flux-todomvc](https://github.com/facebook/flux/tree/master/examples/flux-todomvc)

### views

__view__ 很好理解，就是一大堆的 React 组件，在标准代码结构中表现为 `components/*.react.js`。在 __view__ 创建时会向 __stores__ 绑定 `'change'` 事件，当其在销毁之前取消绑定。

{% highlight javascript %}
var TodoApp = React.createClass({

  // ...

  componentDidMount: function() {
    TodoStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    TodoStore.removeChangeListener(this._onChange);
  },

  render: function() {
    // ...
  },

  /**
   * Event handler for 'change' events coming from the TodoStore
   */
  _onChange: function() {
    this.setState(getTodoState());
  }
});
{% endhighlight %}

另一方面，__view__ 会产生 __action__，传递给 __dispatcher__。

{% highlight javascript %}
var Header = React.createClass({
  /**
   * @return {object}
   */
  render: function() {
    return (
      <header id="header">
        <h1>todos</h1>
        <TodoTextInput
          id="new-todo"
          placeholder="What needs to be done?"
          onSave={this._onSave}
        />
      </header>
    );
  },

  /**
   * Event handler called within TodoTextInput.
   * Defining this here allows TodoTextInput to be used in multiple places
   * in different ways.
   * @param {string} text
   */
  _onSave: function(text) {
    if (text.trim()){
      TodoActions.create(text);
    }
  }
});
{% endhighlight %}

### dispatcher

__dispatcher__ 传递来自 __view__ 或者服务器的 __action__，检查其中是否有对应的注册的回调函数（registered callback），这样就能影响到 __stores__。

因为 __dispatcher__ 只是机械地传递，而注册动作是在 __stores__ 里面进行的，因此大多数情况下一个应用里面只要一个 `AppDispatcher.js` 就够了，而且都长一个样！

{% highlight javascript %}
'use strict';

var Dispatcher = require('flux').Dispatcher;
var assign = require('object-assign');

var AppDispatcher = assign(new Dispatcher(), {
  /**
   * @param {object} action The details of the action, including the action's
   * type and additional data coming from the server.
   */
  handleServerAction: function (action) {
    this.dispatch({
      source: 'SERVER_ACTION',
      action: action
    });
  },

  /**
   * A bridge function between the views and the dispatcher, marking the action
   * as a view action.  Another variant here could be handleServerAction.
   * @param  {object} action The data coming from the view.
   */
  handleViewAction: function(action) {
    this.dispatch({
      source: 'VIEW_ACTION',
      action: action
    });
  }
});

module.exports = AppDispatcher;
{% endhighlight %}

### stores

感觉和一般 MVC 里面的 model 比较类似，官网说：

> Their role is somewhat similar to a model in a traditional MVC, but they manage the state of many objects — they are not instances of one object.

{% highlight javascript %}
var TodoStore = assign({}, EventEmitter.prototype, {

  // ...

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});
{% endhighlight %}

在 __stores__ 里，将 __action__ 注册到 __dispatcher__，其中的回调方法直接影响其中的数据模型，而当这些数据变化的时候就会触发 `'change'` 事件。

{% highlight javascript %}
AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.actionType) {
    case 'ACTION_NAME':
      // ...
    default:
      return true;
  }

  TodoStore.emitChange();
  return true; // No errors.  Needed by promise in Dispatcher.
});
{% endhighlight %}

### action

我想上面已经讲清楚了，__view__ 或者服务器产生 __action__，传递给 __dispatcher__。

{% highlight javascript %}

var TodoActions = {

  create: function(text) {
    AppDispatcher.handleViewAction({
      actionType: 'ACTION_NAME',
      text: text
    });
  },

  // ...

};
{% endhighlight %}


