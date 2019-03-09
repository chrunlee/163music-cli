#!/usr/bin/env node

let fs = require('fs');
let log = print = console.log;
let api = require('./lib/api');

let argv = require("minimist")(process.argv.slice(2), {
  alias: {
    'input': 'i',
    'dir': 'd',
    'start' : 's'
  },
  string: ['input', 'dir'],
  number : ['start'],
  'default': {
  	'start' : 0,
    'dir': process.cwd()
  }
});

if (argv.help) {
  print("Usage:");
  print("  download --help // print help information");
  print("  download -i 827081603 // input playlist id");
  print("  download -d /home/music/ // which directory music stored to ");
  process.exit(0);
}


if(!argv.input){
	print('请输入歌单的ID(url中可以看到).');
	process.exit(0);
}
if(argv.start!= null && argv.start != undefined){
	argv.start = Math.max(0,parseInt(argv.start,10));
}

api({
	isSingle : false,
	id : argv.input,
	start : argv.start,
	download : argv.dir,
	log : log
});
print('开始下载，请稍后.......');

