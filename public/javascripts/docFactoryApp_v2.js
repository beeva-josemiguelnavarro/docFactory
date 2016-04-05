'use strict';

angular.module('docFactoryApp',[])
    .controller('docFactoryController',['$scope','$http','$window',function($scope, $http, $window){
        $scope.ready = true

        $scope.myDataOnline = {
            pathFile: '',
            apiName:'',
            overviewLink:'',
            termsLink:'',
            quickstart:'paystats',
            baseuri:'',
            environment:''
        }

        $scope.ramlFiles = []

        $scope.parsingOnline = false;
        $scope.parsingOnlineError = false
        $scope.parsedDocumentationOnline = ''
        $scope.parsedDocumentationError = ''

        $scope.loadRamlsFromGit = function(){
            console.log('getting docs')
            $scope.ready = false
            $http.get('/gitramls').then(function(body){
                console.log(body)
                $scope.ramlFiles = body.data
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

        $scope.seeWithRaml2Html = function(){
            var url = '/raml2html/?url='+$scope.myDataOnline.pathFile;
            console.log(url)
            $window.open(url, '_blank');
        }

        $scope.sendFormOnline = function(){
            var url = '/RAML/gitlab?uri='+$scope.myDataOnline.pathFile + '&'+generatePath($scope.myDataOnline)
            $scope.parsedDocumentationOnline = ''
            $scope.parsedDocumentationError = ''
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
                $scope.parsedDocumentationError = error.data
            });
        }


        /*
        INIT
         */
        $scope.loadRamlsFromGit()

    }])
