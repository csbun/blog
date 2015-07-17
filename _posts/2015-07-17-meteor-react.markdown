---
layout: post
title:  "Meteor + React"
date:   2015-07-17 22:13:05
categories:
---

## Install

If you have not yet installed Meteor, do that:

```sh
curl https://install.meteor.com | /bin/sh
```

## Init

```sh
meteor new tapid
cd tapid
meteor add react
```

## Add ReactRouter

### Add the relevant Meteor packages

```sh
meteor add meteorhacks:npm cosmos:browserify
```

### Add the npm modules you want to packages.json

packages.json

```json
{
  "react-router": "0.13.3",
  "externalify": "0.1.0"
}
```

### Add the appropriate require statements to app.browserify.js

`lib/app.browserify.js`

```javascript
ReactRouter = require("react-router");
```

### Configure Browserify and transforms in app.browserify.options.json

// TODO ? Needed?

`lib/app.browserify.options.json`

```json
{
  "transforms": {
    "externalify": {
      "global": true,
      "external": {
        "react": "React.require"
      }
    }
  }
}
```

## less

```sh
meteor add less
```

## Router

There are two main third-party packages to choose between:

[Iron Router](https://atmospherejs.com/iron/router)
[Flow Router](https://atmospherejs.com/meteorhacks/flow-router)

But I just want an simple server-side router, so I use the offical one

```sh
meteor add webapp
```



## Reference

[METEOR Documentation](http://docs.meteor.com/#/full/)

[Two weeks with React + Meteor](http://info.meteor.com/blog/two-weeks-with-react-and-meteor)

[Getting Started with Meteor, React, and React Router](http://alexgaribay.com/2015/07/06/getting-started-with-meteor-react-and-react-router/)

[Using client-side modules from NPM with Browserify](http://react-in-meteor.readthedocs.org/en/latest/client-npm/)

[React Router](http://rackt.github.io/react-router/)
