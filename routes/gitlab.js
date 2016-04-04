var async = require('async');
var gitlab = require('gitlab')({
    url:   'https://gitlab.digitalservices.es',
    token: 'iZ8f2RZkT5zLhEFaE1BA'
});

var projectId = 333;
var branchName = 'develop';
var pathDefault = '';

//gitlab.projects.show(projectId, function(project){
//    console.log(project)
//    console.log('---------');
//})
//gitlab.projects.repository.showBranch(projectId, branch, function(branch){
//    console.log(branch)
//    console.log('*******');
//})


function getTree(projectId, branch, path){
    var ramls = [];
    gitlab.projects.repository.listTree(projectId, { 'ref_name': branch , 'path': path}, function(tree){
        //console.log(tree)
        //console.log(tree.length)
        for( var index in tree){
            //console.log(tree[index]['name'] + '-----' +tree[index]['type'])
            //console.log(tree[index])
            var pathTree = tree[index]['name']
            if( path.length > 0)
                pathTree = path + '/' +tree[index]['name']
            if(tree[index]['type'] == 'tree'){
                getTree(projectId, branch, pathTree)
            } else if ( tree[index]['type'] == 'blob' && tree[index]['name'].indexOf('.raml')>-1 ){
                console.log(pathTree)
                ramls.push(pathTree)
            }
        }
    })
}

function getTreeRecursive(projectId, branch, path, done){
    var ramlsPaths = [];
    gitlab.projects.repository.listTree(projectId, { 'ref_name': branch , 'path': path},
        function(tree){
            if(path.length > 0){
                var index = 0
                var hasBlob = false
                while (!hasBlob && index < tree.length){
                    if(tree[index]['type'] == 'blob' && tree[index]['name'].indexOf('.raml')>-1 )
                        hasBlob = true
                    else
                        index++
                }
                if(hasBlob){
                    ramlsPaths.push(path + '/' +tree[index]['name'])
                    done(undefined, ramlsPaths);
                }else{
                    async.forEach(tree, function(subtree, callback){
                        var pathTree = subtree['name']
                        if( path.length > 0)
                            pathTree = path + '/' +subtree['name']
                        if(subtree['type'] == 'tree'){
                            getTreeRecursive(projectId, branch, pathTree, function (err, ramls) {
                                for(var index in ramls){
                                    ramlsPaths.push(ramls[index])
                                }
                                callback()
                            })
                        } else if ( subtree['type'] == 'blob' && subtree['name'].indexOf('.raml')>-1 ){
                            ramlsPaths.push(pathTree)
                            callback()
                        } else {
                            callback()
                        }
                    }, function(){
                        done(undefined, ramlsPaths);
                    })
                }

            } else
                async.forEach(tree, function(subtree, callback){
                    var pathTree = subtree['name']
                    if( path.length > 0)
                        pathTree = path + '/' +subtree['name']
                    if(subtree['type'] == 'tree'){
                        getTreeRecursive(projectId, branch, pathTree, function (err, ramls) {
                            for(var index in ramls){
                                ramlsPaths.push(ramls[index])
                            }
                            callback()
                        })
                    } else if ( subtree['type'] == 'blob' && subtree['name'].indexOf('.raml')>-1 ){
                        ramlsPaths.push(pathTree)
                        callback()
                    } else {
                        callback()
                    }
                }, function(){
                    done(undefined, ramlsPaths);
                })
        })

}

//getTreeRecursive(projectId, branchName, pathDefault, function (err, ramls) {
//    if(err)
//        console.log(err)
//    console.log('-----------')
//    console.log(ramls)
//
//})
//getTree(projectId, branchName, pathDefault)
//
//gitlab.projects.repository.showFile({
//    projectId: projectId,
//    ref:branch,
//    file_path: 'api_datos/paystats/pro_sbx/dataapi/comercializacion.raml'
//}, function(file) {
//    console.log;
//    console.log("=== File ===");
//    console.log(file);
//    if (file) {
//        console.log;
//        console.log("=== Content ===");
//        return console.log((new Buffer(file.content, 'base64')).toString());
//    }
//});

module.exports = getTreeRecursive