#!/usr/bin/env node
var https = require('https');
var fs = require('fs');
var app = require('./app');


var options = {
  pfx:                fs.readFileSync('./apps_onshape_com.pfx'),
  requestCert:        false,
  rejectUnauthorized: false
};

app.set('port', process.env.PORT || 7000);
var server = https.createServer(options, app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on HTTPS port ' + app.get('port'));
});
