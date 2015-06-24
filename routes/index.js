var express = require('express');
var url = require('url');

exports.renderPage = function(req, res) {
  res.render('index');
};

/*
 * Get STL data from server. Must contain documentId, stlElementId, and
 * workspaceId as part of the query.
 */
exports.getStl = function(req, res) {
  // Note: binary goes in the POST body, while the IDs go in the query string.
  // OnshapeApi automatically appends IDs in the query string while the binary
  // option is set by the client-side Javascript.
  if (!req.body.binary || !req.query.stlElementId) {
    return res.status(400);
  }

  var partId = '';
  if (req.query.partId) {
    partId = req.query.partId;
  }

  var angleTolerance = '';
  var chordTolerance = '';
  if (req.query.angleTolerance && req.query.chordTolerance) {
    angleTolerance = req.query.angleTolerance;
    chordTolerance = req.query.chordTolerance;
  }

  getStl(unescape(req.query.server), req.body.binary === 'true',
      req.query.documentId, req.query.stlElementId,
      req.query.workspaceId, partId, angleTolerance, chordTolerance,
      req.cookies.onshapeSessionId,
      function(success, data) {
        res.send(data);
      });
};

exports.getElements = function(req, res) {

  getElementList(unescape(req.query.server), req.query.documentId,
      req.cookies.onshapeSessionId, function(success, data) {
        callback(req, res, success, data);
      });
};

exports.getParts = function(req, res) {
  getPartsList(unescape(req.query.server), req.query.documentId, req.query.workspaceId,
      req.cookies.onshapeSessionId, function(success, data) {
        callback(req, res, success, data);
      });
};

function callback(req, res, success, data) {
  if (!success) {
    var search = url.parse(req.url).search;
    res.status(404);
    return res.send();
  }
  res.send(data);
}
