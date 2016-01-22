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
var protagonist = require('protagonist');

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

router.get('/*', function (request, response, next) {
    var file = './RAML/'+request.params[0]

    if (fs.existsSync(file)) {
        fs.readFile(file,'utf8', function(err, data){
            if (err){
                console.log(err)
                response.end(JSON.stringify(err, null, 3));
            }
            console.log(data);
            response.write(data);
            console.log('lets parse')
            var options = {
                generateSourceMap: true
            }
            data = '' +
                ''
            protagonist.parse(data,options, function (error, result) {
                if (!error) {
                    console.log('done!!!'.red);
                    response.write(JSON.stringify(result, null, 3));
                    response.end();
                } else {
                    console.log(error);
                    response.end(JSON.stringify(error, null, 3));
                }
            });
        });

    } else {
        response.write('file not found '+file);
        response.end();
    }

});


module.exports = router;