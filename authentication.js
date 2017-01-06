var request = require('request-promise');
var dateUtils = require('date-utils');
var passport = require('passport');
var OnshapeStrategy = require('passport-onshape').Strategy;

var oauthClientId;
var oauthClientSecret;

if (process.env.OAUTH_CLIENT_ID) {
  oauthClientId = process.env.OAUTH_CLIENT_ID;
}
if (process.env.OAUTH_CLIENT_SECRET) {
  oauthClientSecret = process.env.OAUTH_CLIENT_SECRET;
}

function init() {
  passport.serializeUser(function(user, done) {
    done(null, user);
  });
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  passport.use(new OnshapeStrategy({
      clientID: oauthClientId,
      clientSecret: oauthClientSecret,
      // Replace the callbackURL string with your own deployed servers path to handle the OAuth redirect
      callbackURL: "https://onshape-app-stl.herokuapp.com/oauthRedirect",
      authorizationURL: "https://oauth.onshape.com/oauth/authorize",
      tokenURL: "https://oauth.onshape.com/oauth/token",
      userProfileURL: "https://cad.onshape.com/api/users/current"
    },
    function(accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {

        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;

        // To keep the example simple, the user's Onshape profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the Onshape account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  ));
}

function onOAuthTokenReceived(body, req) {
  var jsonResponse;
  jsonResponse = JSON.parse(body);
  if (jsonResponse) {
    req.user.accessToken = jsonResponse.access_token;
    req.user.refreshToken = jsonResponse.refresh_token;
  }
}

var pendingTokenRefreshes = {};
function refreshOAuthToken(req, res, next) {

  if (pendingTokenRefreshes[req.session.id]) {
    return pendingTokenRefreshes[req.session.id]
  }
  var refreshToken = req.user.refreshToken;

  if (refreshToken) {
    pendingTokenRefreshes[req.session.id] = request.post({
      uri: 'https://oauth.onshape.com/oauth/token',
      form: {
        'client_id': oauthClientId,
        'client_secret': oauthClientSecret,
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken
      }
    }).then(function(body) {
      delete pendingTokenRefreshes[req.session.id];
      return onOAuthTokenReceived(body, req);
    }).catch(function(error) {
      delete pendingTokenRefreshes[req.session.id];
      console.log('Error refreshing OAuth Token: ', error);
      res.status(401).send({
        authUri: getAuthUri(),
        msg: 'Authentication required.'
      });
      throw(error);
    });
    return pendingTokenRefreshes[req.session.id];
  } else {
    return Promise.reject('No refresh_token');
  }
}

function getAuthUri() {
  return 'https://oauth.onshape.com/oauth/authorize?response_type=code&client_id=' + oauthClientId;
}

module.exports = {
  'init': init,
  'refreshOAuthToken': refreshOAuthToken,
  'getAuthUri': getAuthUri
};
