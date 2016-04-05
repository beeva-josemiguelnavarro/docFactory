var express = require('express');
var router = express.Router();

var url = require("url"),
    path = require("path"),
    fs = require("fs"),
    raml = require('raml-parser');

var swig = require('swig');
var marked = require('marked');
var colors = require("colors");
var raml2html = require('raml2html');

function toFile(file, content) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log('deleted file: '.red, file.green);
    }

    fs.writeFile(file, content, function (err) {
        if (err)
            console.error("Error".red, err);
        else
            console.log("output file".cyan, file.green, "was created!".cyan);
    });
}

var TEMPLATE_API_MARKET = './templates/apiMarket2Html/template.nunjucks'

router.get('/', function (request, response, next) {
    var uriParts = url.parse(request.url, true, true);
    var filename = uriParts.query.url
    if(filename.indexOf('http') == -1)
        filename = 'https://gitlab.digitalservices.es/dev-center/raml/raw/develop/' + filename + '?private_token=iZ8f2RZkT5zLhEFaE1BA'
    console.log(filename)
    var config = raml2html.getDefaultConfig();
    if (uriParts.query.template !== undefined)
        config = raml2html.getDefaultConfig(TEMPLATE_API_MARKET,__dirname+'/..');

    raml.loadFile(filename).then(function(data) {
        console.log(data)
        //toFile(filename+'.json',JSON.stringify(data,null,3))
        raml2html.render(data, config).then(function(htmlString){
            console.log('done!!')
            headers = {"Content-Type": "text/html; charset=utf-8"};
            response.writeHead(200, headers);
            response.write(htmlString);
            response.end();
        }, function(error){
            headers = {"Content-Type": "text/plain; charset=utf-8"};
            response.writeHead(400, headers);
            response.write(error.message);
            response.end();
        });
    }, function(error) {
        console.error("LOADFILE error ".red, error.context.cyan, "," + error.message);
        headers = {"Content-Type": "text/plain; charset=utf-8"};
        response.writeHead(400, headers);
        response.write(error.message);
        response.end();
    });

});

router.get('/*', function (request, response, next) {
    var filename = request.params[0]+'.raml';

    var uriParts = url.parse(request.url, true, true);
    console.log(uriParts)
    var config = raml2html.getDefaultConfig();
    if (uriParts.query.template !== undefined)
        config = raml2html.getDefaultConfig(TEMPLATE_API_MARKET,__dirname+'/..');

    console.log(filename)
    raml.loadFile('./RAML/'+filename).then(function(data) {
        //toFile(filename+'.json',JSON.stringify(data,null,3))
        console.log(data)
        raml2html.render(data, config).then(function(htmlString){
            console.log('done!!')
            headers = {"Content-Type": "text/html; charset=utf-8"};
            response.writeHead(200, headers);
            response.write(htmlString);
            response.end();
        }, function(error){
            headers = {"Content-Type": "text/plain; charset=utf-8"};
            response.writeHead(400, headers);
            response.write(error.message);
            response.end();
        });
    }, function(error) {
        console.error("LOADFILE error ".red, error.context.cyan, "," + error.message);
        headers = {"Content-Type": "text/plain; charset=utf-8"};
        response.writeHead(400, headers);
        response.write(error.message);
        response.end();
    });

});

module.exports = router;