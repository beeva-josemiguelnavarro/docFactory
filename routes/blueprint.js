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
var aglio = require('aglio');

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

function indentText(text, indent){
    var lines = text.split('\n')
    var indentedText = ''
    for(var line in lines){
        indentedText += indent+lines[line]+'\n'
    }
    return indentedText;
}

function indentJson(json,indent){
    var indentedJson = ''
    console.log('++++',json)
    var jsonLines = JSON.stringify(JSON.parse(json),null,2).split('\n')
    for(var indexOfJsonLines in jsonLines){
        console.log(indent+jsonLines[indexOfJsonLines])
        indentedJson += indent+jsonLines[indexOfJsonLines]+'\n'
    }
    console.log(indentedJson)
    return indentedJson
}
function parseMetadataSection(blueprint){
    var content = ''
    var indexFirstMarkdown = blueprint.indexOf('\n# ');
    var metadataSection = blueprint.substring(0,indexFirstMarkdown-1)
    var metadataLines = metadataSection.split('\n')
    for(var indexLine in metadataLines){
        var lineContent = []
        var indexOfColon = metadataLines[indexLine].indexOf(':')
        lineContent[0] = metadataLines[indexLine].substring(0,indexOfColon)
        lineContent[1] = metadataLines[indexLine].substring(indexOfColon+1)
        //TODO CHECK LINE
        if(lineContent[0].toLowerCase() === 'host'){
            //console.log('---HOST')
            content+= 'baseUri: '+lineContent[1].trim()+'\n'
        }
        else if(lineContent[0].toLowerCase() === 'format'){
            //console.log('---FORMAT')
            if(lineContent[1].trim() !== '1A')
            //TODO THROW EXCEPTION
                console.log('error in format'.red)
        } else {
            //console.log('--OTHER')
            content+= metadataLines[indexLine]+'\n'
        }
    }
    //console.log('Content ',content)
    return content

}

function parseDocumentation(overview){
    //console.log('--',overview,'--')
    var documentation = 'documentation:\n'
    var sections = overview.split('\n## ')
    //console.log('length: ',sections.length)
    for(var indexOfSection in sections){
        var sectionTitle = sections[indexOfSection].split('\n')[0].trim()
        var sectionContent = sections[indexOfSection].substring(sections[indexOfSection].indexOf('\n')+1).trim()
        //console.log('ooo',sectionContent.trim(),'ooo')
        documentation += '  - title: '+sectionTitle+'\n'
        documentation += '    content: |'+'\n'
        documentation += indentText(sectionContent,'      ')
    }
    //console.log(documentation)
    return documentation
}

function parseApiNameAndOverwiew(blueprint){
    var indexOfTitle = blueprint.indexOf('\n# ')
    var indexOfEndTitle = blueprint.indexOf('\n# ',indexOfTitle+1)
    //TODO CHECK IF TITLE OR GROUP
    var overview = blueprint.substring(indexOfTitle,indexOfEndTitle).trim()
    var title = overview.substring(1,overview.indexOf('\n')).trim()
    //TODO CHECK IF HAVE OVERVIEW
    var documentation = parseDocumentation(overview.substring(overview.indexOf('\n')+1))
    return 'title: '+title + '\n\n' + documentation + '\n'
}

