var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

var index = require('./routes/index');
var login = require('./routes/login');
var viewStl = require('./routes/viewstl');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hbs').__express);
app.set('view engine', 'html');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// middleware for requiring query params
app.use(function(req, res, next) {
  if (!req.query || !req.query.documentId || !req.query.workspaceId || 
    !req.query.server) {
    var err = new Error('Missing query params');
    err.status = 400;
    return next(err);
  }
  next();
});

// routes
app.get('/', index.renderPage);
app.post('/getElements', index.getElements);
app.post('/getParts', index.getParts);

app.get('/viewStl', viewStl.renderPage);
app.post('/getStl', viewStl.getStl);

app.get('/login', login.renderPage);
app.post('/login', login.login);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
