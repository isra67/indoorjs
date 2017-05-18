
var VERSION_STR = 'WebIndoor 1.0';

var app = angular.module('myApp', ['ngRoute']);


//**  */
app.factory("services", ['$http', function($http) {
    var serviceBase = '/app/'
      , obj = {}
      , headercfg = {}; //{ headers : { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;' }};

    //**  */
    obj.getAppStatus = function() {
        return $http.get(serviceBase + 'status');
    }

    //**  */
    obj.getIniItems = function() {
        return $http.get(serviceBase + 'all');
    }

    //**  */
    obj.getFileContent = function(name, dir='tmp') {
        return $http.get(serviceBase + 'getfile/' + dir + '/' + name);
    }

    //**  */
    obj.applyCfgChanges = function() {
        return $http.post(serviceBase + 'apply');
    }

    //**  */
    obj.updateIniItem = function(sect,item,vals) {
//	console.log('updateIniItem:',sect,item,vals);
        return $http.post(serviceBase + 'update', {sect: sect, item: item, vals: vals}, headercfg)
		.then(function(status) {
            return status.data;
        });
    };

    return obj;
}]);


//**  */
app.controller('configCtrl', function ($scope, services) {
    $scope.customers = {};
    $scope.configbackup = {};
    $scope.keys = [];
    $scope.updateCfg = 0;
    $scope.defcfgkeys = Object.keys(defcfg);

    //**  */
    $scope.cfgItemType = function(key) {
//	console.log('cfgItemType:',key);
	var i = $scope.defcfgkeys.indexOf(key);
	if (i < 0) return [];
	if (defcfg[key]['type'] !== 'sel') return [];
//	console.log('cfgItemType:',key,i,defcfg[key]['options']);
	return defcfg[key]['options'].split(',');
    };

    //**  */
    $scope.changeItem = function(sect,item,vals) {
//	console.log('changeItem:',sect,item,vals);
	$scope.updateCfg = 1;
	$scope.customers[sect][item] = vals;
//	services.updateIniItem(sect,item,vals).then(function(data){
////	    console.log('changeItem:',data);
//	});
    };

    //**  */
    $scope.saveConfigItems = function() {
	console.log('saveConfigItems 1:');
	$scope.updateCfg = 2;
	for (var sect in $scope.customers) {
	    if ($scope.customers.hasOwnProperty(sect)) {
		for (var item in $scope.customers[sect]) {
		    if ($scope.customers[sect].hasOwnProperty(item)) {
			if ($scope.customers[sect][item] != $scope.configbackup[sect][item]) {
			    // do stuff
			    services.updateIniItem(sect,item,$scope.customers[sect][item]).then(function(data){
//				console.log('changeItem:',data);
			    });
			}
		    }
		}
	    }
	}
    };

    //**  */
    services.getIniItems().then(function(data) {
	var cfg = data.data, sortcfg = {};

	// sorting keys in INI:
	for (var sect in cfg) {
	    if (cfg.hasOwnProperty(sect)) {
		sortcfg[sect] = {};
		var items = Object.keys(cfg[sect]);
		if (sect === 'common') items = items.sort();
		for (var item in items) {
		    if (cfg[sect].hasOwnProperty(items[item])) {
			sortcfg[sect][items[item]] = cfg[sect][items[item]];
//			console.log('cyc init:',sect, items[item]);
		    }
		}
	    }
	}

        $scope.customers = sortcfg;
	$scope.configbackup = JSON.parse(JSON.stringify(cfg));
	$scope.keys = Object.keys(cfg);
    });
});


//**  */
app.controller('logCtrl', function ($scope, services) {
    $scope.logs = [];
});


//**  */
app.controller('serviceCtrl', function ($scope, services) {
    $scope.msg = '';
    $scope.logs = [];
    $scope.cntrs = {};
    $scope.keys = [];

    //**  */
/*    $scope.langtxt = function(key) {
	return langstr[key] || key;
    };

    //**  */
    $scope.reinitScopes = function() {
	$scope.msg = '';
	$scope.logs = [];
	$scope.cntrs = {};
	$scope.keys = [];
    };

    //**  */
    $scope.restartApp = function() {
//	console.log('restartApp:');
	$scope.reinitScopes();
	services.applyCfgChanges().then(function(data){
//	    console.log('restartApp:',data);
	    $scope.msg = data.data;
	});
    };

    //**  */
    $scope.getCallCntrs = function() {
//	console.log('getCallCntrs:');
	$scope.reinitScopes();
	services.getFileContent('call-cntr.dat').then(function(data){
//	    console.log('getCallCntrs:',data.data);
	    $scope.cntrs = data.data;
	    $scope.keys = Object.keys(data.data);
	});
    };

    //**  */
    $scope.getCallLog = function() {
//	console.log('getCallLog:');
	$scope.reinitScopes();
	services.getFileContent('call-log.dat').then(function(data){
//	    console.log('getCallLog:',data.data);
	    $scope.logs = data.data;
	});
    };

    //**  */
    $scope.getAppLog = function() {
//	console.log('getAppLog:');
	$scope.reinitScopes();
	services.getFileContent('app-log.dat').then(function(data){
//	    console.log('getAppLog:',data.data);
	    $scope.logs = data.data;
	});
    };

    //**  */
    $scope.getSipLog = function() {
//	console.log('getSipLog:');
	$scope.reinitScopes();
	services.getFileContent('sip-log.dat').then(function(data){
//	    console.log('getSipLog:',data.data);
	    $scope.logs = data.data;
	});
    };
});


//**  */
app.controller('mainCtrl', function ($scope, services) {
//    $scope.msgs = VERSION_STR;
    $scope.connection = '?';
    var timerFlag = 0;

    //**  */
    $scope.getStatusApp = function() {
//	console.log('getStatusApp:');
	services.getAppStatus().then(function(data){
	    var d = data.data;
//	    console.log('getAppStatus:',d);
	    $scope.connection = d.connection;
	});
    };

    //**  */
    if (timerFlag == 0) {
	$scope.getStatusApp();
	timerFlag = setInterval($scope.getStatusApp, 5000);
    }
//    console.log('mainCtrl:');
});


//**  */
app.controller('basicCtrl', function ($scope, $location, $compile, services) {
    $scope.msgs = VERSION_STR;

    //**  */
    $scope.langtxt = function(key) {
	return langstr[key] || key;
    };

    //**  */
    $scope.modalChange = function(el,cb) {
	// remove and reinsert the element to force angular
	// to forget about the current element
	console.log('modalChange:', $scope.updateCfg, el, cb);
	$(el).replaceWith($(el));

	// change ng-click
	$(el).attr('ng-click',cb);
	$(el).prop('ng-click',cb);

	// compile the element
	$compile($(el))($scope);

//	console.log('modalChange:', $scope.updateCfg, el, cb);
    };

    //**  */
    $scope.applyCfgChanges = function() {
//	console.log('applyCfgChanges:');
//	$scope.updateCfg = 0;
	services.applyCfgChanges().then(function(data){
//	    console.log('applyCfgChanges:',data);
	    $location.path('/');
	});
    };
});


//**  */
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


//**  */
app.run(['$location', '$rootScope', function($location, $rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
}]);
