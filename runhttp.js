var http = require('http');
var fs = require('fs');
var app = require('./app');

app.set('port', process.env.PORT || 7000);
var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on HTTP port ' + app.get('port'));
});