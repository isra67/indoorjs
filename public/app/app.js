
var app = angular.module('myApp', ['ngRoute']);

var VERSION_STR = 'WebIndoor 1.0';

app.factory("services", ['$http', function($http) {
    var serviceBase = '/app/'
      , obj = {}
      , headercfg = {}; //{ headers : { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;' }};

    obj.getAppStatus = function() {
        return $http.get(serviceBase + 'status');
    }

    obj.getIniItems = function() {
        return $http.get(serviceBase + 'all');
    }

    obj.applyCfgChanges = function() {
        return $http.post(serviceBase + 'apply');
    }

    obj.updateIniItem = function(sect,item,vals) {
	console.log('updateIniItem:',sect,item,vals);
        return $http.post(serviceBase + 'update', {sect: sect, item: item, vals: vals}, headercfg)
		.then(function(status) {
            return status.data;
        });
    };

/*
    obj.getCustomer = function(customerID){
        return $http.get(serviceBase + 'customer?id=' + customerID);
    }

    obj.insertCustomer = function (customer) {
    return $http.post(serviceBase + 'insertCustomer', customer).then(function (results) {
        return results;
    });
	};

	obj.deleteCustomer = function (id) {
	    return $http.delete(serviceBase + 'deleteCustomer?id=' + id).then(function (status) {
	        return status.data;
	    });
	};
//*/
    return obj;
}]);

app.controller('configCtrl', function ($scope, services) {
    $scope.customers = {};
    $scope.keys = [];
    $scope.updateCfg = 0;

    services.getIniItems().then(function(data){
        $scope.customers = data.data;
	$scope.keys = Object.keys(data.data);
    });

    $scope.changeItem = function(sect,item,vals) {
	console.log('changeItem:',sect,item,vals);
	$scope.updateCfg = 1;
	services.updateIniItem(sect,item,vals).then(function(data){
	    console.log('changeItem:',data);
	});
    };

    $scope.applyCfgChanges = function() {
	console.log('applyCfgChanges:');
	$scope.updateCfg = 0;
	services.applyCfgChanges().then(function(data){
	    console.log('applyCfgChanges:',data);
	});
    };
});

app.controller('logCtrl', function ($scope, services) {
    $scope.logs = [];
});

app.controller('serviceCtrl', function ($scope, services) {
    $scope.restartApp = function() {
	console.log('restartApp:');
	services.applyCfgChanges().then(function(data){
	    console.log('restartApp:',data);
	});
    };
});

app.controller('mainCtrl', function ($scope, services) {
    $scope.msgs = VERSION_STR;
    $scope.connection = '?';
    var timerFlag = 0;

    $scope.getStatusApp = function() {
	console.log('getStatusApp:');
	services.getAppStatus().then(function(data){
	    var d = data.data;
	    console.log('getAppStatus:',d);
	    $scope.connection = d.connection;
	});
    };

    if (timerFlag == 0) {
	$scope.getStatusApp();
	timerFlag = setInterval($scope.getStatusApp, 5000);
    }
    console.log('mainCtrl:');
});

app.controller('basicCtrl', function ($scope, services) {
    $scope.msgs = VERSION_STR;
});

/*
app.controller('editCtrl', function ($scope, $rootScope, $location, $routeParams, services, customer) {
    var customerID = ($routeParams.customerID) ? parseInt($routeParams.customerID) : 0;
    $rootScope.title = (customerID > 0) ? 'Edit Customer' : 'Add Customer';
    $scope.buttonText = (customerID > 0) ? 'Update Customer' : 'Add New Customer';
      var original = customer.data;
      original._id = customerID;
      $scope.customer = angular.copy(original);
      $scope.customer._id = customerID;

      $scope.isClean = function() {
        return angular.equals(original, $scope.customer);
      }

      $scope.deleteCustomer = function(customer) {
        $location.path('/');
        if(confirm("Are you sure to delete customer number: "+$scope.customer._id)==true)
        services.deleteCustomer(customer.customerNumber);
      };

      $scope.saveCustomer = function(customer) {
        $location.path('/');
        if (customerID <= 0) {
            services.insertCustomer(customer);
        }
        else {
            services.updateCustomer(customerID, customer);
        }
    };
});//*/

app.config(function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        title: 'Status',
        templateUrl: 'views/about.html',
        controller: 'mainCtrl'/*,
        resolve: {
          connection: '1' /* function(services, $route){
            var customerID = $route.current.params.customerID;
            return services.getCustomer(customerID);
          }//* /
        }//*/
      })
      .when('/config', {
        title: 'Config',
        templateUrl: 'views/config.html',
        controller: 'configCtrl'
      })
      .when('/log', {
        title: 'Logging',
        templateUrl: 'views/logging.html',
        controller: 'logCtrl'
      })
      .when('/services', {
        title: 'Services',
        templateUrl: 'views/services.html',
        controller: 'serviceCtrl'
      })
/*      .when('/customers', {
        title: 'Customers',
        templateUrl: 'partials/customers.html',
        controller: 'listCtrl'
      })
      .when('/edit-customer/:customerID', {
        title: 'Edit Customers',
        templateUrl: 'partials/edit-customer.html',
        controller: 'editCtrl',
        resolve: {
          customer: function(services, $route){
            var customerID = $route.current.params.customerID;
            return services.getCustomer(customerID);
          }
        }
      })//*/
      .otherwise({
        redirectTo: '/'
      });//*/

    $locationProvider.html5Mode(true);
});

app.run(['$location', '$rootScope', function($location, $rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
}]);