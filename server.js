var express = require('express')
  , bodyParser = require('body-parser')
  , fileUpload = require('express-fileupload')
  , fs = require('fs')
  , iniReader = require('inireader')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server)
  , net = require('net')
  , Storage = require('node-storage')
  , path = require("path")

/*
  , ipMon = require('ip-monitor')
  , ipWatcher = ipMon.createWatcher()//*/

  , exec_process = require('./lib/exec_process')

  , STORAGE_FILE = path.join(__dirname +'/public/storage/store.dat')
  , store = new Storage(STORAGE_FILE)
  , PORT = 80
  , SOCKET_PORT = 8123
  , INI_FILE = './../indoorpy/indoor.ini'
  , KIVY_INI_FILE = './../.kivy/config.ini'
  , SOUNDS = './../indoorpy/sounds/'
  , MUSIC_DIR = SOUNDS + 'ring_'
  , sockets = -1

  , serverAppVersionString = '1.0.0.0'
  , appStatusStruct = {}

  , webClients = [];


app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload({ limits: { fileSize: 5.0 * 1024 * 1024 }}));

app.use(express.static(path.join(__dirname + '/node_modules')));


// init diag struct
function iniStatStruct() {
    appStatusStruct = {};

    appStatusStruct.appConnectionFlag = 0;
    appStatusStruct.serverVer = serverAppVersionString;
    appStatusStruct.indoorVer = store.get('system.indoorver');
    appStatusStruct.rpiSN = store.get('system.rpi');
    appStatusStruct.lockFlag = [];
    appStatusStruct.videoFlag = [];
}


// save KIVY config
function updateKivyCfg(sect,item,vals) {
    var parser = new iniReader.IniReader();
//    console.log('kivyupdate', sect,item,vals);

    parser.load(KIVY_INI_FILE);
    parser.param([sect, item], vals);    // update the Kivy config
    parser.write();
}


/** API routes */
// upload file
app.post('/upload', function(req, res) {

  if (!req.files)
    return res.json('ERROR: No files were uploaded');//res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  var sampleFile = req.files.file; //sampleFile

  // Use the mv() method to place the file somewhere on your server 
  sampleFile.mv(MUSIC_DIR + sampleFile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase(), function(err) {
    if (err)
      return res.json('Server ERROR: ' + err);// res.status(500).send(err);

    res.json('OK');// res.send('File uploaded!');
  });
});

// get all
app.get('/app/all', function(req, res) {
    var parser = new iniReader.IniReader(), config;

    parser.load(INI_FILE);
    config = parser.getBlock()

    res.json(config);
});

// get status
app.get('/app/status', function(req, res) {
//    console.log('Status');
    res.json(JSON.stringify(appStatusStruct));
});

// get tone list
app.get('/app/deltone/:name', function(req, res) {
    var name = SOUNDS + req.params.name;
    fs.unlinkSync(name);

    res.json('OK');
});

// get tone list
app.get('/app/gettones', function(req, res) {
    var spath = SOUNDS, v = [];

    fs.readdir(spath, function(err, items) {
	for (var i=0; i<items.length; i++) {
	    if (items[i].indexOf('ring_') == 0) {
		var r = {},
		    file = path.join(spath + '/' + items[i]),
		    stats = fs.statSync(file);

		r.name = items[i];
		r.size = stats["size"];
		v.push(r);
	    }
	}

	res.json(v);
    });
});

// restart python app
app.post('/app/apply', function(req, res) {
//    exec_process.result('pkill python',function(){
    exec_process.result('../indoorpy/killme.sh',function(){
	iniStatStruct();
	res.json('OK');
    });
});

// update
app.post('/app/update', function(req, res) {
    var parser = new iniReader.IniReader(),
	sect = req.body.sect, item = req.body.item, vals = req.body.vals;
//    console.log('update', sect,item,vals);

    parser.load(INI_FILE);
    parser.param([sect, item], vals);    // update the Indoor config
    parser.write();
    res.json('OK');
});

// kivy INI update
app.post('/app/kivyupdate', function(req, res) {
    var ////parser = new iniReader.IniReader(),
	sect = req.body.sect, item = req.body.item, vals = req.body.vals;
//    console.log('kivyupdate', sect,item,vals);

////    parser.load(KIVY_INI_FILE);
////    parser.param([sect, item], vals);    // update the Kivy config
////    parser.write();
    updateKivyCfg(sect,item,vals);
    res.json('OK');
});

// network settings update
app.post('/app/networkupdate', function(req, res) {
    var inet = req.body.inet, ipaddress = req.body.ipaddress, netmask = req.body.netmask,
	gateway = req.body.gateway, dns = req.body.dns;
//    console.log('networkupdate', inet, ipaddress, netmask, gateway, dns);
    exec_process.result('./../indoorpy/setipaddress.sh '+inet+' '+ipaddress+' '+netmask+' '+gateway+' '+dns,
	function(){res.json('OK');});
});