function parseResourceGroup(group){
    function parseResourceTitle(resourceGroupContent){
        //TODO better check??
        var lineTitle = resourceGroupContent.substring(resourceGroupContent.indexOf('# Group'),resourceGroupContent.indexOf('\n'))
        var contentTitle = lineTitle.split('# Group ')[1]
        //TODO parse group description
        return contentTitle
    }

    function parseResourceAction(resourceAction){
        function parseActionMethod(line){
            var method = line.substring(line.indexOf('[')+1,line.indexOf(']'))
            return method;
        }

        function parseActionName(line){
            var name = line.substring(3,line.indexOf('[')).trim()
            return name;
        }

        function parseActionDescription(content){
            var indexOfSharp = content.indexOf('#')
            var indexOfPlus = content.indexOf('+')
            //console.log('#: '+indexOfSharp,'\n+: '+indexOfPlus)
            //TODO check information
            //var indexSplit = (indexOfSharp<=indexOfPlus) ? indexOfSharp : indexOfPlus
            var indexSplit = indexOfPlus
            //console.log(content.substring(0,indexSplit))
            return content.substring(0,indexSplit)
        }

        function parseActionRequest(content){
            function parseHeaders(headers){
                var output = 'is:\n' +
                    '  headers:'+'\n'
                var headersLines = headers.split('\n')
                for(var indexOfHeaders in headersLines){
                    var headerLine = headersLines[indexOfHeaders]
                    var indexOfSemicolon = headerLine.indexOf(':')
                    var headerKey = headerLine.substring(0,indexOfSemicolon).trim()
                    var headerValue = headerLine.substring(indexOfSemicolon+1).trim()
                    //console.log(headerKey+' - '+headerValue)
                    output += '    '+headerKey+':'+headerValue+'\n'
                }
                //console.log(output)
                return output
            }
            function parseBody(body,contentType){
                console.log('-----------',body,'cc',contentType)
                var output = 'body:\n' +
                    '  '+contentType+':\n' +
                    '    example:\n'
                if(contentType.length > 0)
                    output += indentJson(body,'      ')
                else
                    output += indentText(body,'      ')
                console.log(output)
                return output
            }
            var indexSubstringRequestStart = content.indexOf('+ Request')
            var indexSubstringRequestEnd = content.indexOf('+ Response')
            //console.log('Request start: ',indexSubstringRequestStart)
            //console.log('Request end: ',indexSubstringRequestEnd)
            var requestContent = ''
            var requestOutput = ''
            if(indexSubstringRequestStart>-1)
                if(indexSubstringRequestEnd>-1)
                    requestContent = content.substring(indexSubstringRequestStart,indexSubstringRequestEnd)
                else
                    requestContent = content.substring(indexSubstringRequestStart)
            else
                console.log('no content')

            function getContentType(headers){
                var contentTypeString = 'Content-Type:'
                var contentType = ''
                var indexContentType = headers.indexOf(contentTypeString)
                if(indexContentType > -1){
                    var content = headers.substring(indexContentType+contentTypeString.length,headers.indexOf('\n',indexContentType))
                    console.log('¡¡¡¡¡¡¡¡¡¡¡¡¡¡',content)
                }
                return content
            }
            var contentType = ''

            if(requestContent.length>0){
                if(requestContent.indexOf('+ Headers')>-1){
                    var headerContent = ''
                    var indexOfHeadersStart = requestContent.indexOf('+ Headers') + '+ Headers'.length
                    if(indexOfHeadersStart > -1){
                        var indexofHeadersEnd = requestContent.indexOf('+ ',indexOfHeadersStart)
                        if(indexofHeadersEnd > -1){
                            headerContent = requestContent.substring(indexOfHeadersStart, indexofHeadersEnd)
                            contentType = getContentType(headerContent)
                        } else {
                            headerContent = requestContent.substring(indexOfHeadersStart)
                        }
                    }
                    //console.log('header content',headerContent.trim())
                    requestOutput += parseHeaders(headerContent.trim())
                }
                if(requestContent.indexOf('+ Body')>-1){
                    var bodyContent = ''
                    var indexOfBodyStart = requestContent.indexOf('+ Body')+'+ Body'.length
                    if(indexOfBodyStart>-1){
                        var indexOfBodyEnd = requestContent.indexOf('+ ',indexOfBodyStart)
                        if(indexOfBodyEnd>-1){
                            bodyContent = requestContent.substring(indexOfBodyStart,indexOfBodyEnd)
                        } else {
                            bodyContent = requestContent.substring(indexOfBodyStart)
                        }
                        requestOutput += parseBody(bodyContent,contentType)
                    }
                    //console.log('body content',bodyContent.trim())
                }
            }
            //console.log('REQUESSST\n',requestContent,'\n--------\n')
            console.log(requestOutput)
            return requestOutput
        }

        function parseActionResponse(content){
            var indexSubstringResponsesStart = content.indexOf('+ Response')
            //TODO check ith there is something
            var indexSubstringResponsesEnd = -1
            //console.log('Responses start: ',indexSubstringResponsesStart)
            //console.log('Responses end: ',indexSubstringResponsesEnd)
            var responseContent = ''
            if(indexSubstringResponsesStart>-1)
                if(indexSubstringResponsesEnd>-1)
                    responseContent = content.substring(indexSubstringResponsesStart,indexSubstringResponsesEnd)
                else
                    responseContent = content.substring(indexSubstringResponsesStart)
            else
                console.log('no content')
            //console.log('RESSPONSESS\n',responseContent,'\n--------\n')
            return responseContent
        }

        var titleResourceAction = resourceAction.substring(0,resourceAction.indexOf('\n'))
        var method = parseActionMethod(titleResourceAction)
        var displayName = parseActionName(titleResourceAction)

        var contentResourceAction = resourceAction.substring(resourceAction.indexOf('\n')).trim()
        var description = parseActionDescription(contentResourceAction).trim()
        //console.log(contentResourceAction)
        var request = undefined
        if(contentResourceAction.indexOf('+ Request')>-1)
            request = parseActionRequest(contentResourceAction)
        var response = undefined
        if(contentResourceAction.indexOf('+ Response')>-1)
            response = parseActionResponse(contentResourceAction)

        var myAction = {
            method: method,
            displayName: displayName,
            description: description,
            response: response,
            request: request
        }

        return myAction
    }

    function parseResourceContent(resourceContent){
        var path = resourceContent.substring(resourceContent.indexOf('[')+1,resourceContent.indexOf(']')).trim()
        var displayName = resourceContent.substring(0,resourceContent.indexOf('[')).trim()
        var description = resourceContent.substring(resourceContent.indexOf(']')+1,resourceContent.indexOf('\n### ')).trim()
        var actionsContent = resourceContent.substring(resourceContent.indexOf('\n### ')+1)
        //console.log('ACT-',actionsContent.substr(0,100).trim())
        var actions = actionsContent.split('\n### ')
        console.log('ACT leng: ',actions.length)
        var methods = []
        for(var indexOfAction in actions){
            methods.push(parseResourceAction(actions[indexOfAction]))
        }

        //console.log('RESOURCE displayName: ',displayName)
        //console.log('RESOURCE path: ',path)
        //console.log('RESOURCE description: ',description)

        return {
            displayName: displayName,
            path: path,
            description: description,
            methods:methods
        }
    }

    var parsedGroup = ''
    //TODO get partial url
    //console.log('-----\n'+group.substring(0,50)+'\n-----\n')
    if(group.indexOf('\n## ') === -1){
        console.log('No resources')

    } else if(group.split('\n## ').length>0) {
        console.log('more than 2 resources')
        var resourceName = ''
        var resources = group.split('\n## ')
        for(var indexOfResource in resources){
            var tempResource = resources[indexOfResource]
            if(tempResource.indexOf('# Group')>-1){
                resourceName = parseResourceTitle(tempResource)
                //console.log('TITLE RESOURCE: ',resourceName)
            }
            else{
                var parsedResource = parseResourceContent(tempResource)
                //console.log('RESOURCE PARSED: ',parsedResource)
                parsedGroup += parsedResource['path']+':\n'+
                        '  displayName: '+parsedResource['displayName']+':\n'
                if(parsedResource['description'].length >0)
                    parsedGroup +='  description: |\n'+
                        indentText(parsedResource['description'],'    ')
                for(var indexOfMethod in parsedResource['methods']){
                    var tempMethod = parsedResource['methods'][indexOfMethod]
                    var indent = '  '
                    parsedGroup += indent+tempMethod['method'].toLowerCase()+':\n'+indent +
                        '  displayName: '+ tempMethod['displayName']+'\n'
                    if(tempMethod['description'].length>0)
                        parsedGroup += indent +'  description: |\n'+
                            indentText(tempMethod['description'],'      ')
                }
            }
        }
    } else { //PARSING 1 RESOURCE
        console.log('1 resource')
        var resource = {
            uri: '',
            displayName: '',
            description: ''
        }
        var lines = group.split('\n')
        parseResourceTitle(group)
        //console.log(lines.length)
    }
    //console.log(parsedGroup)
    return parsedGroup
}
function parseResources(blueprint){
    var parsedResources = ''
    var indexOfGroup = blueprint.indexOf('\n# Group')
    if(indexOfGroup>-1){
        var groupsContent = blueprint.substring(indexOfGroup)
        var groups = groupsContent.split('\n# ')
        console.log(groups.length)
        for(var indexOfGroup in groups){
            if(groups[indexOfGroup].length >0){
                parsedResources += parseResourceGroup('# '+groups[indexOfGroup])
            } else {
                console.log('empty group')
            }
        }
    } else {
        //TODO IF NOT GROUPS
        console.log('error groups')
    }

    return parsedResources
}

