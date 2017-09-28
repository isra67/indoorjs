var exec = require('child_process').exec;

var result = function(command, cb){
    var child = exec(command, function(err, stdout, stderr) {
        if(err != null){
            return cb(new Error(err), null);
        }else if(typeof(stderr) != "string"){
            return cb(new Error(stderr), null);
        }else{
            return cb(null, stdout);
        }
    });
    //console.log(child);
    child.on('close', function(code) {
//      console.log('child ended with: ' + code);
    });
    child.on('error', function(err) {
      console.log('child errd with: ' + err);
    });
    child.stdout.on('data', function(d) {
//      console.log('child stdout: ' + d);
   });
}

exports.result = result;