'use strict';

angular.module('docFactoryApp',[])
    .controller('docFactoryController',function($scope, $http){
        $scope.options = ['upload','local','online','documentations']
        $scope.option = $scope.options[0];
        $scope.files = []
        $scope.ready = true
        $scope.myData = {
            pathFile: '',
            apiName:'',
            overviewLink:'',
            termsLink:''
        }
        $scope.documentation = '';
        $scope.documentationSelected = ''
        $scope.ramls = []
        $scope.ramlDocumentation = '';

        $scope.parsing = false;
        $scope.parsingError = false
        $scope.parsedDocumentation = ''

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

        $scope.getDocumentation = function (index) {
            console.log(index)
            $http.get(index).then(function(body){
                console.log(body)
                $scope.documentation = body.data
                $scope.documentationSelected = index
                $scope.$apply()
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

        $scope.sendFormLocal = function(){
            var url = '/RAML/file/'+$scope.myData.pathFile+'?apiName='+$scope.myData.apiName+'&overviewLink='+$scope.myData.overviewLink+'&termsLink='+$scope.myData.termsLink

            $scope.parsing = true
            $scope.parsingError = false
            $http.get(url).then(function(body){
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
            var url = '/RAML/online?uri='+$scope.myData.pathFile+'&apiName='+$scope.myData.apiName+'&overviewLink='+$scope.myData.overviewLink+'&termsLink='+$scope.myData.termsLink

            $scope.parsing = true
            $scope.parsingError = false
            $http.get(url).then(function(body){
                $scope.parsedDocumentation = body.data
                $scope.parsing = false
                console.log(body)
            },function(error){
                console.log(error)
                $scope.parsing = false
                $scope.parsingError = true
            });
        }

        $scope.$watch('option',function(newValue, oldValue){
            if(newValue == $scope.options[3]){
                $scope.loadDocumentations();
            } else if(newValue == $scope.options[1]){
                $scope.loadRamls();
            }
        })

    })
