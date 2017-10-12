
var VERSION_STR = 'WebIndoor 1.1';

var app = angular.module('myApp', ['ngRoute', 'ngFileUpload']);


//** ******************************************************************************* */
app.factory("services", ['$http', function($http) {
    var serviceBase = '/app/'
      , obj = {}
      , headercfg = {headers : { 'Expires': '-1', 'Pragma': 'no-cache'}};
//      , headercfg = {}; //{ headers : { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;' }};

    //**  */
    obj.checkLogin = function(u,p) { return $http.post(serviceBase + 'auth', {usr: u, pwd:p}, headercfg) }

    //**  */
    obj.applyPwdChange = function(u,oldPwd,newPwd) {
        return $http.post(serviceBase + 'pwdx', {usr: u, opwd: oldPwd, npwd: newPwd}, headercfg);
    }

    //**  */
    obj.getAppStatus = function() { return $http.get(serviceBase + 'status', headercfg) }

    //**  */
    obj.getIniItems = function() { return $http.get(serviceBase + 'all', headercfg) }

    //**  */
    obj.getFileContent = function(name, dir) {
	var d = (dir == undefined) ? 'tmp' : dir;
        return $http.get(serviceBase + 'getfile/' + d + '/' + name, headercfg);
    }

    //**  */
    obj.getToneList = function() { return $http.get(serviceBase + 'gettones', headercfg) }

    //**  */
    obj.removeTone = function(name) { return $http.get(serviceBase + 'deltone/' + name, headercfg) }

    //**  */
    obj.applyCfgChanges = function() { return $http.post(serviceBase + 'apply', headercfg) }

    //**  */
    obj.factoryResetConfig = function() { return $http.post(serviceBase + 'reset2factorysettings', headercfg) }

    //**  */
    obj.fullAppUpdate = function(repo) { return $http.post(serviceBase + 'fullappupdate/' + repo, headercfg) }

    //**  */
    obj.updateIniItem = function(sect,item,vals) {
        return $http.post(serviceBase + 'update', {sect: sect, item: item, vals: vals}, headercfg);
    };

    //**  */
    obj.updateKivyIniItem = function(sect,item,vals) {
        return $http.post(serviceBase + 'kivyupdate', {sect: sect, item: item, vals: vals}, headercfg);
    };

    //**  */
    obj.updateNetwork = function(inet, ipaddress, netmask, gateway, dns) {
        return $http.post(serviceBase + 'networkupdate', {inet: inet, ipaddress: ipaddress, netmask: netmask, gateway: gateway, dns: dns}, headercfg);
    };

    //**  */
    obj.updateTunnel = function(flag) { return $http.post(serviceBase + 'tunnelupdate', {flag: flag}, headercfg); };

    //**  */
    obj.updateTimezone = function(tz) { return $http.post(serviceBase + 'timezoneupdate', {tz: tz}, headercfg); };

    return obj;
}]);


