'use strict';

angular.module('docFactoryApp',['angularFileUpload'])
    .controller('docFactoryController',['$scope','$http' ,'FileUploader',function($scope, $http,FileUploader){
        $scope.options = ['upload','local','online','documentations']
        $scope.option = $scope.options[1];
        $scope.files = []
        $scope.ready = true
        $scope.myData = {
            pathFile: '',
            apiName:'',
            overviewLink:'',
            termsLink:'',
            quickstart:'general',
            baseuri:'',
            environment:''
        }
        $scope.myDataOnline = {
            pathFile: '',
            apiName:'',
            overviewLink:'',
            termsLink:'',
            quickstart:'paystats',
            baseuri:'',
            environment:''
        }
        $scope.documentation = '';
        $scope.documentationSelected = ''
        $scope.documentationActive = ''
        $scope.ramls = []
        $scope.ramlDocumentation = '';

        $scope.parsing = false;
        $scope.parsingError = false
        $scope.parsedDocumentation = ''

        $scope.parsingOnline = false;
        $scope.parsingOnlineError = false
        $scope.parsedDocumentationOnline = ''

        $scope.itemsUploaded = []


        var uploader = $scope.uploader = new FileUploader({
            url: '/upload'
        });

        // FILTERS

        //uploader.filters.push({
        //    name: 'customFilter',
        //    fn: function(item /*{File|FileLikeObject}*/, options) {
        //        return this.queue.length < 10;
        //    }
        //});

        // CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            console.info('onCompleteItem', fileItem, response, status, headers);
            $scope.itemsUploaded.push(fileItem.file.name)
            $scope.$apply()

        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
        };

        $scope.printNames= function(names){
            console.log(names)
        }

        $scope.loadDocumentations = function(){
            console.log('getting docs')
            $scope.ready = false
            $http.get('/documentations').then(function(body){
                console.log(body)
                $scope.files = body.data
                $scope.ready = true
            },function(error){
                console.log('error',error)
                $scope.ready = true
            });
        }

        $scope.getDocumentation = function (item) {
            console.log(item)
            var url = item.url
            $http.get(url).then(function(body){
                console.log(body)
                $scope.documentation = body.data
                $scope.documentationSelected = url
                $scope.documentationActive = item.name
                //$scope.$apply()
            },function(error){
                console.log('error',error)
            });
        }

        $scope.loadRamls = function () {
            $scope.ready = false
            $http.get('/ramls').then(function(body){
                console.log(body)
                $scope.ramls = body.data
                $scope.ready = true
            },function(error){
                console.log('error',error)
                $scope.ready = true
            });
        }


        function generatePath(values){
            var queryPath = '';
            if(values.apiName!==undefined){
                console.log('apiName:',values.apiName)
                queryPath += '&apiName='+values.apiName;
            }
            if(values.overviewLink!==undefined){
                console.log('overviewLink:',values.overviewLink)
                queryPath += '&overviewLink='+values.overviewLink;
            }
            if(values.termsLink!==undefined){
                console.log('termsLink:',values.apiName)
                queryPath += '&termsLink='+values.termsLink;
            }
            if(values.quickstart!==undefined){
                console.log('quickstart:',values.quickstart)
                queryPath += '&quickstart='+values.quickstart;
            }
            if(values.baseuri!==undefined && values.baseuri.length>0){
                console.log('baseuri:',values.baseuri)
                queryPath += '&baseuri='+values.baseuri;
            }
            if(values.environment!==undefined && values.environment.length>0){
                console.log('baseuriEnv:',values.environment)
                queryPath += '&baseuriEnv='+values.environment;
            }
            return queryPath.substring(1);
        }

        $scope.sendFormLocal = function(){
            var routeUrl = '/RAML/file'
            if($scope.myData.pathFile.indexOf('.json')>-1)
                routeUrl = '/RAML/json'
            var url = routeUrl + '?filePath='+$scope.myData.pathFile+ '&' +generatePath($scope.myData)
            console.log(url)
            $scope.parsing = true
            $scope.parsingError = false
            $http.get(url).then(function(body){
                console.log(body)
                $scope.parsedDocumentation = body.data
                $scope.parsing = false
                console.log(body)
            },function(error){
                console.log(error)
                $scope.parsing = false
                $scope.parsingError = true
            });
        }

        $scope.sendFormOnline = function(){
            var url = '/RAML/online?uri='+$scope.myDataOnline.pathFile + '&'+generatePath($scope.myDataOnline)
            $scope.parsingOnline = true
            $scope.parsingError = false
            $http.get(url).then(function(body){
                $scope.parsedDocumentationOnline = body.data
                $scope.parsingOnline = false
                console.log(body)
            },function(error){
                console.log(error)
                $scope.parsingOnline = false
                $scope.parsingOnlineError = true
            });
        }

        $scope.$watch('option',function(newValue, oldValue){
            if(newValue == $scope.options[3]){
                $scope.loadDocumentations();
            } else if(newValue == $scope.options[1]){
                $scope.loadRamls();
            }
        })
    }])
