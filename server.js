var express = require('express')
  , bodyParser = require('body-parser')
  , fs = require('fs')
  , ini = require('ini')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server)
  , net = require('net')
  , ps = require('ps-node')
  , PORT = 80
  , SOCKET_PORT = 8123
  , INI_FILE = './../indoorpy/indoor.ini'
  , sockets = -1
  , appConnectionFlag = 0
  , webClients = [];

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/node_modules'));

//app.use('/sockets', io);


/** express routes */
app.get('/', function(req, res) {
  res.sendFile('/index.html');
//  res.redirect('/index.html');
});

/*
// get all
app.get('/log', function(req, res) {
    console.log('log');
});
// get all
app.get('/services', function(req, res) {
    console.log('services');
});


/*
app.get('/expert', function(req, res){
  res.redirect('/index.html');
});

app.get('/secure', function(req, res){
  res.render('../index.html');
});
//*/

// get all
app.get('/app/all', function(req, res) {
    var config = ini.parse(fs.readFileSync(INI_FILE, 'utf-8'));

    console.log('All');//, config);
    res.json(config);
});

// get status
app.get('/app/status', function(req, res) {
    console.log('Status');
    res.json({connection: appConnectionFlag});
});

// restart python app
app.post('/app/apply', function(req, res) {
    console.log('Apply');
    ps.lookup({
      command: 'python'
      }, function(err, resultList) {
        if (err) {
	  var e = new Error(err)
          res.json(err);
          throw e;
        }

	var ppid = 0;

        resultList.forEach(function(process) {
          if (process) {
            console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
	    ppid = process.pid;
	    ps.kill(process.pid, function(err) {
	      if (err) {
        	res.json(err);
    		throw new Error( err );
	      } else {
    		console.log( 'Process %s has been killed!', ppid);
	      }
	    });
          }
        });
        res.json('OK');
    });
});

// update
app.post('/app/update', function(req, res) {
    var config = ini.parse(fs.readFileSync(INI_FILE, 'utf-8')),
	sect = req.body.sect, item = req.body.item, vals = req.body.vals;

    console.log('update', sect,item,vals);
    config[sect][item] = vals;
    fs.writeFileSync(INI_FILE, ini.stringify(config));
    res.json('OK');
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
        console.log(data);
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