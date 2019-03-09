// var api = 'http://localhost:3000';
var api = 'http://music.byyui.com';
//获得歌单

var superagent = require('superagent');

function MusicLoad ( opt ){

	var _default = {
		isSingle : false,
		getListUrl : api+'/v1/playlist/detail',
		getSingleInfo : api+'/v1//music/detail',
		getUrl : api+'/v1/music/url',
		fs : require('fs'),
		url : require('url'),
		http : require('http'),
		async : require('async')

	};
	this.opt = Object.assign(_default,opt);
	this.log = opt.log;
	this.init();
}
MusicLoad.prototype.init = function(){
	var that = this,opt = that.opt;
	if(opt.isSingle){
		that.getUrl(that.opt.id,null,function(){
			that.log('下载完成.');
		});
	}else{
		that.getList();
	}
}

MusicLoad.prototype.getList = function( ){
	var that = this;
	superagent.get(that.opt.getListUrl+'?id='+that.opt.id+'&limit=300').end(function(err,res){
		if(err){
			that.log('无法获得该歌单信息，请确认id是否正确！')
			return;
		}
		var txt = res.text;
		var data = JSON.parse(txt);
		var list = data.playlist.tracks;
		that.log(`[${data.playlist.creator.nickname}] 的歌单中共计有歌曲: ${list.length} 首.`);
		if(list.length > 0){
			//循环，获得一首，下载一首
			var data = list.map(function(item){
				return {
					id : item.id,
					name : item.name
				};
			});
			//开始判断
			if(that.opt.start !== 0){
				data = data.slice(that.opt.start,data.length);
				that.log(`开始从第 ${that.opt.start} 处开始下载。`);
			}
			that.list = data;
			that.startLoad();
		}else{
			that.log('该歌单内无歌曲。');
		}
	});
}

MusicLoad.prototype.startLoad = function(){
	var that = this;
	var list = that.list,async = that.opt.async;
	async.mapLimit(list,1,function(item,cb){
		that.getUrl(item.id,item.name,cb);
	},function(){
		that.log('全部下载完成(有可能有丢失几个歌曲)');
	});
}

MusicLoad.prototype.getUrl = function(id,name,cb){
	var that = this;
	var target= that.opt.getUrl+'?id='+id+'&br=320000';
	superagent.get(target).end(function(err,res){
		if(err){
			that.log(err);
			cb(err,null);
			return;
		}
		var data =JSON.parse(res.text);
		var url = data.data[0].url;
		if(typeof url == 'string'){
			that.download({id : id,name : name,url : url},cb);
		}else{
			that.log('无法获得该歌曲地址信息.');
			cb(null,null);
		}
	});
}
MusicLoad.prototype.download = function( item,callback ){
	var download = this.opt.download,that = this,fs = this.opt.fs,url = this.opt.url,http = this.opt.http;
	var href = item.url,
		myHref = url.parse(href);
	var host = myHref.host,pathname = myHref.pathname;
	var http_client = http.request({
		hostname: host,
		method: 'GET',
		path: pathname,
		headers: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
			'Accept-Language': 'zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4',
			'Connection': 'keep-alive',
			// 'Content-Type': 'application/x-www-form-urlencoded',
			// 'Referer': 'http://music.163.com',
			'Pragma':'no-cache',
			'Host': host,
			'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
		}
	}, function(res) {
		res.on('error', function(err) {
			//回调，报错
			callback(err,null);
		});
		var fileBuffer = [];
		res.on('data',function(chunk){
			fileBuffer.push(new Buffer(chunk));
		});
		res.on('end',function(){
			var total = Buffer.concat(fileBuffer);
			fs.writeFile(download+'/'+(item.name || item.id) +'.mp3',total,function(err){
				that.log(`[${item.name}]  下载成功!`);
				callback(null,'over');
			});
		});
	});
	http_client.end();
}

var Down = function( opt ){
	new MusicLoad(opt);
}

module.exports = Down;