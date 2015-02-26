#!/usr/bin/env node

var fs = require('fs'),
    moment = require('moment'),
    changeCase = require('change-case');

function tpl () {
/*
---
layout: post
title:  "{title}"
date:   {date}
categories: 
---
*/
}

var now = moment(),
    title = process.argv[2] || 'new-post',
    fileName = '_posts/' +
        now.format('YYYY-MM-DD') + '-' +
        changeCase.paramCase(title) +
        '.markdown',
    content = tpl.toString()
        .replace(/^[^\/]+\/\*!?\s?/, '')
        .replace(/\*\/[^\/]+$/, '')
        .replace('{title}', changeCase.titleCase(title))
        .replace('{date}', now.format('YYYY-MM-DD HH:mm:ss'));

fs.writeFile(fileName, content);
console.log('create new file: ' + fileName);