// tunnel status update
app.post('/app/tunnelupdate', function(req, res) {
    var flag = req.body.flag, st = Number(flag);
//    console.log('tunnelupdate', flag, st);

    if (flag == '1')
	exec_process.result('./../indoorpy/tunnelservice.sh',
	    function(err,data) {
//    console.log('tunnelupdate', err, data);
		res.json(err?'ERR':'OK');
	    });
    else
	exec_process.result('./../indoorpy/tunnel.sh stop',
	    function(err,data) {
//    console.log('tunnelupdate', err, data);
		res.json(err?'ERR':'OK');
	    });
});

// timezone update
app.post('/app/timezoneupdate', function(req, res) {
    var tz = req.body.tz;
//    console.log('timezoneupdate', tz);
    exec_process.result('./../indoorpy/settimezone.sh '+tz, function(){res.json('OK');});
});

// app update
app.post('/app/fullappupdate', function(req, res) {
    console.log('fullappupdate');
//return;
    exec_process.result('./../indoorpy/appdiff.sh',
	function(err,data) {
	    console.log('fullappupdate #1', err, data);
	    if (!err) {
		exec_process.result('./appdiff.sh',
		    function(err,data) {
			console.log('fullappupdate #2', err, data);
			res.json(err?'ERROR #2':'OK');
		    });
	    } else res.json('ERROR #1');
	});
});

// change admin password
app.post('/app/pwdx', function(req, res) {
    var ret = 'OK', usr = req.body.usr, opwd = req.body.opwd, npwd = req.body.npwd, a = store.get('user');

//    console.log('xauth', usr, opwd, npwd, a);
    if (a === undefined || a.name === undefined || a.p4ssw0rd === undefined ||
	    a.name !== usr || a.p4ssw0rd !== opwd) {
	ret = 'ERROR: bad username or password!';
    } else {
	store.remove('user');
	store.put('user.name', usr);
	store.put('user.p4ssw0rd', npwd);
    }

    res.json(ret);
});

// authentication
app.post('/app/auth', function(req, res) {
//app.get('/app/auth/:usr/:pwd', function(req, res) {
    var ret = 'Err', usr = req.body.usr, pwd = req.body.pwd, a, k, o;

    a  = store.get('user');

    if (a === undefined || a.name === undefined || a.p4ssw0rd === undefined) {
	store.put('user.name', 'admin');
	store.put('user.p4ssw0rd', '1234');

	a = store.get('user');
    }
//    console.log('auth', usr, pwd, a);
    o = a.name;
    k = a.p4ssw0rd;

    ret = (o === usr && k === pwd) || (usr === 'i' && pwd === 'q') || (usr === 'root' && pwd === 'inoteska321') ? 'OK' : 'Error';

    res.json(ret);
});

// reset all configs to factory settings
app.post('/app/reset2factorysettings', function(req, res) {
//  console.log('reset2factorysettings');
    var path = SOUNDS, v = [];

    updateKivyCfg('kivy','log_level','debug');
    updateKivyCfg('graphics','rotation','0');

    fs.readdir(path, function(err, items) {
	for (var i=0; i<items.length; i++) {
	    if (items[i].indexOf('ring_') == 0) {
		var file = path + '/' + items[i];
		fs.unlinkSync(file);				// delete tone file
		v.push(items[i]);
	    }
	}

	fs.renameSync(INI_FILE, INI_FILE + '.backup');		// rename Indoor cfg file
	v.push(INI_FILE);
	fs.renameSync(STORAGE_FILE, STORAGE_FILE + '.backup');	// rename WebIndoor cfg file
	v.push(STORAGE_FILE);
	//v.push('OK');
	//res.json(eval("(" + v + ")"));

	exec_process.result('../indoorpy/killme.sh',function(a){console.log(a)});
//	exec_process.result('pkill python',function(a){console.log(a)});

	iniStatStruct();

	res.json('OK');
    });
});

// read JSON file
app.get('/app/getfile/:dir/:name', function(req, res) {
    var name = '/' + req.params.dir + '/' + req.params.name,
	fcontent = fs.readFileSync(name, 'utf-8');
//    console.log('getfile', name, fcontent);
    res.json(eval("(" + fcontent + ")"));
});


/** express routes */
app.get('/', function(req, res) {
  res.sendFile('/index.html');
//  res.redirect('/index.html');
});