//** ******************************************************************************* */
app.controller('configCtrl', function ($scope, $rootScope, $location, services) {
    $scope.customers = {};
    $scope.configbackup = {};
    $scope.keys = [];
    $scope.updateCfg = 0;
    $scope.defcfgkeys = Object.keys(defcfg);
    $scope.inits = 1;
    $scope.currTz = '';

    //**  */
    $scope.cfgItemType = function(key) {
//	console.log('cfgItemType:',key);
	var i = $scope.defcfgkeys.indexOf(key);
	if (i < 0) return [];
	if (defcfg[key]['type'] === 'timezone') { return $rootScope.tzValues; }
	else
	if (defcfg[key]['type'] !== 'sel') return [];
//	console.log('cfgItemType:',key,i,defcfg[key]['options']);
	return defcfg[key]['options'].split(',');
    };

    //**  */
    $scope.changeItem = function(sect,item,vals) {
	if (sect === 'timezones' && item === 'timezone') vals = vals.val;
//	console.log('changeItem:',sect,item,vals);
	$scope.updateCfg = 1;
	$scope.customers[sect][item] = vals;
    };

    //**  */
    $scope.saveConfigItems = function() {
	$scope.updateCfg = 2;

	$rootScope.actualConfig = $scope.customers;

	var updNetwork = 0, updLogs = 0, updTunnel = 0, updRotation = 0, updTimezone = 0, cfg;

	for (var sect in $scope.customers) {
	    if ($scope.customers.hasOwnProperty(sect)) {
		for (var item in $scope.customers[sect]) {
		    if ($scope.customers[sect].hasOwnProperty(item)) {
			if ($scope.customers[sect][item] != $scope.configbackup[sect][item]) {
//			    console.log('changeItem:',sect, item);

			    if (sect.indexOf('system') > -1) updNetwork = 1;
			    else
			    if (sect.indexOf('gui') > -1 && item.indexOf('screen_orientation') > -1) updRotation = 1;
			    else
			    if (sect.indexOf('timezones') > -1 && item.indexOf('timezone') > -1) updTimezone = 1;
			    else
			    if (sect.indexOf('service') > -1) {
				if (item.indexOf('app_log') > -1) updLogs = 1;
				if (item.indexOf('tunnel_flag') > -1) updTunnel = 1;
			    }

			    $scope.configbackup[sect][item] = $scope.customers[sect][item]; // store new value

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

	if (updLogs) {
	    cfg = $scope.customers['service'];
//	    console.log('saveConfigItems: updLogs', cfg['app_log']);
	    services.updateKivyIniItem('kivy','log_level',cfg['app_log'])
	      .then(function(data) {
//		console.log('changeItem:',data);
	      }, function(err) {
		console.log('changeItem:',err);
	      });
	}
	if (updRotation) {
	    cfg = $scope.customers['gui'];
//	    console.log('saveConfigItems: updRotation', cfg['screen_orientation']);
	    services.updateKivyIniItem('graphics','rotation',cfg['screen_orientation'])
	      .then(function(data) {
//		console.log('changeItem:',data);
	      }, function(err) {
		console.log('changeItem:',err);
	      });
	}
	if (updNetwork) {
	    cfg = $scope.customers['system'];
//	    console.log('saveConfigItems: updNetwork', cfg['inet'], cfg['ipaddress'], cfg['netmask'], cfg['gateway'], cfg['dns']);
	    services.updateNetwork(cfg['inet'], cfg['ipaddress'], cfg['netmask'], cfg['gateway'], cfg['dns'])
	      .then(function(data) {
//		console.log('changeItem:',data);
	      }, function(err) {
		console.log('changeItem:',err);
	      });
	}
	if (updTunnel) {
	    cfg = $scope.customers['service'];
	    services.updateTunnel(cfg['tunnel_flag'])
	      .then(function(data) {
//		console.log('changeItem:',data);
	      }, function(err) {
		console.log('changeItem:',err);
	      });
	}
	if (updTimezone) {
	    cfg = $scope.customers['timezones'];
	    services.updateTimezone(cfg['timezone'])
	      .then(function(data) {
//		console.log('changeItem:',data);
	      }, function(err) {
		console.log('changeItem:',err);
	      });
	}
    };

    //**  */
    services.getIniItems().then(function(data) {
	var cfg = data.data, sortcfg = {};

	$scope.inits = 1;
//	console.log('getIniItems:',$scope.inits);

	// sorting keys in INI:
	for (var sect in cfg) {
	    if (cfg.hasOwnProperty(sect)) {
		sortcfg[sect] = {};
		var items = Object.keys(cfg[sect]);
		items.sort(function(a,b) {
			var p1, p2;
			try { p1 = defcfg[a].position; } catch (e) { return 100; }
			try { p2 = defcfg[b].position; } catch (e) { return 100; }
			return p1 - p2;
		    });
		for (var item in items) {
		    if (cfg[sect].hasOwnProperty(items[item])) {
			sortcfg[sect][items[item]] = cfg[sect][items[item]];
//			console.log('cyc init:',sect, items[item]);
		    }
		}
	    }
	}

        $scope.customers = sortcfg;
	$rootScope.actualConfig = $scope.customers;
	$scope.configbackup = JSON.parse(JSON.stringify(cfg));
	$scope.keys = Object.keys(cfg);

	var t = defcfg['ringtone']['options'].split(',');
	if (t.length > 3) {
	    defcfg['ringtone']['options'] = t.slice(0, 3).join(','); // del customers tones
	}

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

	$scope.inits = 0;
	$scope.currTz = $rootScope.tzValues.find(function(elem){ return elem.val === $scope.customers['timezones']['timezone'] });
	$scope.ke_timezone = $scope.currTz;
//	console.log('currTz:',$scope.currTz, $scope.ke_timezone);
    });

    if ($rootScope.login == 0) { $location.path('/login') }
});


//** ******************************************************************************* */
app.controller('uploadCtrl', ['$scope', '$rootScope', 'Upload', '$timeout', '$location', 'services',
    function ($scope, $rootScope, Upload, $timeout, $location, services) {

    $scope.tones = [];
    $scope.toRemove = -1;
    $scope.selectedToneName = $rootScope.actualConfig['devices']['ringtone'];

    //**  */
    $scope.getToneList = function() {
	$scope.tones = [];
	$scope.toRemove = -1;
	services.getToneList().then(function(data){
//	    console.log('getToneList:',data.data, $scope.selectedToneName);
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

    if ($rootScope.login == 0) { $location.path('/login') }

    $scope.getToneList();
}]);


//** ******************************************************************************* */
//*
app.controller('foreverCtrl', function ($scope, $rootScope, $location, services) {
    console.log('foreverCtrl:');
    var p = $location.path();

    console.log('foreverCtrl:',p);
/*    if (p.infexOf('forever') > -1) {
	$rootScope.login = 1;
	$rootScope.username = 'root';
//	$location.path('/');
//	return;
    }//*/
});//*/


//** ******************************************************************************* */
app.controller('logCtrl', function ($scope, $rootScope, $location, services) {
    $scope.logs = [];

    if ($rootScope.login == 0) { $location.path('/login') }
});


//** ******************************************************************************* */
app.controller('loginCtrl', function ($scope, $rootScope, $location, services) {
    $scope.msg = '';

    //**  */
    $scope.checkLogin = function() {
	//console.log('checkLogin:',$scope.usr, $scope.pwd);
	$rootScope.login = 0;
	$scope.msg = '';
	services.checkLogin($scope.usr, $scope.pwd).then(
	    function(data) {
		$rootScope.login = data.data === 'OK' ? 1 : 0;
//		console.log('checkLogin:', data.data, $rootScope.login);
		if ($rootScope.login > 0) {
		    $rootScope.username = $scope.usr;
		    $location.path('/');
		} else {
		    $scope.msg = 'Bad Username or Password';
		}
	    }, function(err) {
		$scope.msg = 'Bad Username or Password';
	    });
    };
});


//** ******************************************************************************* */
app.controller('serviceCtrl', function ($scope, $rootScope, $location, services) {
    $scope.msg = '';
    $scope.logs = [];
    $scope.cntrs = {};
    $scope.keys = [];

    //**  */
    $scope.reinitScopes = function() {
	$scope.msg = '';
	$scope.logs = [];
	$scope.cntrs = {};
	$scope.keys = [];
    };

    //**  */
    $scope.factoryResetConfig = function() {
	$scope.reinitScopes();
	services.factoryResetConfig().then(function(data){
//	    console.log('factoryResetConfig:',data);
	    //$location.path('/');
	    $scope.msg = data.data;
	}, function(err) {
//	    console.log('factoryResetConfig:',err);
	    $scope.msg = err;
	    $location.path('/');
	});
    };

    //**  */
    $scope.restartApp = function() {
	$scope.reinitScopes();
	services.applyCfgChanges().then(function(data){
	    $scope.msg = data.data;
	}, function(err) {
//	    console.log('restartApp:',err);
	    $scope.msg = err;
	    $location.path('/');
	});
    };

    //**  */
    $scope.fullApplicationUpdate = function() {
	$scope.reinitScopes();

	$scope.msg = 'Wait...';

	var repo = 'production';
	try { repo = $rootScope.actualConfig['service']['update_repo']; } catch (e) { repo = 'production'; }
	services.fullAppUpdate(repo).then(function(data){
	    $scope.msg = data.data;
	}, function(err) {
//	    console.log('full app update:',err);
	    $scope.msg = err;
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
//	console.log('getSipLog:');
	services.getFileContent('sip-log.dat').then(function(data){
//	    console.log('getSipLog:',data.data);
	    $scope.logs = data.data;
	    $scope.logs.push('');
	});
    };

    if ($rootScope.login == 0) { $location.path('/login') }
});


//** ******************************************************************************* */
app.controller('mainCtrl', function ($scope, $rootScope, $location, services) {

    var timerFlag = 0, REFRESH_TIME = 4000;

    //**  */
    $scope.reinitScopes = function() {
	$scope.appConnectionFlag = '?';
	$scope.sipRegistrationFlag = '?';
	$scope.sipFlag = '?';
	$scope.audioFlag = '?';
	$scope.lockFlag = [];
	$scope.videoFlag = [];
	$scope.rpiSN = $rootScope.actualConfig['about']['serial'];
	$scope.indoorVer = '?';
	$scope.serverVer = '?';
	$scope.webVer = VERSION_STR;
	$scope.ip_addr = $rootScope.actualConfig['system']['ipaddress'];
	$scope.mac_addr = '?';
	$scope.uptime = '?';
	$scope.sdinfo = '?';
    };

    //**  */
    $scope.getStatusApp = function() {
	services.getAppStatus().then(function(data) {
	    var d = JSON.parse(data.data), guiMode = $rootScope.actualConfig['gui']['screen_mode'];
//	    console.log('getAppStatus:', d);
//	    $scope.statusInfos = d;
	    if (d.appConnectionFlag == '1') {
//		$scope.reinitScopes();
		if ($scope.sipRegistrationFlag != '1') {
		    services.getIniItems().then(function(data) { // get actual configuration from device
			$rootScope.actualConfig = data.data;
		    });
		}
		$scope.rpiSN = d.rpiSN;
		$scope.sipFlag = d.sipFlag;
		$scope.sipRegistrationFlag = d.sipRegistrationFlag;
		$scope.audioFlag = d.audioFlag;
		$scope.videoFlag = d.videoFlag;
		$scope.lockFlag = d.lockFlag;
		$scope.indoorVer = d.indoorVer;
		$scope.serverVer = d.serverVer;
		$scope.ip_addr = d.ipaddr;
		$scope.mac_addr = d.macaddr;
		$scope.uptime = d.uptime;
		$scope.sdinfo = d.sdcard;
		$scope.updates = d.updates;

		while ($scope.videoFlag.length < guiMode) { $scope.videoFlag.push('?'); }
		while ($scope.lockFlag.length < guiMode) { $scope.lockFlag.push('..'); }

		for (var i = 0; i < d.lockFlag.length; i++) {
		    if (d.lockFlag[i] != undefined) {
			var lf = Number('0x'+d.lockFlag[i]);
			if (lf == 0x55) { // unknown device address or error
			    $scope.lockFlag[i] = '..';
			} else {
			    var l1 = lf & 0x0f,  l2 = (lf >> 4) & 0x0f;
			    $scope.lockFlag[i] = l1 ? 'U' : 'L';
			    $scope.lockFlag[i] = $scope.lockFlag[i] + (l2 ? 'U' : 'L');
			}
		    } else {
			$scope.lockFlag[i] = '..';
		    }
		}
		$scope.lockFlag.length = $scope.videoFlag.length = guiMode;
	    } else {
		if ($scope.appConnectionFlag == 'OK') $scope.appConnectionFlag = '?';
		else $scope.reinitScopes();
	    }
	    $scope.appConnectionFlag = d.appConnectionFlag == '1' ? 'OK' : 'UNKNOWN';
	}, function(err) {
	    $scope.appConnectionFlag = '?';
	});
    };

    if ($rootScope.login == 0) { $location.path('/login') }

    $scope.reinitScopes();

    //**  */
    if (timerFlag == 0) {
	$scope.getStatusApp();
	timerFlag = setInterval($scope.getStatusApp, REFRESH_TIME);
    }
});


//** ******************************************************************************* */
app.controller('basicCtrl', function ($scope, $rootScope, $location, $compile, services) {
    $scope.msgs = $rootScope.msgs;
    $scope.logged = $rootScope.login;
    $scope.errmsg = '';

    //**  */
    $scope.langtxt = function(key) { return langstr[key] || key };

    if ($rootScope.login == 0) { $location.path('/login') }

    //**  */
    $scope.doLogout = function() {
	$rootScope.login = 0;
	$rootScope.username = '';
	$scope.errmsg = '';
	$scope.logged = $rootScope.login;
	$location.path('/login');
    };

    //**  */
    $scope.applyPwdChange = function() {
//	console.log('applyPwdChange:', $rootScope.username, $scope.oldPwd, $scope.newPwd1, $scope.newPwd2);
	$scope.errmsg = '';
	if ($rootScope.username.toLowerCase() !== 'admin') {
	    $scope.errmsg = 'You have not privilege to change password for "'+$rootScope.username+'"!';
	    $scope.oldPwd = $scope.newPwd1 = $scope.newPwd2 = '';
	    return;
	}
	if ($scope.newPwd1.length > 1 && $scope.newPwd1 === $scope.newPwd2) {
	  services.applyPwdChange($rootScope.username, $scope.oldPwd, $scope.newPwd1)
	    .then(function(data){
		if (data.data !== 'OK') { $scope.errmsg = data.data; }
		else {
		    $rootScope.login = 0;
		    $location.path('/logout');
		}
	    }, function(err) {
	      console.log('applyPwdChange:',err);
	      $scope.errmsg = err;
	    });
	} else {
	    $scope.errmsg = 'New passwords are not equal!';
	}
	$scope.oldPwd = $scope.newPwd1 = $scope.newPwd2 = '';
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
	$scope.errmsg = '';
//	$scope.updateCfg = 0;
	services.applyCfgChanges().then(function(data){
//	    console.log('applyCfgChanges:',data);
	    $location.path('/');
	}, function(err) {
	    console.log('applyCfgChanges:',err);
	    $scope.errmsg = err;
//	    $location.path('/');
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
      .when('/login', {
        title: 'LogIn',
        templateUrl: 'views/login.html',
        controller: 'loginCtrl'
      })
      .when('/logout', {
        title: 'LogOut',
        templateUrl: 'views/login.html',
        controller: 'loginCtrl'
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
/*      .when('/loggedinforeverasadmin', {
        controller: 'foreverCtrl'
      })//*/
      .otherwise({
        redirectTo: '/login'
      });

    $locationProvider.html5Mode(true);
});


//** ******************************************************************************* */
app.run(['$location', '$rootScope', 'services', function($location, $rootScope, services) {
    $rootScope.login = 0;
    $rootScope.username = '';
    $rootScope.msgs = VERSION_STR;
    $rootScope.actualConfig = {};

    services.getIniItems().then(function(data) { // get actual configuration from device
	$rootScope.actualConfig = data.data;
    });

    $rootScope.tzValues = filltimezone('','Europe/Brussels');


    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
}]);
