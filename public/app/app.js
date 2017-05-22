
var VERSION_STR = 'WebIndoor 1.0';

var app = angular.module('myApp', ['ngRoute', 'ngFileUpload']);


//** ******************************************************************************* */
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
    obj.getToneList = function() {
        return $http.get(serviceBase + 'gettones');
    }

    //**  */
    obj.removeTone = function(name) {
        return $http.get(serviceBase + 'deltone/' + name);
    }

    //**  */
    obj.applyCfgChanges = function() {
        return $http.post(serviceBase + 'apply');
    }

    //**  */
    obj.updateIniItem = function(sect,item,vals) {
        return $http.post(serviceBase + 'update', {sect: sect, item: item, vals: vals}, headercfg)
		.then(function(status) {
            return status.data;
        });
    };

    return obj;
}]);


//** ******************************************************************************* */
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
			    services.updateIniItem(sect,item,$scope.customers[sect][item])
			    .then(function(data) {
//				console.log('changeItem:',data);
			    }, function(err) {
				console.log('changeItem:',err);
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

	var t = defcfg['ringtone']['options'];
	if (t.split(',').length > 3) return;

	// read customers' tones
	services.getToneList().then(function(data){
	    var a = data.data;
	    for (var tone in a) {
		if (a.hasOwnProperty(tone)) {
//		    console.log('getToneList:',data.data);
		    defcfg['ringtone']['options'] += ',' + a[tone].name;
		}
	    }
//	    console.log('getIniItems:',data.data, defcfg['ringtone']['options']);
	}, function(err) {
	    console.log('getIniItems:',err);
	});
    });
});


//** ******************************************************************************* */
app.controller('uploadCtrl', ['$scope', 'Upload', '$timeout', '$location', 'services',
    function ($scope, Upload, $timeout, $location, services) {

    $scope.tones = [];
    $scope.toRemove = -1;

    //**  */
    $scope.getToneList = function() {
	$scope.tones = [];
	$scope.toRemove = -1;
	services.getToneList().then(function(data){
//	    console.log('getToneList:',data.data);
	    $scope.tones = data.data;
	}, function(err) {
	    console.log('getToneList:',err);
	});
    };

    //**  */
    $scope.removeTone = function(id) {
	$scope.toRemove = id;
    };

    //**  */
    $scope.removeToneId = function() {
	if ($scope.toRemove == -1) return;
//	console.log('removeTone:', id, $scope.tones[$scope.toRemove].name);
	services.removeTone($scope.tones[$scope.toRemove].name).then(function(data){
//	    console.log('removeTone:',data.data);
//	    $scope.tones.splice($scope.toRemove, 1);
	    $scope.getToneList();
	}, function(err) {
	    console.log('removeToneId:',err);
	    $location.path('/');
	});
    };

    //**  */
    $scope.uploadPic = function(file) {
	file.upload = Upload.upload({
	    url: '/upload',
	    method: 'POST',
	    data: { file: file },
	});

	file.upload.then(function (response) {
	    $timeout(function () { 
		file.result = response.data;
		$scope.getToneList();
		$scope.picFile = '';
	    });
        }, function (response) {
	    if (response.status > 0)
    		$scope.errorMsg = response.status + ': ' + response.data;
	}, function (evt) {
    	    // Math.min is to fix IE which reports 200% sometimes
    	    file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
	});
    };

    $scope.getToneList();
}]);


//** ******************************************************************************* */
app.controller('logCtrl', function ($scope, services) {
    $scope.logs = [];
});


//** ******************************************************************************* */
app.controller('serviceCtrl', function ($scope, $location, services) {
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
	$scope.reinitScopes();
	services.applyCfgChanges().then(function(data){
	    $scope.msg = data.data;
	}, function(err) {
	    console.log('restartApp:',err);
	    $location.path('/');
	});
    };

    //**  */
    $scope.getCallCntrs = function() {
	$scope.reinitScopes();
	services.getFileContent('call-cntr.dat').then(function(data){
//	    console.log('getCallCntrs:',data.data);
	    $scope.cntrs = data.data;
	    $scope.keys = Object.keys(data.data);
	});
    };

    //**  */
    $scope.getCallLog = function() {
	$scope.reinitScopes();
	services.getFileContent('call-log.dat').then(function(data){
//	    console.log('getCallLog:',data.data);
	    $scope.logs = data.data;
	    $scope.logs.push('');
	});
    };

    //**  */
    $scope.getAppLog = function() {
	$scope.reinitScopes();
	services.getFileContent('app-log.dat').then(function(data){
//	    console.log('getAppLog:',data.data);
	    $scope.logs = data.data;
	    $scope.logs.push('');
	});
    };

    //**  */
    $scope.getSipLog = function() {
	$scope.reinitScopes();
	services.getFileContent('sip-log.dat').then(function(data){
//	    console.log('getSipLog:',data.data);
	    $scope.logs = data.data;
	    $scope.logs.push('');
	});
    };
});


//** ******************************************************************************* */
app.controller('mainCtrl', function ($scope, services) {
    $scope.connection = '?';
    var timerFlag = 0;

    //**  */
    $scope.getStatusApp = function() {
	services.getAppStatus().then(function(data) {
	    var d = data.data;
//	    console.log('getAppStatus:',d);
	    $scope.connection = d.connection;
	}, function(err) {
	    $scope.connection = '?';
	});
    };

    //**  */
    if (timerFlag == 0) {
	$scope.getStatusApp();
	timerFlag = setInterval($scope.getStatusApp, 5000);
    }
});


//** ******************************************************************************* */
app.controller('basicCtrl', function ($scope, $location, $compile, services) {
    $scope.msgs = VERSION_STR;

    //**  */
    $scope.langtxt = function(key) {
	return langstr[key] || key;
    };

    //**  */
/*    $scope.modalChange = function(el,cb) {
	// remove and reinsert the element to force angular
	// to forget about the current element
	console.log('modalChange:', $scope.updateCfg, el, cb);
	$(el).replaceWith($(el));

	// change ng-click
	$(el).attr('ng-click',cb);
	$(el).prop('ng-click',cb);

	// compile the element
	$compile($(el))($scope);
    };//*/

    //**  */
    $scope.applyCfgChanges = function() {
//	$scope.updateCfg = 0;
	services.applyCfgChanges().then(function(data){
//	    console.log('applyCfgChanges:',data);
	    $location.path('/');
	}, function(err) {
	    console.log('applyCfgChanges:',err);
	    $location.path('/');
	});
    };
});


//** ******************************************************************************* */
app.config(function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        title: 'Status',
        templateUrl: 'views/about.html',
        controller: 'mainCtrl'
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
      .when('/tones', {
        title: 'Tones',
        templateUrl: 'views/upload.html',
        controller: 'uploadCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
});


//** ******************************************************************************* */
app.run(['$location', '$rootScope', function($location, $rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
}]);
