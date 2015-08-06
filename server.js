/**
 * Created by Jairo Martinez on 8/5/15.
 */

var fs = require('fs');
var config = {};

try {
	fs.openSync(__dirname + "/config/server.json", 'r');
	config = JSON.parse(fs.readFileSync(__dirname + "/config/server.json"));
}
catch (err) {
	config = JSON.parse(fs.readFileSync(__dirname + "/config/default.json"));
}

var http = require('http');
var db = require('./db');
var app = {};

function init(cfg) {
	console.info('Initializing Server');

	app = require('./app')(cfg);

	var server = http.createServer(app);

	server.listen(app.get('port'), function () {
		console.info('Listening on port ' + config.server.port);
	});

	server.on('error', function (err) {
	});
}

init(config);