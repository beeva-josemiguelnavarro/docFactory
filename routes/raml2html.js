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


router.get('/', function (request, response, next) {
    var uriParts = url.parse(request.url, true, true);
    var filename = uriParts.query.url

    raml.loadFile(filename).then(function(data) {
        var config = raml2html.getDefaultConfig();
        raml2html.render(data, config).then(function(htmlString){
            headers = {"Content-Type": "text/html; charset=utf-8"};
            response.writeHead(200, headers);
            response.write(htmlString);
            response.end();
        }, function(error){
            console.log("RAML2HTML error ".red, error.context.cyan, "," + error.message);
            sendError(error, response)
        });
    }, function(error) {
        console.error("LOADFILE error ".red, error.context.cyan, "," + error.message);
        sendError(error, response)
    });

});

router.get('/*', function (request, response, next) {
    var filename = request.params[0]+'.raml';

    raml.loadFile('./RAML/'+filename).then(function(data) {
        var config = raml2html.getDefaultConfig();
        raml2html.render(data, config).then(function(htmlString){
            headers = {"Content-Type": "text/html; charset=utf-8"};
            response.writeHead(200, headers);
            response.write(htmlString);
            response.end();
        }, function(error){
            console.log("RAML2HTML error ".red, error.context.cyan, "," + error.message);
            sendError(error, response)
        });
    }, function(error) {
        console.error("LOADFILE error ".red, error.context.cyan, "," + error.message);
        sendError(error, response)
    });

});

module.exports = router;