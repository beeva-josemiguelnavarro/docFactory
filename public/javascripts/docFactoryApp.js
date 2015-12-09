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
                $scope.$apply()
            },function(error){
                console.log('error',error)
            });
        }

        $scope.sendFormLocal = function(){
            var url = '/RAML/file/'+$scope.myData.pathFile+'?apiName='+$scope.myData.apiName+'&overviewLink='+$scope.myData.overviewLink+'&termsLink='+$scope.myData.termsLink
            $http.get(url).then(function(data){

            },function(error){

            });
        }

        $scope.sendFormOnline = function(){
            var url = '/RAML/online?uri='+$scope.myData.pathFile+'&apiName='+$scope.myData.apiName+'&overviewLink='+$scope.myData.overviewLink+'&termsLink='+$scope.myData.termsLink
            $http.get(url).then(function(data){

            },function(error){

            });
        }

        $scope.$watch('option',function(newValue, oldValue){
            if(newValue == $scope.options[3]){
                $scope.loadDocumentations();
            }
        })

    })
