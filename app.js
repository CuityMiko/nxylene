//引入 `express` 模块，并将它赋予 `express` 这个变量等待使用。
var express = require('express')
var path = require('path')
var morgan = require('morgan')//用户请求日志中间件
var bodyParser = require('body-parser')//请求内容解析中间件
var methodOverride = require('method-override') //HTTP伪造中间件
var cookieParser = require('cookie-parser')//解析Cookie头和填充req.cookies 中间件
var expressSession = require('express-session')//简单的基于会话中间件。
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo')(expressSession)//将connect的session持久化到mongodb中的
var port = process.env.PORT || 6001
var config = require('./conf/_config.json')
// 调用 express 实例，它是一个函数，不带参数调用时，会返回一个 express 实例，将这个变量赋予 app 变量。
var app = express()

var themes = 'default'
var dbUrl = 'mongodb://localhost/nxylene'

if (process.env.VCAP_SERVICES) {
    var db_config = JSON.parse(process.env.VCAP_SERVICES).mongodb[0].credentials;
    dbUrl = db_config.uri
}

// app.set("view","./view/pages")
app.set('views', __dirname + '/themes/' + themes + '/views/pages');
app.set('view engine','ejs')

//如果不愿意使用默认的layout.ejs，则可以设置layout为false
app.set('view options',{
    "layout":false,
})

//静态资源使用目录
app.use(express.static(__dirname + '/themes/' + themes + '/source'));
// app.use(express.static(path.join(__dirname,'source')));

app.use(morgan('dev')); //将每个请求记录到控制台
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded  
app.use(bodyParser.json()); // parse application/json  
app.use(methodOverride());  // simulate DELETE and PUT
app.use(cookieParser())
app.use(expressSession({
    secret: 'nxylene',
    store: new mongoStore({
        url:dbUrl,
        collection:'sessions'
    }),
    cookie: {maxAge: 30*60*1000 },//设置maxAge是600000ms，即10分钟后session和相应的cookie失效过期
    resave: true, 
    saveUninitialized: true
}))

//添加路由
require('./conf/routes')(app);

//运行： NODE_ENV=dev node app.js
if ('dev' === app.get('env')) {
    app.use(morgan('dev'))//中间件日志
    mongoose.set('debug', true);
}
var MongoDB = mongoose.connect(dbUrl).connection;
MongoDB.on('error', function(err) { console.log("mongodb error::"+err.message); });
MongoDB.once('open', function() {
    console.log("mongodb connection open");
});

// 定义好我们 app 的行为之后，让它监听本地的 3000 端口。
// 这里的第二个函数是个回调函数，会在 listen 动作成功后执行，我们这里执行了一个命令行输出操作，告诉我们监听动作已完成。
// 端口的作用：通过端口来区分出同一电脑内不同应用或者进程，从而实现一条物理网线(通过分组交换技术-比如internet)同时链接多个程序 
// [Port_(computer_networking)](http://en.wikipedia.org/wiki/Port_(computer_networking))
// 端口号是一个 16位的 uint, 所以其范围为 1 to 65535 (对TCP来说, port 0 被保留，不能被使用. 
// 对于UDP来说, source端的端口号是可选的， 为0时表示无端口).
app.listen(port,function(){
    console.log("==========================");
    console.log("开始启动:" + 'http://127.0.0.1:' +port);
})

module.exports = app
