var request = require('request');

/*
 * A class which encapsulates communication with Onshape's REST API.
 */
function OnshapeApi() {
  /*
   * Log in a user with the Onshape API
   * @param server {String} The path to the onshape server. Must be unescaped.
   * @param username {String} The username of the user (email address)
   * @param password {String} The password of the user
   * @param callback {function(Boolean, String)} The first argument is
   * true if the Onshape servers report that the login succeeded. The
   * second argument is the cookie/session id returned by the Onshape API.
   * It is null if the login failed.
   */
  this.login = function(server, username, password, totp, callback) {
    var login_data = JSON.stringify({
      'email' : username,
      'password' : password,
      'totp' : totp
    });

    var options = {
      pool: false,
      url: server + '/api/users/session',
      method: 'POST',
      body: login_data,
      headers: {
                'Content-Type': 'application/json',
                'Content-Length': login_data.length
              }
    };
    request(options, function(error, http_res, body) {
      if (http_res.statusCode === 200) {
        callback(true, http_res.headers['set-cookie'], false);
      } else {
        if (http_res.headers['www-authenticate'] === 'OTP') {
          callback(false, null, true);  
        } else {
          callback(false, null, false);
        }
      }
    });
  };

  /*
   * Checks whether logged into Onshape.
   * @param server {String} The path to the onshape server. Must be unescaped.
   * @param onshapeSessionId The id associated with this session.
   * @param {function(Boolean)} Called with a value of true if logged in. 
   * Called with a value of false otherwise.
   */
  this.isLoggedIn = function(server, onshapeSessionId, callback) {
    if (!onshapeSessionId) {
      return callback(false);
    }

    var options = {
      pool: false,  
      url: server + '/api/users/session',
      method: 'GET',
      headers: {
                'Cookie' : onshapeSessionId
              }
    };
    request(options, function(error, http_res, body) {
      callback(http_res.statusCode === 200);
    });
  };

  /*
   * Get a list of all documents on a user's account.
   * @param server {String} The path to the onshape server. Must be unescaped.
   * @param onshapeSessionId {String} The sessions id of the user, that is
   * the cookie returned by the Onshape API.
   * @param callback {function(Boolean, String)} The callback is called if the
   * request fails or when the doucments are retrieved. The first argument is
   * true if request was successful, false if not. 
   * The second argument is a JSON object as a string. The JSON object
   * contains the documents. (The JSON object be retrieved with JSON.parse.)
   * The second argument is null if the request was not successful.
   */
  this.getDocumentList = function(server, onshapeSessionId, callback) {
    var options = {
      pool: false,
      url: server + '/api/documents',
      method: 'GET',
      headers: {
                'Cookie' : onshapeSessionId
              }
    };
    request(options, function(error, http_res, body) {
      if (http_res.statusCode !== 200) {
        return callback(false, null);
      }
      return callback(true, body);
    });
  };

  /*
   * Get a list of all elements in a document.
   * @param server {String} The path to the onshape server. Must be unescaped.
   * @param documentId {String} The ID of the document from which to retrieve elements.
   * @param onshapeSessionId {String} The sessions id of the user, that is
   * the cookie returned by the Onshape API.
   * @param callback {function(Boolean, String)} The callback is called if the
   * request fails or when the elements are retrieved. The first argument is
   * true if request was successful, false if not.
   * The second argument is a JSON object as a string. The JSON object
   * contains the elements. (The JSON object be retrieved with JSON.parse.)
   * The second argument is null if request was not successful.
   */
  this.getElementList = function(server, documentId, onshapeSessionId, callback) {
    var options = {
      pool: false,
      url: server + '/api/documents/' + documentId + '/elements',
      method: 'GET',
      headers: {
                'Cookie' : onshapeSessionId
              }
    };
    request(options, function(error, http_res, body) {
      if (http_res.statusCode !== 200) {
        return callback(false, null);
      }
      return callback(true, body);
    });
  };

  /*
   * Get a list of all parts in a document.
   * @param server {String} The path to the onshape server. Must be unescaped.
   * @param documentId {String} The ID of the document from which to retrieve parts.
   * @param workspace {String} The ID of the workspace in which the document is located.
   * @param onshapeSessionId {String} The sessions id of the user, that is
   * the cookie returned by the Onshape API.
   * @param callback {function(Boolean, String)} The callback is called if the
   * request fails or when the elements are retrieved. The first argument is
   * true if request was successful, false if not.
   * The second argument is a JSON object as a string. The JSON object
   * contains the elements. (The JSON object be retrieved with JSON.parse.)
   * The second argument is null if request was not successful.
   */
  this.getPartsList = function(server, documentId, workspaceId, onshapeSessionId, callback) {
    var options = {
      pool: false,
      url: server + '/api/parts/' + documentId + '/workspace/' + workspaceId,
      method: 'GET',
      headers: {
                'Cookie' : onshapeSessionId
              }
    };
    request(options, function(error, http_res, body) {
      if (http_res.statusCode !== 200) {
        return callback(false, null);
      }
      return callback(true, body);
      
      var parts = '';
      http_res.on('data', function(chunk) {
        parts += chunk;
      });
      http_res.on('end', function() {
        callback(true, parts);
      });
    });
  }

  /*
   * Get the STL representation of an element.
   * @param server {String} The path to the onshape server. Must be unescaped.
   * @param binary {Boolean} A value specifying whether the output STL should
   * be binary or ASCII. A value of true returns a binary STL. A value of false
   * returns an ASCII STL.
   * @param documentId {String} The ID of the document in which the element is located.
   * @param elementId {String} The ID of the element.
   * @param workspace {String} The ID of the workspace in which the element is located.
   * @param partId {String} The ID of the part to load. Set to the empty string ('') to
   * load the entire element.
   * @param onshapeSessionId {String} The sessions id of the user, that is
   * the cookie returned by the Onshape API.
   * @param callback {function(Boolean, String)} The callback is called if the
   * request fails or when the STL string is retrieved. The first argument is
   * true if the request was successful, false if not.
   * The second argument is the STL string. The second argument is null if the
   * request failed.
   */
  this.getStl = function(server, binary, documentId, elementId, workspaceId, partId,
                         angleTolerance, chordTolerance, onshapeSessionId, callback) {
    var url = server + '/api/documents/' + documentId + '/export/' + elementId +
              '?workspaceId=' + workspaceId +
              '&format=STL&mode=' + (binary ? 'binary' : 'text') + 
              '&scale=1&units=inch';
    if (partId !== '') {
      url += '&partId=' + partId;
    }
    if (angleTolerance !== '' && chordTolerance !== '') {
      url += '&angleTolerance=' + angleTolerance +'&chordTolerance=' + chordTolerance;
    }

    var options = {
      pool: false,
      url: url,
      method: 'GET',
      encoding: null,
      headers: {
        'Cookie' : onshapeSessionId
      }
    };

    request(options, function(error, res, body) {
      if (res.statusCode !== 200) {
        return callback(false, null);
      }
      var stlData;
      if (binary) {
        stlData = body.toString('base64');
      } else {
        stlData = body.toString();
      }
      return callback(true, stlData);
    });
  };
}

module.exports = OnshapeApi;