function blueprintToRaml(blueprint, next){
    var ramlContent = '#%RAML 0.8\n'
    var lines = blueprint.trim().split("\n")
    ramlContent += parseMetadataSection(blueprint)
    ramlContent += parseApiNameAndOverwiew(blueprint)
    ramlContent += parseResources(blueprint)
    //console.log(ramlContent)

    next(ramlContent)
}

function parseExamples(example){
    var parsedItem = { }

    if(example['requests'].length>0 && example['requests'][0]['body']!==undefined && example['requests'][0]['body'].length>0 ){
        var type = '';
        for(var tempHeader in example['requests'][0]['headers'])
            if(example['requests'][0]['headers'][tempHeader]['name']==='Content-Type'
                && example['requests'][0]['headers'][tempHeader]['value'].indexOf('application/json')>-1)
                parsedItem['body'] = {
                    "application/json": {
                        "example":example['requests'][0]['body'],
                        "schema":example['requests'][0]['schema']
                    }
                }
    }

    if(example['responses'].length>0){
        parsedItem['responses'] = {}
        for(var indexResponseCode in example['responses']){
            var tempResponseCode = example['responses'][indexResponseCode]
            parsedItem['responses'][tempResponseCode['name']] = {
                body: {}
            }

            for(var index in tempResponseCode['headers']){
                //console.log(tempResponseCode['headers'][index])
                //console.log('++++9+++',tempResponseCode['headers'][index]['name'])
                //console.log('++++22+++',tempResponseCode['headers'][index]['name']==='Content-Type')
                if(tempResponseCode['headers'][index]['name']==='Content-Type'){
                    //console.log('true')
                    if(tempResponseCode['headers'][index]['value'].indexOf('application/json')>-1){
                        //console.log('json')
                        parsedItem['responses'][tempResponseCode['name']]['body'] = {
                            'application/json':{
                                example: tempResponseCode['body'],
                                schema: tempResponseCode['schema']
                            }
                        }
                        //console.log(parsedItem['responses'][tempName])
                    }
                    else if(tempResponseCode['headers'][index]['value'].indexOf('text/plain')>-1){
                        //console.log('text')
                        parsedItem['responses'][tempResponseCode['name']]['body'] = {
                            'application/json':{
                                example: tempResponseCode['body'],
                                schema: tempResponseCode['schema']
                            }
                        }
                        //console.log(parsedItem['responses'][tempName])
                    } else {
                        //console.log(tempResponseCode['headers'][index]['value'].indexOf('application/json'))
                    }
                }else{
                    //console.log('false')
                }
            }
        }
    }


    console.log('PARSERD\n',parsedItem,'\n------\n')
    return parsedItem
}
var TEMPLATE_API_MARKET = './templates/apiMarket2Html/template.nunjucks'

