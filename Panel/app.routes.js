
'use strict';

angular
    .module('gwtcbuilder.routes', ['ngRoute'])
    .config(config);


function config($routeProvider){
	$routeProvider
		.when("/main", {
			templateUrl: "sections/mainTpl.html",
			controller: "MainController"
		})
		
		.otherwise({redirectTo:"/main"});
};
    
