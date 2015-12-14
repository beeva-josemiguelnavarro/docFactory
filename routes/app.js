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


var all_templates = "";
var all_index = "";
var all_summary = "";
var dataHead;

/*********************/
function removeHtmlComments(text){
    var fixedText = text;
    while(fixedText.indexOf('<!--')!=-1){
        var indexStart = fixedText.indexOf('<!--');
        var indexEnd = fixedText.indexOf('-->');
        var comment = fixedText.substring(indexStart,indexEnd+3);
        //console.log(comment);
        fixedText = fixedText.replace(comment,"");
    }
    return fixedText.trim().replace(/^\s*\n/gm,'');
}

function removeIds(text){
    while(text.indexOf('id=')!=-1){
        var indexStart = text.indexOf('id');
        var indexEnd = text.indexOf('\"',indexStart+4);
        var textToRemove = text.substring(indexStart,indexEnd+1);
        //console.log(textToRemove);
        text = text.replace(textToRemove,'');
    }
    return text
}
function removeTags(text){
    if(text.trim()!='<p>undefined</p>' && text.trim()!='<p>null</p>'){
        //console.log('\ntext: ',text,'\nlength: ',text.length,'\n----------\n');
        text = text.replace(/<pre><code>/g, "");
        text = text.replace(/<\/code><\/pre>/g, "");
        text = text.replace(/<p>/g, "");
        text = text.replace(/<\/p>/g, "");
        text=removeIds(text);
    } else {
        console.log('NOT DEFINED');
        text = '';
    }
    return text;
}

function toFile(file, content){
    //console.log('FILE name: ',file)
    if(fs.existsSync(file)){
        fs.unlinkSync(file);
        console.log('deleted file: '.red,file.green);
    }
    if(file.indexOf('.html')>-1){
        //console.log('html')
        content = removeHtmlComments(content);
    }
    else if(file.indexOf('.json')>-1){
        //console.log('json')
        content = JSON.stringify(content)
    }
    //console.log('lets write')
    fs.writeFile(file, content, function(err) {
        if(err)
            console.error("Error".red, err);
        else
            console.log("output file".cyan, file.green, "was created!".cyan);
    });
    //fs.writeFileSync(file, content,'utf8')
}

