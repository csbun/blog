title: 译文：Puppeteer 与 Chrome Headless —— 从入门到爬虫
date: 2017-09-01 00:14:09
tags:
- Puppeteer
- Chrome
- Headless
---

**这里是 [GitHub 英文原文](https://github.com/emadehsan/thal)** / **[Medium 英文原文](https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e)**

![A Desert in painters perception](https://github.com/csbun/thal/raw/master/media/desertious.jpg)

[`Puppeteer`](https://github.com/GoogleChrome/puppeteer) 是 Google Chrome 团队官方的无头（Headless）Chrome 工具。正因为这个官方声明，许多业内自动化测试库都已经停止维护，包括 **[PhantomJS](http://phantomjs.org/)**。**[Selenium IDE for Firefox](https://addons.mozilla.org/en-US/firefox/addon/selenium-ide/)** 项目也因为缺乏维护者而终止。

> 译者注：关于 PhantomJS 和 Selenium IDE for Firefox 停止维护并没有找到相关的公告，但这两个项目的确已经都超过 2 年没有发布新版本了。但另一个今年 5 月才开启的项目 [Chromeless](https://github.com/graphcool/chromeless) 目前在 Github 上已经超过 1w star，目前还非常活跃。

Chrome 作为浏览器市场的领头羊，**Chrome Headless** 必将成为 web 应用 **自动化测试** 的行业标杆。所以我整合了这份如何利用 **Chrome Headless** 做 `网页爬虫` 的入门指南。

<!-- more -->

## TL;DR

本文我们将使用 `Chrome Headless`, `Puppeteer`, `Node` 和 `MongoDB`，爬取 GitHub，登录并提取和保存用户的邮箱。不用担心 GitHub 的频率限制，本文会基于 Chrome Headless 和 Node 给你相应的策略。同时，请时刻关注 `Puppeteer` 的[文档](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md)，因为该项目仍然处于开发中，API 并不是很稳定。

## 开始

开始之前，我们需要安装以下工具。点击他们的官网然后安装吧。

* [Node 8.+](https://nodejs.org)
* [MongoDB](http://mongodb.com)

> 译者注：Puppeteer 要求使用 Node v6.4.0，但因为文中大量使用 `async/await`，需要 Node v7.6.0 或以上。

## 初始化项目

项目都是以创建文件夹开始。

```
$ mkdir thal
$ cd thal
```

初始化 NPM，填入一些必要的信息。

```
$ npm init
```

安装 `Puppeteer`。由于 `Puppeteer` 并不是稳定的版本而且每天都在更新，所以如果你想要最新的功能可以直接通过 GitHub 的[仓库](https://github.com/GoogleChrome/puppeteer)安装。
```
$ npm i --save puppeteer
```

Puppeteer 包含了自己的 chrome / chromium 用以确保可以无界面地工作。因此每当你安装/更新 puppeteer 的时候，他都会下载指定的 chrome 版本。

## 编码

我们将从页面截图开始，这是他们的文档中的代码。

### 页面截图

```js
const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://github.com');
  await page.screenshot({path: 'screenshots/github.png'});

  browser.close();
}

run();
```

如果您第一次使用 `Node` 7 或 8，那你可能不太熟悉 `async` 和 `await` 关键字。简单地说，一个 `async` 函数返回一个 Promise，当 Promise 完成时会返回你所定义的内容。当你需要像同步函数那样调用时，需要使用 `await`。

保存上面的代码为 `index.js` 文件到项目目录里。并运行

```
$ node index.js
```

这样截图就会被保存到 `screenshots/` 目录下。

![GitHub](https://github.com/csbun/thal/raw/master/screenshots/github.png)

### 登录 GitHub

如果你在 GitHub 上搜索 *john*，然后点击 Users 标签，你将看到一个带有姓名信息的用户列表。

![Johns](https://github.com/csbun/thal/raw/master/media/all-johns.png)

有些用户设置了他们的邮箱是公开可见的，但有些用户没有。但你一个邮箱都看不到的原因是没有登录。下面，让我们利用 [Puppeteer 文档](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) 来登录吧~

> 译者注：上图是登录后看到的效果

在项目根目录添加一个 `creds.js` 文件。我强烈建议用一个没什么卵用的邮箱来注册一个新 GitHub 账号，不然 GitHub 可能会封掉你的常用账号。

```js
module.exports = {
  username: '<GITHUB_USERNAME>',
  password: '<GITHUB_PASSWORD>'
};
```

同时添加一个 `.gitignore` 文件，输入以下内容：

```txt
node_modules/
creds.js
```

#### 以非无头（non headless）模式启动

在调用 Puppeteer 的 `launch` 方法的时候传入参数对象中带有 `headless: false`，即可启动其 GUI 界面，进行可视化调试。

```js
const browser = await puppeteer.launch({
  headless: false
});
```

跳转到登录页

```js
await page.goto('https://github.com/login');
```

在浏览器中打开 [https://github.com/login](https://github.com/login)。右击 **Username or email address** 下方的输入框（译者注：并选择 **Inspect**）。在开发者工具中，右击被高亮的代码选择 `Copy` > `Copy selector`。

![Copy dom element selector](https://github.com/csbun/thal/raw/master/media/copy-selector.png)

把复制出来的值放到以下常量中

```js
const USERNAME_SELECTOR = '#login_field'; // "#login_field" 就是被复制出来的值
```
重复上面的步骤，吧 **Password** 输入框和 **Sign in** 按钮的值也填好，将得到下面内容：

```js
// dom element selectors
const USERNAME_SELECTOR = '#login_field';
const PASSWORD_SELECTOR = '#password';
const BUTTON_SELECTOR = '#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block';
```

#### 登录

Puppeteer 提供了 `click` 方法用来点击 DOM 元素和 `type` 方法来输入内容。下面我们将填写验证信息并点击登录然后坐等跳转。

首先，需要引入 `creds.js` 文件。

```js
const CREDS = require('./creds');
```

然后

```js
await page.click(USERNAME_SELECTOR);
await page.type(CREDS.username);

await page.click(PASSWORD_SELECTOR);
await page.type(CREDS.password);

await page.click(BUTTON_SELECTOR);

await page.waitForNavigation();
```

### 搜索 GitHub

现在，我们已经登录啦！我们可以点击搜索框，填写并在结果页面点击用户标签。但有一个简单的方法：搜索请求通常是 GET 请求，所有内容都是通过 URL 发送的。所以，在搜索框内手动输入 `john`，然后点击用户标签并复制地址栏上的网址。这将是

```js
const searchUrl = 'https://github.com/search?q=john&type=Users&utf8=%E2%9C%93';
```

做一丢丢调整

```js
const userToSearch = 'john';
const searchUrl = 'https://github.com/search?q=' + userToSearch + '&type=Users&utf8=%E2%9C%93';
```

让我们跳转到这个页面，看是不是真的搜索到了？

```js
await page.goto(searchUrl);
await page.waitFor(2*1000);
```

### 提取邮箱地址

> 译者注：本小节没有直译，因为译者没有使用作者的方案

我们的目的是搜刮用户的 `username` 和 `email`。我们可以在 Chrome 的开发者工具中看到，每个单独的用户信息都是在一个 class 为 `user-list-item` 的 `<div>` 内。

一种提取元素内容的方法是 `Page` or `ElementHandle` 的 `evaluate` 方法，因为它作用于浏览器运行的上下文环境内。当我们跳转到搜索结果页的时候，使用 `page.evaluate` 方法可以将所有用户信息的 div 获取出来。

```js
const USER_LIST_INFO_SELECTOR = '.user-list-item';
const users = await page.evaluate((sel) => {
  const $els = document.querySelectorAll(sel);
  // ...
}, USER_LIST_INFO_SELECTOR);
```

遍历上面的 `$els`，继续使用选择器提取出其中的信息。当然，这里的选择器相当于用户信息的 div 的，不是像之前那样直接复制出来的，稍微有一点 css 知识应该能很容易读懂。

```js
const USER_LIST_INFO_SELECTOR = '.user-list-item';
const USER_LIST_USERNAME_SELECTOR = '.user-list-info>a:nth-child(1)';
const USER_LIST_EMAIL_SELECTOR = '.user-list-info>.user-list-meta .muted-link';

const users = await page.evaluate((sInfo, sName, sEmail) => {
  return Array.prototype.slice.apply(document.querySelectorAll(sInfo))
    .map($userListItem => {
      // 用户名
      const username = $userListItem.querySelector(sName).innerText;
      // 邮箱
      const $email = $userListItem.querySelector(sEmail);
      const email = $email ? $email.innerText : undefined;
      return {
        username,
        email,
      };
    })
    // 不是所有用户都显示邮箱
    .filter(u => !!u.email);
}, USER_LIST_INFO_SELECTOR, USER_LIST_USERNAME_SELECTOR, USER_LIST_EMAIL_SELECTOR);

console.log(users);
```

现在，当你运行 `node index.js`，你讲看到 Chrome 跳出来自动执行上述操作后，在命令行打出 `username` 与其相关的 `email`。

### 遍历全部页面

首先我们需要评估搜索结果最后一页的页码。在搜索结果页的顶部，你可以看到当我在翻译这篇文章时有 **70,134 users**。

**有趣的现象: 如果你对比上面的截图，你会发现这两天已经有 371 个新的 *john* 同学加入 GitHub。**

![Number of search items](https://github.com/csbun/thal/raw/master/media/num-results-new.png)

从开发者工具复制人数的选择器。我们将在 `run` 外面写一个新的函数，用来获取页面数。

```js
async function getNumPages(page) {
  const NUM_USER_SELECTOR = '#js-pjax-container > div.container > div > div.column.three-fourths.codesearch-results.pr-6 > div.d-flex.flex-justify-between.border-bottom.pb-3 > h3';

  let inner = await page.evaluate((sel) => {
    return document.querySelector(sel).innerHTML;
  }, NUM_USER_SELECTOR);

  // 格式是: "69,803 users"
  inner = inner.replace(',', '').replace(' users', '');
  const numUsers = parseInt(inner);
  console.log('numUsers: ', numUsers);

  /*
   * GitHub 每页显示 10 个结果
   */
  const numPages = Math.ceil(numUsers / 10);
  return numPages;
}
```

在搜索结果页底部，如果你把鼠标悬浮在页码按钮上面，可以看到是一个指向下一页的链接。如：第二页的链接是 `https://github.com/search?p=2&q=john&type=Users&utf8=%E2%9C%93`。注意到 `p=2` 是一个 URL 的 query 参数，这将帮助我们跳转到指定的页面。

在添加了遍历页码的代码在上面爬取内容的方法之后，代码变成了这样：

```js
const numPages = await getNumPages(page);
console.log('Numpages: ', numPages);

for (let h = 1; h <= numPages; h++) {
  // 跳转到指定页码
  await page.goto(`${searchUrl}&p=${h}`);
  // 执行爬取
  const users = await page.evaluate((sInfo, sName, sEmail) => {
    return Array.prototype.slice.apply(document.querySelectorAll(sInfo))
      .map($userListItem => {
        // 用户名
        const username = $userListItem.querySelector(sName).innerText;
        // 邮箱
        const $email = $userListItem.querySelector(sEmail);
        const email = $email ? $email.innerText : undefined;
        return {
          username,
          email,
        };
      })
      // 不是所有用户都显示邮箱
      .filter(u => !!u.email);
  }, USER_LIST_INFO_SELECTOR, USER_LIST_USERNAME_SELECTOR, USER_LIST_EMAIL_SELECTOR);

  users.map(({username, email}) => {
    // TODO: 保存用户信息
    console.log(username, '->', email);
  });
}
```

### 保存到 MongoDB

到这里 `Puppeteer` 的部分已经结束了。下面我们将使用 `mongoose` 存储上面的信息到 `MongoDB`。它是个 [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping)，确切说是个便于从数据库进行信息存储和检索的库。

```
$ npm i --save mongoose
```

MongoDB 是一个 Schema-less 的 NoSQL 数据库，但我们可以使用 Mongoose 使其遵循一些原则。首先我们需要创建一个 `Model`，他代表 MongoDB 中的 `Collection`。创建一个 `models` 文件夹，然后在里面创建一个 `user.js` 文件，并加入以下 collection 的构造函数代码。之后无论我们塞什么东西进 `User`，他都会遵循这个结构。


```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    dateCrawled: Date
});

module.exports = mongoose.model('User', userSchema);
```

现在我们可以开始往数据库塞数据了。由于我们不希望数据库中存在重复的 email，所以我们只新增那些以前从没出现过的邮箱，否则我们只更新数据。为此，我们需要使用 mongoose 的 `Model.findOneAndUpdate` 方法。

回到 `index.js`，引用所需的依赖：

```js
const mongoose = require('mongoose');
const User = require('./models/user');
```

然后我们再创建一个新的方法，用于 **upsert** (更新 update 或 新增 insert) 用户实例。

```js
function upsertUser(userObj) {

  const DB_URL = 'mongodb://localhost/thal';
  if (mongoose.connection.readyState == 0) {
    mongoose.connect(DB_URL);
  }

  // if this email exists, update the entry, don't insert
  // 如果邮箱存在，就更新实例，不新增
  const conditions = {
    email: userObj.email
  };
  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  };

  User.findOneAndUpdate(conditions, userObj, options, (err, result) => {
    if (err) {
      throw err;
    }
  });
}
```

启动 MongoDB 服务。用下面的代码替换掉之前的注释内容 `// TODO: 保存用户信息`。

```js
upsertUser({
  username: username,
  email: email,
  dateCrawled: new Date()
});
```

想要检查是否真的保存了这些用户，可以到 mongo 里面执行下列脚本：

```
$ mongo
> use thal
> db.users.find().pretty()
```

你会看到有多个用户在已经添加在里面，那你就成功了哦~

> 译者注：使用 `db.users.find().pretty().length()` 可以查看爬取了多少条

## 最后

Chrome Headless 和 Puppeteer 开启了网页爬虫和自动化测试的新纪元，而且 Chrome Headless 还支持 WebGL！你可以把你的爬虫脚本发布到云端，然后就可以坐享其成。当然，发布到服务器之前请记得去掉 `headless: false` 配置。

* 在爬取的时候，你可能会被 GitHub 的频率控制阻止。

![Whoa](https://github.com/csbun/thal/raw/master/media/whoa.png)

* 另外，我发现你无法跳到 100 页之后。

> 译者注：我爬了100页并没有被阻止。从 101 页开始就变成了 404 页面，或许通过页面下方的页码进行遍历会更合理

## 结语
广阔无垠的沙漠见证着 `穿越` 这些巨大的沙滩的人们的斗争和牺牲。 [**Thal**](https://en.wikipedia.org/wiki/Thal_Desert) 是巴基斯坦的一个跨越多个地区的沙漠，包括我的家乡 Bhakkar。与今天在 `互联网` 上搜索数据的情况类似。这就是为什么我将这个 repo 命名为 `Thal`。如果你喜欢它，那请与他人分享。如果您有任何建议，请在这里发表评论或直接与原作者联络[@e_mad_ehsan]（https://twitter.com/e_mad_ehsan）。他很乐意听到你的消息。

> 译者注：中文版也欢迎直接提 [issue](https://github.com/csbun/thal/issues) 讨论 或 PR