function blueprintToJSONAM(blueprint){
    var jsonAM = {}

    for(var index in blueprint.metadata){
        if(blueprint.metadata[index]==='HOST')
            jsonAM['baseUri'] = blueprint.metadata[index];
    }
    if(blueprint.description!==undefined){
        var documentation = [];
        var documentationArray = blueprint.description.split("\n## ")
        for(var itemDoc in documentationArray){
            var newItem= {}
            newItem['title'] = documentationArray[itemDoc].substring(0,documentationArray[itemDoc].indexOf("\n"))
            newItem['content'] = documentationArray[itemDoc].substring(documentationArray[itemDoc].indexOf("\n")+1).trim()
            //console.log(newItem.content)
            //console.log('------')
            documentation.push(newItem)
        }
        jsonAM['documentation'] = documentation;
    } else {
        jsonAM['documentation'] = [];
    }
    jsonAM['title'] = blueprint.name;
    jsonAM['version'] = '';
    jsonAM['protocols'] = ['HTTP','HTTPS'];
    if(jsonAM['baseUri']=== undefined)
        jsonAM['baseUri'] = 'https://apis.bbva.com'
    //jsonAM['traits'] = [];
    jsonAM['resources']=[]
    for(var index in blueprint['resourceGroups']){
        var resourceGroup = blueprint['resourceGroups'][index]
        var resource = {
            displayName: resourceGroup['name'],
            description: resourceGroup['description'],
            //relativeUri: '/',
            relativeUri: ''
        }
        if(resourceGroup['resources']!==undefined){
            var myResources = []
            console.log('RESOURCES LENGTH: ',resourceGroup['resources'].length )
            for(var indexResource in resourceGroup['resources']){
                var resourceData = resourceGroup['resources'][indexResource]
                if(resourceData['element']==='resource'){
                    var myResource = {
                        displayName: resourceData['name'],
                        description: resourceData['description'],
                        relativeUri:resourceData['uriTemplate']
                    }
                    if(resourceData['parameters']!== undefined && resourceData['parameters'].length>0){
                        var myParameter = {}
                        for(var indexParameter in resourceData['element']['parameters']){
                            var tempParameter = resourceData['element']['parameters'][indexParameter]
                            myParameter[tempParameter['name']] = {
                                description: tempParameter['description'],
                                default:tempParameter['default'],
                                example: tempParameter['example'],
                                displayName:tempParameter['name'],
                                required:tempParameter['default'],
                                type: tempParameter['type'],
                                enum: tempParameter['enum']
                            }
                        }
                        myResource['uriParametes'] = myParameter
                    }
                    if(resourceData['actions']!== undefined && resourceData['actions'].length>0){
                        var myMethods = []
                        for(var indexActions in resourceData['actions']){
                            var tempAction = resourceData['actions'][indexActions]
                            var myAction = {
                                responses: {},
                                displayName: tempAction['name'],
                                description: tempAction['description'],
                                method: tempAction['method']

                            }
                            console.log('000000000-',tempAction['examples'].length,'\n***\n',tempAction['examples'])
                            var myAction = parseExamples(tempAction['examples'][0])
                            myAction['displayName']=tempAction['name']
                            myAction['description']=tempAction['description']
                            myAction['method']=tempAction['method']

                            myMethods.push(myAction)
                        }
                        myResource['methods'] = myMethods
                        console.log('METHODS ',myResource['methods'])
                    }
                    console.log('myParameters', myResource['uriParametes'])
                    myResources.push(myResource)
                } else {
                    console.log('********',resource.rainbow)
                }
                console.log('myResource',myResources)
            }
            resource['resources'] = myResources
        } else {
            console.log('NO RESOURCES')
        }
        console.log('resource',resource,'////////')
        jsonAM['resources'].push(resource)
    }

    toFile('./RAML/tempBlueprint.json',JSON.stringify(jsonAM,null,2))


    return jsonAM;

}

