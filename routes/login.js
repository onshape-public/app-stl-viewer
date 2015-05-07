var express = require('express');
var http = require('http');
var querystring = require('querystring');
var OnshapeApi = require('./onshapeapi');
var onshape = new OnshapeApi();
var url = require('url');

exports.renderPage = function (req, res) {
  res.render('login');
};

exports.login = function(req, res) {
  // URL must contain query string! 
  // (Query string contains document and workspace information)
  var search = url.parse(req.url).search;
  if (search === null) {
    res.status(400);
  }

  onshape.login(unescape(req.query.server), req.body.username, req.body.password, req.body.totp, function(success, cookie, twoFactor) {
    if (success) {
      res.cookie('onshapeSessionId', cookie);
      // URL must contain query string! 
      // (Query string contains document and workspace information)
      res.json({
                success: true,
                redirect: '/' + search
              });
    } else {
      if (twoFactor) {
        res.json({
                  success: false, 
                  twoFactor: true,
                  message: 'Require TOTP'
                });
      } else {
        res.json({
                  success: false, 
                  message: 'Invalid username or password!'
                });
      }
    }
  });
};