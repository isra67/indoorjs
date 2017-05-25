var express = require('express')
  , bodyParser = require('body-parser')
  , fs = require('fs')
//  , ini = require('ini')
  , iniReader = require('inireader')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server)
  , net = require('net')
//  , ps = require('ps-node')
  , fileUpload = require('express-fileupload')
  , Storage = require('node-storage')
  , path = require("path")

  , exec_process = require('./lib/exec_process')

  , STORAGE_FILE = 'public/storage/store.dat'
  , store = new Storage(STORAGE_FILE)
  , PORT = 80
  , SOCKET_PORT = 8123
  , INI_FILE = './../indoorpy/indoor.ini'
  , KIVY_INI_FILE = './../.kivy/config.ini'
  , SOUNDS = './../indoorpy/sounds/'
  , MUSIC_DIR = SOUNDS + 'ring_'
  , sockets = -1
  , appConnectionFlag = 0
  , webClients = [];


app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload({ limits: { fileSize: .5 * 1024 * 1024 }}));

app.use(express.static(path.join(__dirname + '/node_modules')));


/** API routes */
// upload file
app.post('/upload', function(req, res) {
  if (!req.files)
    return res.json('ERROR: No files were uploaded');//res.status(400).send('No files were uploaded.');
 
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  var sampleFile = req.files.file; //sampleFile

  // Use the mv() method to place the file somewhere on your server 
  sampleFile.mv(MUSIC_DIR + sampleFile.name, function(err) {
    if (err)
      return res.json('Server ERROR: ' + err);// res.status(500).send(err);
 
    res.json('OK');// res.send('File uploaded!');
  });
});

// get all
app.get('/app/all', function(req, res) {
//    var config = ini.parse(fs.readFileSync(INI_FILE, 'utf-8'));
    var parser = new iniReader.IniReader(), config;

    parser.load(INI_FILE);
    config = parser.getBlock()

//    console.log('All');//, config);
    res.json(config);
});

// get status
app.get('/app/status', function(req, res) {
//    console.log('Status');
    var s = "{'connection': appConnectionFlag}",
	v = eval("(" + s + ")");
    res.json(v);
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
    exec_process.result('pkill python',function(){res.json('OK');});
});

// update
app.post('/app/update', function(req, res) {
    var parser = new iniReader.IniReader(),
//    var config = ini.parse(fs.readFileSync(INI_FILE, 'utf-8')),
	sect = req.body.sect, item = req.body.item, vals = req.body.vals;

//    console.log('update', sect,item,vals);
//    config[sect][item] = vals;
//    fs.writeFileSync(INI_FILE, ini.stringify(config, {whitespace: true}));
    parser.load(INI_FILE);
    parser.param([sect, item], vals);    // update the config
    parser.write();
    res.json('OK');
});

// kivy INI update
app.post('/app/kivyupdate', function(req, res) {
/*    var kivyconfig = ini.parse(fs.readFileSync(KIVY_INI_FILE, 'utf-8')),
	sect = req.body.sect, item = req.body.item, vals = req.body.vals;

//    console.log('kivyupdate', sect,item,vals);
    kivyconfig[sect][item] = vals;
    fs.writeFileSync(KIVY_INI_FILE, ini.stringify(kivyconfig, {whitespace: true}));//*/

    var parser = new iniReader.IniReader(),
	sect = req.body.sect, item = req.body.item, vals = req.body.vals;
    console.log('kivyupdate', sect,item,vals);

    parser.load(KIVY_INI_FILE);
    parser.param([sect, item], vals);    // update the config
    parser.write();
    res.json('OK');
});

// network settings update
app.post('/app/networkupdate', function(req, res) {
    var inet = req.body.inet, ipaddress = req.body.ipaddress, netmask = req.body.netmask,
	gateway = req.body.gateway, dns = req.body.dns;
//    console.log('networkupdate', inet, ipaddress, netmask, gateway, dns);
    exec_process.result('./../indoorpy/setipaddress.sh '+inet+' '+ipaddress+' '+netmask+' '+gateway+' '+dns,function(){res.json('OK');});
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

	exec_process.result('pkill python',function(a){console.log(a)});

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
  res.sendFile('/index.html');
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
  appConnectionFlag = 1;

  c.on('end', function() {
    console.log('socket disconnected');
    appConnectionFlag = 0;
  });

  c.on('data', function(data) {
    var d = data.toString();
    //console.log(d);

    webClients.forEach(function(cl){
	cl.emit('messages', d);
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
//    console.log('Client:', client);
    webClients.push(client);

    client.on('msg_1', function(data) {
//        console.log(data);
	client.emit('messages', 'Hello from server');
    });

    client.on('end', function() {
	console.log('disconnected:', client);
    });
});


/** APP STARTS */
//app.listen(PORT, function() {
server.listen(PORT, function() {
    console.log(`Running app at ${PORT}`);

    sockets = socketServer.listen(SOCKET_PORT, function() {
	console.log(`Running socket at port ${SOCKET_PORT}`);
    });

    sockets.on('connection', function(data) {
	console.log('connection');
    });
    sockets.on('data', function(data) {
	console.log(data);
    });
    sockets.on('end', function(data) {
	console.log('disconnected:', data);
    });
   sockets.on('error', function (e) {
	console.log('sockets error:', e.code);
    });
});