router.get('/raml', function (request, response, next) {
    var file = './RAML/api_ac.apib';
    if (fs.existsSync(file)) {
        fs.readFile(file,'utf8', function(err, data) {
            if (err) {
                console.log(err)
                response.end(JSON.stringify(err, null, 3));
            }
            console.log('Lets transform from BLUEPRINT TO RAML')
            blueprintToRaml(data, function(parsedRaml){
                response.end(parsedRaml);
            });
        })
    }
});

router.get('/aglio/*', function (request, response, next) {
    var file = './RAML/api_ac.apib'

    if (fs.existsSync(file)) {
        fs.readFile(file,'utf8', function(err, data){
            if (err){
                console.log(err)
                response.end(JSON.stringify(err, null, 3));
            }
            console.log(data);
            console.log('lets parse')
            var options = {
                themeVariables: 'default',
                themeTemplate: './templates/aglio/docFactory.jade'
            };

            aglio.render(data, options, function (err, html, warnings) {
                if (err)
                    return console.log(err);
                if (warnings)
                    console.log(warnings);

                console.log(html);
                response.end(html);
            });
        });

    } else {
        response.write('file not found '+file);
        response.end();
    }

});

router.get('/*', function (request, response, next) {
    var file = './RAML/'+request.params[0]

    if (fs.existsSync(file)) {
        fs.readFile(file,'utf8', function(err, data){
            if (err){
                console.log(err)
                response.end(JSON.stringify(err, null, 3));
            }
            //console.log(data);
            //response.write(data);
            console.log('lets parse')
            var options = {
                generateSourceMap: true,
                type: 'ast'
            }

            protagonist.parse(data,options, function (error, result) {
                if (!error) {
                    console.log('done!!!'.red)
                    blueprintToJSONAM(result.ast)
                    //console.log('done!!!'.red, JSON.stringify(result, null, 3).cyan);
                    toFile('./output/blueprint-'+request.params[0]+'.json',JSON.stringify(result, null, 3))
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