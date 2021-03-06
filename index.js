var express = require('express');
var app = express();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var os = require("os");

var path = require('path');
var fs = require("fs");
var url = require("url");
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');

var minify = require('html-minifier').minify;

app.set('port', (process.env.PORT || 8000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var docFactory = require('./routes/app');
var ramlHtml =  require('./routes/raml2html');
var blueprint =  require('./routes/blueprint');
var logs =  require('./routes/logs');

app.use('/RAML',docFactory);
app.use('/raml2html',ramlHtml);
app.use('/blueprint',blueprint);
app.use('/logs',logs);

app.get('/', function (request, response, next) {
    response.sendFile(path.join(__dirname, 'views/main.html'))
});



//var storage = multer.diskStorage({
//    destination: function (req, file, cb) {
//        cb(null, 'uploads/')
//    },
//    filename: function (req, file, cb) {
//        cb(null, Date.now() + '.jpg') //Appending .jpg
//    }
//})

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './RAML/')
    },
    filename: function (req, file, cb) {
        cb(null, /*Date.now() +*/ file.originalname) //Appending .jpg
    }
})


app.post('/upload',multer({ storage: storage }).any(),function(request, response, next) {
    console.log(request.body) // form fields
    console.log(request.files) // form files
    var error = false
    for(var index in request.files){
        var filename = request.files[index].filename
        console.log(filename,fs.existsSync('./RAML/'+filename))
        if(!fs.existsSync('./RAML/'+filename))
            error = true
    }
    if(!error){
        response.writeHead(201, "Created");
        response.end()
    } else {
        response.writeHead(404, "Not Found");
        response.end();
    }
});


app.get('/documentations',function (request, response, next){
    console.log('getting docs')
    fs.readdir('./output/',function(err,files){
        if(err){
            console.log('error',err);
            response.writeHead(404, err);
            response.end();
        } else {
            console.log(files);
            var data = []
            for(var index in files){
                console.log(files[index])
                if(files[index].indexOf('.json')>-1){
                    data.push({
                        name:files[index],
                        url:'/RAML/json/'+files[index]
                    })
                } else if(files[index].indexOf('.html')>-1){
                    data.push({
                        name:files[index],
                        url:'/html?file='+files[index]
                    })
                }
            }
            console.log(data)
            response.send(data);
            response.end()
        }
    })
})

app.get('/html',function (request, response, next){
    var uriParts = url.parse(request.url, true, true);
    fs.readFile('./output/'+uriParts.query.file, "utf8", function(err, data) {
        if (!err) {
            response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
            response.end(minify(data, { removeAttributeQuotes: true, collapseWhitespace:true }));
        } else {
            console.log ('file not found: ' + uriParts.query.file);
            //response.setHeader('Content-type' , headers);
            response.writeHead(404, "Not Found");
            response.end();
        }
    });

})


app.get('/htmlFull',function (request, response, next){
    var uriParts = url.parse(request.url, true, true);
    fs.readFile('./templates/full/fullHeader.html', function(err, top) {
        if (!err) {
            fs.readFile('./templates/full/fullFooter.html', function(err, footer) {
                if (!err) {
                    fs.readFile('./output/'+uriParts.query.file, function(err, body) {
                        if (!err) {
                            response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                            response.end(top +body + footer);
                        } else {
                            console.log ('file not found: ' + uriParts.query.file);
                            //response.setHeader('Content-type' , headers);
                            response.writeHead(404, "Not Found");
                            response.end();
                        }
                    });
                } else {
                    console.log ('FOOTER file');
                    //response.setHeader('Content-type' , headers);
                    response.writeHead(404, "Not Found");
                    response.end();
                }
            });
        } else {
            console.log ('HEADER not found');
            //response.setHeader('Content-type' , headers);
            response.writeHead(404, "Not Found");
            response.end();
        }
    });

})

app.get('/ramls',function (request, response, next){
    console.log('getting ramls')
    fs.readdir('./RAML/',function(err,files){
        if(err){
            console.log('error',err);
            response.writeHead(404, err);
            response.end();
        } else {
            console.log(files);
            var data = []
            for(var index in files){
                console.log(files[index])
                if(files[index].indexOf('.raml')>-1){
                    data.push({
                        name:files[index],
                        url:'/RAML/file/'+files[index]
                    })
                }else if(files[index].indexOf('.json')>-1){
                    data.push({
                        name:files[index],
                        url:'/RAML/json/'+files[index]
                    })
                }
            }
            console.log(data)
            response.send(data);
            response.end()
        }
    })
})

app.listen(app.get('port'), function () {
    console.log('Node app is running on ',process.env.npm_package_url,':', app.get('port'));
});