function replaceCharacteresInAnchor(name){
    return name.toLowerCase().replace('.','').replace('\'','').replace(' & ',' ').replace('&','').replace(/\//g,'-').replace(/\{/g,'').replace(/\}/g,'').trim().split(' ').join('-');
}
function generateAnchor(name){
    //console.log('_NAME: '.red,name);
    if(name.indexOf('\/')==0){
        //console.log('NEW X: '.cyan,replaceCharacteresInAnchor(name))
        name = name.substring(1)
    }
    //console.log('NEW N: '.cyan,replaceCharacteresInAnchor(name))
    return replaceCharacteresInAnchor(name);
}
/*****************************************************************/
function resolveFullURI(ramlData, fullUri, uriParams) {
    uriResolved = fullUri //"https://{endpoint}/{apiPath}/{version}/tvm/{bookTitle}"
    for (key in ramlData.baseUriParameters) {
        //console.log(key, ramlData.baseUriParameters[key])
        if(whatIsIt(ramlData.baseUriParameters[key]["example"]) == "undefined" &&
            whatIsIt(ramlData.baseUriParameters[key]["enum"]) == "undefined"){
            throw "BaseUriParams must have 'example' value or enum. {"+key+"} " + fullUri;
        }
        tempvaluri = "";
        if (whatIsIt(ramlData.baseUriParameters[key]["example"]) == "undefined") {
            tempvaluri = ramlData.baseUriParameters[key]["enum"][0];
        } else {
            tempvaluri = ramlData.baseUriParameters[key]["example"]
        }
        uriResolved = uriResolved.replace("{" + key + "}", tempvaluri);
    }
    for (key in uriParams) {
        if(whatIsIt(uriParams[key]["example"]) == "undefined" &&
            whatIsIt(uriParams[key]["enum"]) == "undefined"){
            throw "URIParams must have 'example' value or enum. {"+uriParams[key]["key"]+"} "+ fullUri;
        }
        tempvaluri = "";
        if (whatIsIt(uriParams[key]["example"]) == "undefined") {
            tempvaluri = uriParams[key]["enum"][0];
        } else {
            tempvaluri = uriParams[key]["example"]
        }
        uriResolved = uriResolved.replace("{" + uriParams[key]["key"] + "}", tempvaluri);
    }
    return uriResolved;
}

function resolveUris(ramlData, fullUri, uriParams) {

    uriResolved = fullUri //"https://{endpoint}/{apiPath}/{version}/tvm/{bookTitle}"
    uris = []
    if(whatIsIt(uriParams) == "undefined"){
        console.log('uriparams undefined')
        uris.push(fullUri)
    }else if(fullUri.indexOf('{')==-1){
        throw "baseUri must have a parameter - "+fullUri;
    } else {
        if(whatIsIt(ramlData.baseUriParameters) == "undefined" || ramlData.baseUriParameters.length <= 0 ){
            throw "BaseUriParams must be provided";
        } else {
            var tempUri = uriResolved;
            for (key in ramlData.baseUriParameters) {
                if(whatIsIt(ramlData.baseUriParameters[key]["example"]) == "undefined" &&
                    whatIsIt(ramlData.baseUriParameters[key]["enum"]) == "undefined"){
                    throw "BaseUriParams must have 'example' value or enum. {"+key+"} " + fullUri;
                }
                if(key != 'env'){
                    var paramValue;
                    if (whatIsIt(ramlData.baseUriParameters[key]["example"]) == "undefined") {
                        paramValue = ramlData.baseUriParameters[key]["enum"][0];
                    } else {
                        paramValue = ramlData.baseUriParameters[key]["example"]
                    }
                    tempUri = tempUri.replace("{" + key + "}", paramValue);

                }
            }
            if (whatIsIt(ramlData.baseUriParameters["env"]) != "undefined") {
                if (whatIsIt(ramlData.baseUriParameters["env"]["enum"]) != "undefined") {
                    for (value in ramlData.baseUriParameters["env"]["enum"]) {
                        //console.log(tempUri.replace("{" + key + "}", ramlData.baseUriParameters["env"]["enum"][value]))
                        uris.push(tempUri.replace("{env}", ramlData.baseUriParameters["env"]["enum"][value]))
                    }
                } else if (whatIsIt(ramlData.baseUriParameters["env"]["example"]) != "undefined"){
                    //console.log(tempUri.replace("{" + key + "}", ramlData.baseUriParameters["env"]["example"]))
                    uris.push(tempUri.replace("{env}", ramlData.baseUriParameters["env"]["example"]))
                }
            }
        }
    }
    //console.log(uris,'-----',uris.length)
    uriResolved = {}
    if(uris.length>1){
        for(uriIndex in uris){
            if( uris[uriIndex].indexOf('sbx')>1)
                uriResolved.sandbox = uris[uriIndex];
            else
                uriResolved.live = uris[uriIndex];
        }
    } else {
        uriResolved.uri = uris[0];
    }
    console.log('*****',uriResolved,'*****')
    return uriResolved;
}

function sendError(error, r) {
    r.writeHead(501, {"Content-Type": "text/plain"});
    r.write(""+error);
    r.end();
}

function compileTemplate(data, template) {
    var template = swig.compileFile(__dirname + "/.."+"/"+template);
    var output = template(data);
    //toFile(destination, output);
    return output.trim();
}

function addSpaces(stringToReplace){
    stringToReplace=stringToReplace+""
    return stringToReplace.replace(/,/g,", ")
}

function renderMD(stringToRender){
    //console.log("RENDERING", stringToRender);
    return marked(stringToRender).trim();
}

function cleanKey(stringToReplace) {
    stringToReplace=stringToReplace+""
    return stringToReplace.replace(/\//g, "-");
}

function whatIsIt(object) {
    if (object === null) {
        return "null";
    } else if (object === undefined) {
        return "undefined";
    } else if (object.constructor === String) {
        return "String";
    } else if (object.constructor === Array) {
        return "Array";
    } else if (object.constructor === Object) {
        return "Object";
    } else if (object.constructor === Boolean) {
        return "Boolean";
    } else if (object.constructor === Number) {
        return "Number";
    } else {
        return "don't know but" + object.constructor;
    }
}

function formatedApiMarket(compiledHtml){
    while(compiledHtml.indexOf('<a href="#/')>-1)
        compiledHtml = compiledHtml.replace('<a href="#/','<a href="/');
    while(compiledHtml.indexOf('<a href')>-1)
        compiledHtml = compiledHtml.replace('<a href','<a class="api__documentation-link" target="_blank" href');
    //while(compiledHtml.indexOf('<a class="')>-1)
    //    compiledHtml = compiledHtml.replace('<a class="','<a class="api__documentation-link ');
    while(compiledHtml.indexOf('<table>')>-1)
        compiledHtml = compiledHtml.replace('<table>','<table class="api__documentation--table-elements">');
    while(compiledHtml.indexOf('<p>')>-1)
        compiledHtml = compiledHtml.replace('<p>','<p class="api__documentation__text">');
    while(compiledHtml.indexOf('<h1 id')>-1)
        compiledHtml = compiledHtml.replace('<h1 id','<h1 class="api__documentation__title api__documentation__title__inner" id');
    while(compiledHtml.indexOf('<h2 id')>-1)
        compiledHtml = compiledHtml.replace('<h2 id','<h2 class="api__documentation__title api__documentation__title__inner" id');
    while(compiledHtml.indexOf('<h3 id')>-1)
        compiledHtml = compiledHtml.replace('<h3 id','<h3 class="api__documentation__title api__documentation__title__inner" id');
    while(compiledHtml.indexOf('<h4 id')>-1)
        compiledHtml = compiledHtml.replace('<h4 id','<h4 class="api__documentation__title api__documentation__title__inner" id');
    while(compiledHtml.indexOf('<ul>')>-1)
        compiledHtml = compiledHtml.replace('<ul>','<ul class="api__documentation__unordered-list">');
    while(compiledHtml.indexOf('<ol>')>-1)
        compiledHtml = compiledHtml.replace('<ol>','<ol class="api__documentation__ordered-list">');
    while(compiledHtml.indexOf('<pre>')>-1)
        compiledHtml = compiledHtml.replace('<pre>','<pre class="example__code-container">')
    //compiledHtml = removeIds(compiledHtml)
    return compiledHtml;
}

function parseResources(ramlData, baseUri, resources, parentRUri, parentUriParameters) {
    //console.log(resources.length);
    for (var resourceKey in resources) {

        //console.log(resourceKey, resources[resourceKey].relativeUri);
        //console.log("all Methods", resource["methods"]);

        currentPath = parentRUri + resources[resourceKey].relativeUri;
        /********************************/
        var uripars = []

        for (var uriParKey in resources[resourceKey]["uriParameters"]) {
            ouripar = resources[resourceKey]["uriParameters"][uriParKey];
            ouripar.key = uriParKey;
            ouripar.text = (ouripar.required ? "required " : "optional ") + (ouripar.type == "number" ? "float" : ouripar.type);
            //console.log(ouripar.text);
            uripars.push(ouripar);
        }

        /* ADDING PARENT URI PARAMETERS */
        if(parentUriParameters != null) for (var uriParKey in parentUriParameters) {
            //console.log(uriParKey.red,'\n',parentUriParameters);
            ouripar = parentUriParameters[uriParKey];
            ouripar.key = uriParKey;
            ouripar.text = (ouripar.required ? "required " : "optional ") + (ouripar.type == "number" ? "float" : ouripar.type);
            //console.log(ouripar.text);
            uripars.push(ouripar);
        }
        /*END ADDING PARENT URI PARAMETERS */
        /*********************************************/
        var anchorBase = "";
        var dataIndex = new Object();
        dataIndex.methods = [];

        if (whatIsIt(resources[resourceKey]["methods"]) != "undefined") {
            var dataHeadTempl = new Object();
            if(resources[resourceKey]["description"]!=undefined)
                dataHeadTempl["description"] = marked(resources[resourceKey]["description"]);
            else
                dataHeadTempl["description"] = marked("MISSING description")
            if(resources[resourceKey]["displayName"]!=undefined){
                dataHeadTempl["displayName"] = resources[resourceKey]["displayName"];
                dataHeadTempl["anchorName"] = resources[resourceKey]["relativeUri"];
            }
            else{
                dataHeadTempl["displayName"] = "MISSING displayName"//resources[resourceKey]["relativeUri"].replace('/','');
                dataHeadTempl["anchorName"] = resources[resourceKey]["relativeUri"];
            }

            //if(whatIsIt(dataHeadTempl["displayName"]) == "undefined"){
            //    throw "Undefined 'displayName' for method in " + JSON.stringify(resources[resourceKey], null, 3);
            //}
            //if(whatIsIt(dataHeadTempl["description"]) == "undefined"){
            //    throw "Undefined 'description' for method in " + JSON.stringify(resources[resourceKey], null, 3);
            //}
            /*
             TODO get description from documentation of the raml root section
             */
            anchorBase = generateAnchor( parentRUri + dataHeadTempl["anchorName"])
            dataHeadTempl["anchor"] = anchorBase;
            dataHeadTempl["cleanKey"] = cleanKey;
            dataHeadTempl["renderMD"] = renderMD;
            dataHeadTempl["formatedApiMarket"] = formatedApiMarket;
            all_templates += formatedApiMarket(compileTemplate(dataHeadTempl, "templates/api_market/serviceInfoBlock.html"));
            dataIndex.anchor = anchorBase;
            dataIndex.displayName = dataHeadTempl["displayName"];
        }

        for (var methodKey in resources[resourceKey]["methods"]) {
            dataobject = new Object();
            //console.log(resources[resourceKey]["methods"][methodKey])
            dataobject.queryParams = [];
            omethod = resources[resourceKey]["methods"][methodKey];
            //omethod.description = marked(omethod.description+"");
            //omethod.description+="";
            //omethod.description = formatedApiMarket(removeTags(omethod.description));
            omethod.description = formatedApiMarket(marked(omethod.description));
            var methods = {}
            //for(var res in omethod.responses)
            //    console.log(omethod.responses[res])
            dataobject.methodData = omethod;
            //console.log(omethod)

            if(whatIsIt(omethod.method) == "undefined"){
                throw "Undefined method name for " + + JSON.stringify(resources[resourceKey], null, 3);
            }

            dataobject.anchor = anchorBase + "-" + omethod.method.toLowerCase();
            dataobject.path = currentPath;
            dataobject.uriParams = uripars;
            dataobject.baseUri = baseUri;
            dataobject.fullUri = baseUri + currentPath;

            if(omethod.method == "post" && omethod.body && omethod.body['application/x-www-form-urlencoded'] && omethod.body['application/x-www-form-urlencoded']['formParameters']){
                dataobject.postFormPars = omethod.body['application/x-www-form-urlencoded']['formParameters'];
                //console.log("BODY", dataobject.postBodyPars);
            }
            else if(omethod.method == "post"){
                dataobject.postBodyPars = omethod.body;
                //console.log(omethod.body);
            }

            dataIndex.methods.push(dataobject);

            if(omethod.headers != null){
                dataobject.headers = omethod.headers
            }
            else {
                dataobject.headers = null
            }

            if(omethod["securedBy"] && omethod["securedBy"].indexOf("basic") != -1 ){
                dataobject.headers["Authorization"] = { "description": "This header should be included only when using Basic Access Authorization.", "example": "Basic YXBwLmJidmEudGVzdDoxMjM0NTY3OA==", "displayName": "Authorization", "type": "string", "required":true };
            }

            //console.log("QUERY PARAMS", JSON.stringify(omethod.queryParameters, null, 2));
            for (var qParamKey in omethod.queryParameters) {
                oqueryparam = omethod.queryParameters[qParamKey];
                oqueryparam.key = qParamKey;
                oqueryparam.text = (oqueryparam.required ? "required " : "optional ") + (oqueryparam.type == "number" ? "float" : oqueryparam.type) +".";
                console.log(oqueryparam)
                console.log('--------')
                dataobject.queryParams.push(oqueryparam);
            }

            //Generate examples for curl and java
            dataobject["resolvedUri"] = resolveFullURI(ramlData, dataobject.fullUri, dataobject.uriParams)
            qpars = "";
            for(key in dataobject.queryParams){
                if(dataobject.queryParams[key]["required"])
                    qpars += dataobject.queryParams[key]["key"]+"="+dataobject.queryParams[key]["example"]+"&";
            }
            //console.log('point1')
            dataobject["resolvedUriParams"]=dataobject["resolvedUri"]+(qpars!=""?"?"+qpars.substring(0, qpars.length-1) :"");
            dataobject["url"] = {}
            tempurl = dataobject["resolvedUri"].split(":");
            dataobject["url"]["protocol"] = tempurl[0];
            //console.log('point2',tempurl)
            tempurl = tempurl[1].substring(2);
            dataobject["url"]["host"] = tempurl.substring(0, tempurl.indexOf("/"));
            dataobject["url"]["path"] = tempurl.substring(tempurl.indexOf("/"));
            //console.log('point3')

            if(whatIsIt(omethod.body) == "undefined"){
                dataobject["curlexample"] = compileTemplate(dataobject, "templates/code/example.nobody.curl");
                dataobject["javaexample"] = compileTemplate(dataobject, "templates/code/example.nobody.java");
                dataobject["pythexample"] = compileTemplate(dataobject, "templates/code/example.nobody.py");
            }
            else {
                if(omethod.body['application/x-www-form-urlencoded'] && omethod.body['application/x-www-form-urlencoded']['formParameters']){
                    dataobject["curlexample"] = compileTemplate(dataobject, "templates/code/example.form.curl");
                    dataobject["javaexample"] = compileTemplate(dataobject, "templates/code/example.form.java");
                    dataobject["pythexample"] = compileTemplate(dataobject, "templates/code/example.form.py");
                }
                else{
                    dataobject["curlexample"] = compileTemplate(dataobject, "templates/code/example.body.curl");
                    dataobject["javaexample"] = compileTemplate(dataobject, "templates/code/example.body.java");
                    dataobject["pythexample"] = compileTemplate(dataobject, "templates/code/example.body.py");
                }
            }

            dataobject["cleanKey"] = cleanKey;
            dataobject["renderMD"] = renderMD;
            dataobject["addSpaces"] = addSpaces;
            dataobject["formatedApiMarket"] = formatedApiMarket;

            //console.log(JSON.stringify(dataobject, null, 3))

            all_templates += compileTemplate(dataobject, "templates/api_market/serviceDocumentationBlock.html");

        }

        //console.log("methods size ", dataIndex.methods.length);

        if (dataIndex.methods.length > 0) {
            //console.log("entrando", dataIndex);
            all_index += compileTemplate(dataIndex, "templates/api_market/sidebarListServices.html")
            //console.log("saliendo");
        }

        if (resources[resourceKey].hasOwnProperty("resources")) {
            parseResources(ramlData, baseUri, resources[resourceKey]["resources"], currentPath, resources[resourceKey]["uriParameters"])
        }

    }

}

function parseRaml(data,filename, request, response, next){
    var uriParts = url.parse(request.url, true, true);
    var apiName = uriParts.query.apiName;
    var overviewLink = uriParts.query.overviewLink;

    try {
        console.log('lets try!!')
        /* Generating info for headers */
        //console.log(data);
        dataHead = new Object();
        dataHead["documentation"] = [];
        dataHead["api_description"] = [];
        dataHead['documentation_article'] = [];
        //console.log("***************************");

        //console.log("title")
        if(whatIsIt(data["title"])!="undefined" &&  data["title"].length>0)
            dataHead["api_description"]['title']=data["title"];
        //console.log("version")
        if(whatIsIt(data["version"])!="undefined" && data["version"].length>0)
            dataHead["api_description"]['version']=data["version"];
        //console.log("protocols")
        if(whatIsIt(data["protocols"])!="undefined" &&  data["protocols"].length>0)
            dataHead["api_description"]['protocols']=data["protocols"];
        //console.log("baseUri")
        if(whatIsIt(data["baseUri"])!="undefined" &&  data["baseUri"].length>0)
            dataHead["api_description"]['uris']=resolveUris(data,data.baseUri,data.baseUriParameters);
        dataHead["baseUri"] = resolveFullURI(data,data.baseUri,null);

        if(whatIsIt(data["documentation"])!="undefined")
            for(i=0;i<data["documentation"].length;i++){
                docitem = {};
                docitem.displayName = data["documentation"][i]["title"];
                tempContent = data["documentation"][i]['content']
                tempContent = marked(tempContent)
                //while(tempContent.indexOf('··')>-1){
                //    var indexBefore = tempContent.indexOf('··1.')
                //    var indexAfter = tempContent.substring(indexBefore+1).indexOf('</li>')
                //    var tempStringBefore = tempContent.substring(0,indexBefore-1)
                //    var tempStringAfter =  tempContent.substring(indexBefore+1).substring(indexAfter)
                //    var blockToFormat = tempContent.substring(indexBefore-1,indexAfter-1)
                //    blockToFormat = blockToFormat.replace('··1.','<li>')
                //    while(blockToFormat.indexOf('··')>-1){
                //        var indexInit = blockToFormat.indexOf('··')
                //        var indexEnd = blockToFormat.substring(0,indexInit+2).indexOf('.')
                //        var partBefore = blockToFormat.substring(0,indexInit-1)
                //        var partAfter = blockToFormat.substring(indexEnd+1)
                //        blockToFormat = partBefore +'</li><li>'+partAfter
                //    }
                //    var formatedBlock = '<ol class="api__documentation__ordered-list">' + blockToFormat + '</ol>'
                //    console.log(formatedBlock)
                //    console.log('----')
                //    tempContent = tempStringBefore + formatedBlock + tempStringAfter
                //}
                docitem.description = tempContent
                docitem.anchor = generateAnchor("documentation-"+docitem.displayName)
                dataHead["documentation"].push(docitem);

                out = formatedApiMarket(compileTemplate(docitem, "templates/api_market/serviceInfoBlock.html"));

                dataHead['documentation_article']+=out
            }

        dataHead["overview_link"]=overviewLink;
        //dataHead["console_link"]="./console";
        dataHead["console_link"]="";
        //dataHead["get_api_link"]="PUT_API_NAME_WITH_UNDERSCORES_INSTEAD_OF_SPACES";
        dataHead["get_api_link"]="";
        dataHead["apiName"]=apiName;
        /***************/

        all_templates = "";
        all_index = "";
        all_summary = "";

        //parseMainResources(data,dataHead["baseUri"])
        parseResources(data, dataHead["baseUri"], data["resources"], "", null);

        var template = "";

        if (uriParts.query && uriParts.query.template && uriParts.query.template == "security") {
            console.log('security');
            template = swig.compileFile(__dirname + "/.."+"/templates/api_market/securityTemplate.html");
        } else if (uriParts.query && uriParts.query.full && uriParts.query.full == "true") {
            template = swig.compileFile(__dirname + "/.." + "/templates/api_market/bodyTemplateFullApiMarket.html");
        } else {
            template = swig.compileFile(__dirname + "/.." + "/templates/api_market/bodyTemplate.html");
        }

        dataHead["all_templates"] = all_templates;
        if(whatIsIt(dataHead["documentation"])!="undefined"){
            dataHead["documentation_index"] = compileTemplate(dataHead, "templates/api_market/sidebarListDocumentation.html");
        }
        dataHead["all_index"] = all_index;
        var output = template(dataHead);
        var content = "";
        //
        //if(uriParts.query.url == "online"){
        //    var indexInitial = urlRamlToParse.indexOf("://")+3;
        //    toFile("../output/"+(urlRamlToParse).substring(indexInitial).replace(".raml",".html").replace(/\//g,'_'),output.substring(output.indexOf("<!-- BUTTONS BAR -->")-1,output.indexOf("<!-- CONTENT BLOCK END-->")-1));
            toFile("./output/"+filename.replace(".raml",".html"),output.substring(output.indexOf("<!-- BUTTONS BAR -->")-1,output.indexOf("<!-- CONTENT BLOCK END-->")-1));
        //}else {
        //    toFile('./output/'+filename,output.substring(output.indexOf("<!-- BUTTONS BAR -->")-1,output.indexOf("<!-- CONTENT BLOCK END-->")-1));
        //}

        var headers = {};
        if (uriParts.query && uriParts.query.output && uriParts.query.output == "html") {
            headers = {
                "Content-Type": "text/plain; charset=utf-8"
            };
            content = removeHtmlComments(output.substring(output.indexOf("<body>")+6,output.indexOf("</body>")-1));
        } else {
            headers = {
                "Content-Type": "text/html; charset=utf-8"
            };
            content = output;
        }

        console.log('sending response')
        response.writeHead(200, headers);
        //response.end(content);
        response.end(removeHtmlComments(output.substring(output.indexOf("<!-- BUTTONS BAR -->")-1,output.indexOf("<!-- CONTENT BLOCK END-->")-1)))

        console.log("All done...".rainbow);
    } catch (e) {
        console.error("Error inner -", e.message);
        sendError(e, response)
    }
}
router.get('/', function (request, response, next) {
    response.redirect('/')
});

function preprocessRamlJson(data,params){
    var baseuri = params.baseuri
    console.log('baseuri->',baseuri)
    var baseuriEnv = params.baseuriEnv
    console.log('baseuriEnv->',baseuriEnv)
    var quickstart = params.quickstart
    console.log('quickstart->',quickstart)
    var apiName = params.apiName
    console.log('apiName->',apiName)
    var termsLink = params.termsLink
    console.log('termsLink->',termsLink)
    var updatedData = data;
    if(baseuriEnv!==undefined){
        console.log('prev params->',updatedData["baseUriParameters"])
        updatedData["baseUri"] = 'https://{domain}/'+apiName.toLowerCase().replace(' ','-')+'{env}/'+updatedData['version']
        updatedData["baseUriParameters"] = {
            domain: {
                description: 'Public domain for BBVA APIs',
                enum: ['apis.bbva.com']
            },
            env:{
                description: 'Environment',
                enum:['',baseuriEnv]
            }
        }
        console.log('baseuri->',updatedData["baseUri"])
        console.log('parameters->',updatedData["baseUriParameters"])
    } else if(baseuri!==undefined){
        //console.log('before baseUri: ',updatedData["baseUri"])
        updatedData["baseUri"] = baseuri
        //console.log('after baseUri: ',updatedData["baseUri"])
    }
    var indexTerms = -1
    if(updatedData["documentation"]===undefined)
        updatedData["documentation"] = []
    for(var index in updatedData["documentation"]){
        if(updatedData["documentation"][index].title.toLowerCase().indexOf('terms')>-1)
            indexTerms = index
        if(quickstart==='paystats' && updatedData["documentation"][index].title.indexOf('Authentication')>-1){
            var textAuth = fs.readFileSync(__dirname + "/../"+'templates/2LEGSOAUTH.md','utf8');
            var authentication = {
                title:'Authentication',
                content: textAuth
            }
            var documentation = updatedData["documentation"]
            documentation.splice(index,1,authentication)
            updatedData["documentation"] = documentation
        }
    }
    if(quickstart!==undefined && quickstart!=='no'){
        var quickstartText= {
            paystats: 'templates/quickstart/PAYSTATS.md',
            general: 'templates/quickstart/GENERAL.md'
        }
        var quickText = fs.readFileSync(__dirname + "/../"+quickstartText[quickstart],'utf8')
        quickText = quickText.replace(/\"api-name\"/g,apiName)
        var documentation = updatedData["documentation"]
        var quickstart = {
            title:'Quickstart',
            content: quickText
        }
        if(indexTerms>-1){
            documentation.splice(indexTerms,0,quickstart)
        } else { //no terms & conds
            documentation.push(quickstart)
            var textTerms = fs.readFileSync(__dirname + "/../"+'templates/TERMSANDCONDS.md','utf8');
            textTerms = textTerms.replace("\"api-name\"",apiName)
            textTerms = textTerms.replace("\"terms-link\"",termsLink)
            var terms = {
                title:'Terms & Conditions',
                content: textTerms
            }
            documentation.push(terms)
        }
        updatedData["documentation"] = documentation
        //console.log(updatedData["documentation"])
    }
    return updatedData
}

router.get('/online',function (request, response, next) {
    var uriParts = url.parse(request.url, true, true);
    var uriFile =   uriParts.query.uri
    var filename =  Date.now() + uriParts.query.apiName + '.raml'
    console.log('Getting online: ' ,uriFile,' out: ',filename)
    raml.loadFile(uriFile).then(function(data) {
        //console.log('tofile')
        //toFile('./RAML/'+filename.replace('.raml','.json'),data)
        console.log(data)
        parseRaml(preprocessRamlJson(data,uriParts.query),filename, request, response,next)
    }, function(error) {
        console.error("/online/ Error loading online file -".red, error.context.cyan, "," + error.message);
        sendError(error, response)
    });
});

router.get('/file',function (request, response, next) {
    var uriParts = url.parse(request.url, true, true);
    var pathFile =  './RAML/'+uriParts.query.filePath;
    var filename = uriParts.query.apiName+'_'+pathFile.replace('.raml','.html').substring(pathFile.lastIndexOf('/')+1)
    console.log('Getting file: ' ,pathFile,' out: ',filename)
    raml.loadFile(pathFile).then(function(data) {
        //console.log('tofile')
        //toFile(pathFile.replace('.html','.json'),data)
        console.log('parse')
        parseRaml(preprocessRamlJson(data,uriParts.query),filename, request, response,next)
    }, function(error) {
        console.error("/online/ Error loading online file -".red, error.context.cyan, "," + error.message);
        sendError(error, response)
    });

});

router.get('/json/:jsonFileName',function (request, response, next) {
    var uriParts = url.parse(request.url, true, true);
    var route =  './output/'+request.params.jsonFileName;
    var filename = request.params.jsonFileName.replace('.json','.html')
    console.log('Getting json: ' ,route,' out: ',filename)
    fs.readFile(route, function(err, data) {
        if (!err) {
            parseRaml(preprocessRamlJson(data,uriParts.query),filename,request, response,next)
            //response.setHeader('Content-type' , 'application/json');
            //response.send(data);
            //response.end();
        } else {
            console.log ('file not found: ' + route);
            //response.setHeader('Content-type' , headers);
            response.writeHead(404, "Not Found");
            response.end();
        }
    });
});

module.exports = router;