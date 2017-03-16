title: Using Storybook with Preact
banner: gallery/taiwan/P50930-170612.jpg
date: 2017-03-16 18:07:04
tags:
- Storybook
- Preact
---

## TL;DR;

Clone this [repo][repo] and start！

克隆这个 [项目][repo] 然后启动即可！

[repo]: https://github.com/csbun/preact-storybook-example

```
git clone git@github.com:csbun/preact-storybook-example.git
cd preact-storybook-example

npm i
npm run storybook
```

<!-- more -->


## Install Dependences 安装依赖

[Storybook][Storybook] is aim for [React][react-storybook] and [React Native][react-native-storybook]. [getstorybook][getstorybook] is unable to use in a Preact project. With [preact-compat][preact-compat], we can do this manually.

[Storybook][Storybook] 目前是为 [React][react-storybook] 和 [React Native][react-native-storybook] 而设计的。[getstorybook][getstorybook] 目前无法在 Preact 项目中使用。但有了 [preact-compat][preact-compat]，理论上我们应该是可以手动完成这个任务的。

[Storybook]: https://getstorybook.io/
[react-storybook]: https://github.com/storybooks/react-storybook
[react-native-storybook]: https://github.com/storybooks/react-native-storybook
[getstorybook]: https://github.com/storybooks/getstorybook
[preact-compat]: https://github.com/developit/preact-compat

```sh
npm i -D @kadira/storybook preact-compat
```

Some peerDependences warning about react may blow up here, ignore it.
> You may have preact installed before.

这里可能会出现一些关于 react 的 peerDependences 警告，忽略之。


## Config 配置

### Storybook Configuration

Using CLI `getstorybook` will create config file _.storybook/config.js_, so we have to do it by ourself.

我们需要手动创建本应该是使用命令行 `getstorybook` 创建的配置文件 _.storybook/config.js_。

```sh
mkdir .storybook
touch .storybook/config.js
```

Fill it with the following code:

并填入以下内容：

```javascript
import { configure } from '@kadira/storybook';

function loadStories() {
  require('../stories');
}

configure(loadStories, module);
```

### Webpack Configuration (for Preact)

Storybook use webpack for bundling, what make us easy to use preact-compat. Create another file _.storybook/webpack.config.js_:

Storybook 使用 webpack 打包，所以我们可以很容易添加 preact-compat 的配置进去。 创建一个 _.storybook/webpack.config.js_ 文件：

```javascript
module.exports = {
  name: 'client',
  target: 'web',
  resolve: {
    extensions: ['', '.js', 'jsx'],
    alias: {
      'react': 'preact-compat',
      'react-dom': 'preact-compat'
    }
  },
  devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader: 'babel',
      exclude: /node_modules/,
    }],
  },
};
```

And we need _.babelrc_ for preact jsx file.
> You may have babel and plugins installed.
> `npm i -D babel babel-preset-es2015 babel-plugin-transform-react-jsx`

同时我们需要为我们的 preact jsx 文件准备一个 _.babelrc_ 配置文件。

```json
{
  "presets": [ "es2015" ],
  "plugins": [
    [ "transform-react-jsx", { "pragma": "h" }]
  ]
}
```


## Writing Stories 编写 Stories

Let's see `require('../stories')` in _.storybook/config.js_, line 4. That's where we write our "stories". Create a _stories/index.js_ file as an entry, just like CLI `getstorybook` do:

我们可以在 _.storybook/config.js_ 第4行看到 `require('../stories')` 引入了 stories。因此我们需要创建入口文件 _stories/index.js_ ：

```javascript
import { h } from 'preact';
import { storiesOf, action } from '@kadira/storybook';
import Button from './Button'; // preact component

storiesOf('Button', module)
  .add('case 1', () => {
    return (<Button text="CASE-1" onPress={action('case-1')} />);
  })
  .add('case 2', () => {
    return (<Button text="CASE-2" onPress={action('case-2')} />);
  });
```

## Launch 启动

Add storybook script into _package.json_:
在 _package.json_ 中添加 storybook 的启动脚本：

```json
{
  "name": "preact-storybook-example",
  "scripts": {
    "storybook": "start-storybook -p 6006"
  }
}
```

Then we can run `npm run storybook` to start using storybook by visiting [http://localhost:6006/][dev].

然后运行 `npm run storybook` 就可以启动 storybook，然后访问 [http://localhost:6006/][dev] 开发。

[dev]: http://localhost:6006/
