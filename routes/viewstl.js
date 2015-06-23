var express = require('express');

exports.renderPage = function(req, res) {
  res.render('viewstl');
};


function callback(req, res, success, data) {
  if (!success) {
    var search = url.parse(req.url).search;
    res.status(404);
    return res.send();
  }
  res.send(data);
}