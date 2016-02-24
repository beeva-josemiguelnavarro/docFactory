var express = require('express');
var router = express.Router();

var url = require("url"),
    path = require("path"),
    fs = require("fs");

function sendFile(filename, request, response, next){
    try {
        fs.stat(filename,function(err, stats){
            if(err){
                response.end(err.toString());
            } else if(stats.isFile()){
                fs.readFile(filename, 'utf8', function(err,data){
                    if(!err){
                        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
                        response.end(data)
                    }
                    else
                        response.end(err);
                });
            } else
                response.end('File '+filename+' is not a file');
        })
    } catch (e){
        response.end("Error reading the file: "+filename);
    }

}
function displayLog(filename, request, response, next){
    var spliter = '******************* ';
    fs.stat(filename,function(err, stats){
        if(err){
            response.end(err);
        } else if(stats.isFile()){
            fs.readFile(filename, 'utf8', function(err,data){
                if(!err){
                    var splits = data.split('\n');
                    //var data = [];
                    //for(var index in splits){
                    //    //console.log(splits[index])
                    //    var itemSplits = splits[index].split(',')
                    //    var item = {}
                    //    for(var subindex in itemSplits){
                    //        item[subindex] = itemSplits[subindex]
                    //    }
                    //    //console.log(item)
                    //    data.push(item);
                    //}
                    //var headers = data.shift();
                    //response.render('stats',{headers:headers, data:data})
                    response.end(splits.join('<br>'))
                }
                else
                    response.end(err);
            });
        } else
            response.end('File '+filename+' is not a file');
    })
}

router.get('/userspro',function (request, response, next){
    var filename = '/home/ec2-user/workspace/business-intelligence-interfacing/csv/new_users_pro/activated_users.csv';
    //var filename = 'testQuery.csv'
    displayLog(filename,request,response,next);
})

router.get('/usersdev',function (request, response, next){
    var filename = '/home/ec2-user/workspace/business-intelligence-interfacing/csv/new_users_dev/activated_users.csv';
    displayLog(filename,request,response,next);
})

router.get('/', function (request, response, next) {
    console.log(request.url)
    var files = [
        {
            name: 'temp',
            path: '/sys/class/thermal/thermal_zone0/temp'
        },
        {
            name: 'users dev',
            path: '/home/ec2-user/workspace/business-intelligence-interfacing/csv/new_users_dev/activated_users.csv'
        },
        {
            name: 'users pro',
            path: '/home/ec2-user/workspace/business-intelligence-interfacing/csv/new_users_pro/activated_users.csv'
        },
        {
            name: 'log crm_welcome_user',
            path: '/tmp/crm_welcome_users.log'
        },
    ]
    response.render('../views/logs', {files:files});
});

router.get('/*', function (request, response, next) {
    console.log(request.url)
    //console.log(request.baseUrl)
    var filename = request.url
    sendFile(filename,request,response,next);
    //response.end();
});

module.exports = router;