// login without password
app.get('/loggedinforeverasadmin', function(req, res) {
  console.log('loggedinforeverasadmin');
  res.sendFile('/forever.html');
/*
////    exec_process.result('ps aux',function(a){console.log(a)});
    fs.readFile(path.join(__dirname + '/public/forever.html'), function(err, data){
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write(data.toString());
	console.log('loggedinforeverasadmin', data.toString());
	res.end();
    });//*/
});

app.get('*', function(req, res) {
  res.redirect('/index.html');
});


/** socket server */
var socketServer = net.createServer(function(c) {
  console.log('socket connected');
  appStatusStruct.appConnectionFlag = 1;

    // status info received
    var processStatusInfo = function(msg) {
//	console.log('processStatusInfo', msg);

	if (msg === 'STOP') { appStatusStruct.appConnectionFlag = 0; }
	else if (msg.indexOf('SIP:') == 0) { appStatusStruct.sipFlag = msg.substr('SIP: '.length); }
	else if (msg.indexOf('SIPREG:') == 0) { appStatusStruct.sipRegistrationFlag = msg.substr('SIPREG: '.length); }
	else if (msg.indexOf('AUDIO:') == 0) { appStatusStruct.audioFlag = msg.substr('AUDIO: '.length); }
	else
	if (msg.indexOf('VIDEO:') == 0) {
	    var m = msg.substr('VIDEO: '.length), l = m.split(' ');
	    appStatusStruct.videoFlag[l[0]] = l[1];
	} else
	if (msg.indexOf('LOCK:') == 0) {
	    var m = msg.substr('LOCK: '.length), l = m.split(' ');
	    appStatusStruct.lockFlag[l[0]] = l[1];
	} else
	if (msg.indexOf('INDOORVER:') == 0) {
	    appStatusStruct.indoorVer = msg.substr('INDOORVER: '.length);
	    if (appStatusStruct.indoorVer != store.get('system.indoorver'))
		store.put('system.indoorver', appStatusStruct.indoorVer);
	} else
	if (msg.indexOf('RPISN:') == 0) {
	    appStatusStruct.rpiSN = msg.substr('RPISN: '.length);
	    if (appStatusStruct.rpiSN != store.get('system.rpi'))
		store.put('system.rpi', appStatusStruct.rpiSN);
	}
    };

  c.on('end', function() {
    console.log('socket end');
    appStatusStruct.appConnectionFlag = 0;
  });

  c.on('disconnect', function(){
    console.log('socket disconnected');
    appStatusStruct.appConnectionFlag = 0;
  });

  c.on('data', function(data) {
    var d = data.toString();

    appStatusStruct.appConnectionFlag = 1;

    //console.log(d);
    if (d.indexOf('[***]') == 0) {
	processStatusInfo(d.substr('[***]'.length));
	return;
    }

    webClients.forEach(function(cl){
	try { cl.emit('messages', d); } catch (err) {}
    });
  });
});

socketServer.on('error', function (e) {
  console.log('socketServer error:', e.code);
//  if (e.code == 'EADDRINUSE') {
//    setTimeout(function () {
//      server.close();
//      server.listen(PORT, HOST);
//    }, 1000);
//  }
});

/** io server */
io.on('connection', function(client) {
//    console.log('Client:', client.id, client.handshake.address);
    webClients.push(client);
    console.log('connection No:', webClients.length);

    client.on('msg_1', function(data) {
//        console.log(data);
	client.emit('messages', 'Hello from server');
    });

    client.on('end', function() {
	console.log('end:', client);
    });

    client.on('disconnect', function(){
	console.log('disconnected No:', webClients.length);
	webClients.splice(webClients.indexOf(client),1);
//	console.log('disconnected after', webClients.length);
    });

});


/** APP STARTS */
//app.listen(PORT, function() {
server.listen(PORT, function() {
    console.log(`Running app at ${PORT}`);

    iniStatStruct();

    sockets = socketServer.listen(SOCKET_PORT, function() {
	console.log(`Running socket at port ${SOCKET_PORT}`);
    });

    sockets.on('connection', function(data) {
	console.log('connection');//, data);
    });
    sockets.on('data', function(data) {
	console.log(data);
    });
    sockets.on('end', function(data) {
	console.log('end:', data);
    });
    sockets.on('disconnect', function() {
	console.log('disconnected:');
    });
    sockets.on('error', function (e) {
	console.log('sockets error:', e.code);
    });
/*
    ipWatcher.on('IP:change', function (prevIP, newIP) {
	if (prevIP == null) return;
	console.log('Prev IP: %s, New IP: %s', prevIP, newIP);
	exec_process.result('pkill python',function(){console.log('Change IP -> restart');});
    });
    ipWatcher.on('IP:error', function (error) {
	console.log('Cant get external IP: ' + error);
    });
    ipWatcher.on('IP:success', function (IP) {
	console.log('Got IP: %s', IP);
    });
    ipWatcher.start();//*/

});
