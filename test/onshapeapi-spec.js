var OnshapeApi = require('../routes/onshapeapi');
var onshape = new OnshapeApi();

var validUsername = 'bmattinson@onshape.com';
var validPassword = '!@#123QWEqwe';
var server = "http://localhost:8080";

var onshapeCookie = '';
var sentLoginReq = false;
function tryLogin() {
  if (!sentLoginReq) {
    onshape.login(server, validUsername, validPassword, function(success, cookie) {
      onshapeCookie = cookie;
    });
    sentLoginReq = true;
  }
}

var firstDocumentId = '';
var firstWorkspaceId = '';
var sentDocumentIdRequest = false;
function getFirstDocumentId(cookie) {
  if(!sentDocumentIdRequest) {
    onshape.getDocumentList(server, cookie, function(success, documents) {
      expect(success).toBe(true);
      if (documents !== null && documents.length > 0) {
        var jsonDocs = JSON.parse(documents);
        firstDocumentId = jsonDocs.items[0].id;
        firstWorkspaceId = jsonDocs.items[0].defaultWorkspace.id;
      }
    });
  }
  sentDocumentIdRequest = true;
}

var firstPartStudioElementId = '';
var sentElementIdRequest = false;
function getFirstPartStudioElementId(documentId, cookie) {
  if (!sentElementIdRequest) {
    onshape.getElementList(server, documentId, cookie, function(success, elements) {
      expect(success).toBe(true);
      if (elements !== null) {
        var jsonElements = JSON.parse(elements);
        for (var i = 0; i < jsonElements.length; ++i) {
          if (jsonElements[i].type === "Part Studio") {
            firstPartStudioElementId = jsonElements[i].id;
            break;
          }
        }
      }
    });
  }
  sentElementIdRequest = true;
}

var firstPartId = '';
var sentPartIdRequest = false;
function getFirstPartId(documentId, workspaceId, cookie) {
  if (!sentPartIdRequest) {
    onshape.getPartsList(server, documentId, workspaceId, cookie, function(success, parts) {
      expect(success).toBe(true);
      if (parts !== null) {
        var jsonParts = JSON.parse(parts);
        for (var i = 0; i < jsonParts.length; ++i) {
          if (jsonParts[i]["elementId"] === firstPartStudioElementId) {
            firstPartId = jsonParts[i]["id"];
            break;
          }
        }
      }
    });
  }
}

describe("Testing login function", function() {
  it("Testing login with invalid username", function() {
    var callbackDone = false;
    onshape.login(server, 'bmattinson@onshape.com', 'w93nfn39nd', function(success, cookie) {
      expect(success).toBe(false);    
      expect(cookie).toBe(null);
      callbackDone = true;
    });

    waitsFor(function() {
      return callbackDone;
    }, "login should execute callback", 1000);

  });

  it("Testing login with invalid password", function() {
    var callbackDone = false; 
    onshape.login(server, validUsername, 'w93nfn39nd', function(success, cookie) {
      expect(success).toBe(false);    
      expect(cookie).toBe(null);
      callbackDone = true;
    });

    waitsFor(function() {
      return callbackDone;
    }, "login should execute callback", 1000);
  });

  it("Testing login with valid username and password", function() {
    var callbackDone = false;  
    onshape.login(server, validUsername, validPassword, function(success, cookie) {
      expect(success).toBe(true);    
      expect(cookie).not.toBe(null);
      callbackDone = true;
    });

    waitsFor(function() {
      return callbackDone;
    }, "login should execute callback", 1000);
  });
});

describe("Testing isLoggedIn", function() {
  it("Testing testLoggedIn with no cookie", function() {
    var callbackDone = false;
    onshape.isLoggedIn(server, null, function(loggedIn) {
      expect(loggedIn).toBe(false);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "isLoggedIn should execute callback", 1000);
  });

  it("Testing isLoggedIn with wrong cookie", function() {
    var callbackDone = false;
    onshape.isLoggedIn(server, 'asdf', function(loggedIn) {
      expect(loggedIn).toBe(false);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "isLoggedIn should execute callback", 1000);
  });

  it("Testing isLoggedIn when logged in", function() {
    // log user in first
    var callbackDone = false;
    waitsFor(function() {
      tryLogin();
      return onshapeCookie !== '';
    }, "login should execute callback", 1000);

    // encapsulate in runs or does not wait
    runs(function(){
      callbackDone = false;
      onshape.isLoggedIn(server, onshapeCookie, function(loggedIn) {
        expect(loggedIn).toBe(true);
        callbackDone = true;
      });
    });
    waitsFor(function() {
      return callbackDone;
    }, "isLoggedIn should execute callback", 1000);
  });
});

describe("Testing getDocumentList", function() {
  it("Testing getting documents when not logged in", function() {
    var callbackDone = false;
    onshape.getDocumentList(server, null, function(success, docs) {
      expect(success).toBe(false);
      expect(docs).toBe(null);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "getDocumentList should execute callback", 1000);
  });

  it("Testing getting documents when logged in", function() {
    // log user in first
    var callbackDone = false;
    waitsFor(function() {
      tryLogin();
      return onshapeCookie !== '';
    }, "login should execute callback", 1000);

    // encapsulate in runs or does not wait
    runs(function() {
      callbackDone = false;
      onshape.getDocumentList(server, onshapeCookie, function(success, docs) {
        expect(success).toBe(true);
        expect(docs).toEqual(jasmine.any(String));
        expect(JSON.parse(docs)).toEqual(jasmine.any(Object));
      });
    });
  });
});

describe("Testing getElementList", function() {
  it("Testing getting elements when not logged in", function() {
    var callbackDone = false;
    onshape.getElementList(server, 3, null, function(success, elements) {
      expect(success).toBe(false);
      expect(elements).toBe(null);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "getElementList should execute callback", 1000);
  });
  it("Testing getting elements when logged in with invalid documentId", function() {
    // log user in first
    waitsFor(function() {
      tryLogin();
      return onshapeCookie !== '';
    }, "login should execute callback", 1000);

    var callbackDone = false;
    onshape.getElementList(server, 3, onshapeCookie, function(success, elements) {
      expect(success).toBe(false);
      expect(elements).toBe(null);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "getElementList should execute callback", 1000);
  });
  it("Testing getting elements when logged in with valid documentId", function() {
    // log user in first
    var callbackDone = false;
    var onshapeDocs = [];

    waitsFor(function() {
      tryLogin();
      return onshapeCookie !== '';
    }, "login should execute callback", 1000);

    runs(function() {
      onshape.getDocumentList(server, onshapeCookie, function(success, docs) {
        onshapeDocs = JSON.parse(docs);
        callbackDone = true;
      });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getDocumentList should execute callback", 1000);

    runs(function() {
      callbackDone = false;
      onshape.getElementList(server, onshapeDocs.items[0].id, onshapeCookie, function(success, elements) {
        expect(success).toBe(true);
        expect(elements).toEqual(jasmine.any(String));
        expect(JSON.parse(elements)).toEqual(jasmine.any(Object));
        callbackDone = true;
      });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getElementList should execute callback", 1000);
  });
});

function waitForIds() {
  waitsFor(function() {
    tryLogin();  
    return onshapeCookie !== '';
  }, "could not retrieve onshapeCookie", 1000);
  waitsFor(function() {
    getFirstDocumentId(onshapeCookie);
    return firstDocumentId !== '';
  }, "could not retrieve firstDocumentId", 1000);
  waitsFor(function() {
    getFirstPartStudioElementId(firstDocumentId, onshapeCookie);
    return firstPartStudioElementId !== '';
  }, "could not retrieve firstPartStudioElementId", 1000);
  waitsFor(function() {
    getFirstPartId(firstDocumentId, firstWorkspaceId, onshapeCookie);
    return firstPartId !== '';
  }, "could not retrieve firstPartId", 1000);
}

describe("Testing getPartsList", function() {
  it("Testing getting parts when not logged in", function() {
    var callbackDone = false;
    onshape.getPartsList(server, 3, 7, null, function(success, elements) {
      expect(success).toBe(false);
      expect(elements).toBe(null);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "getPartsList should execute callback", 1000);
  });
  it("Testing getting parts when logged in with all invalid IDs", function() {
    // log user in first
    waitsFor(function() {
      tryLogin();
      return onshapeCookie !== '';
    }, "login should execute callback", 1000);

    var callbackDone = false;
    onshape.getPartsList(server, 3, 7, onshapeCookie, function(success, elements) {
      expect(success).toBe(false);
      expect(elements).toBe(null);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "getPartsList should execute callback", 1000);
  });
  it("Testing getting parts when logged in with valid IDs", function() {
    // log user in first
    var callbackDone = false;
    var onshapeDocs = [];

    waitsFor(function() {
      tryLogin();
      return onshapeCookie !== '';
    }, "login should execute callback", 1000);

    waitForIds();

    runs(function() {
      callbackDone = false;
      onshape.getPartsList(server, firstDocumentId, firstWorkspaceId, onshapeCookie, function(success, elements) {
        expect(success).toBe(true);
        expect(elements).toEqual(jasmine.any(String));
        expect(JSON.parse(elements)).toEqual(jasmine.any(Object));
        callbackDone = true;
      });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getPartsList should execute callback", 1000);
  });
});

describe("Testing getStl", function() {
  it("Testing getStl when not logged in with all invalid IDs", function() {
    var callbackDone = false;
    onshape.getStl(server, false, '239', '242042', '23823', '', '', '', null, function(success, stlData) {
      expect(success).toBe(false);
      expect(stlData).toBe(null);
      callbackDone = true;
    });
    waitsFor(function() {
      return callbackDone;
    }, "getStl should execute callback", 1000);
  });

  it("Testing getStl when not logged in with correct IDs", function() {
    // Get IDs first
    waitForIds();

    var callbackDone = false;
    runs(function() {
      onshape.getStl(server, false, firstDocumentId, firstPartStudioElementId, firstWorkspaceId, '', '', '',
          null, function(success, stlData) {
        expect(success).toBe(false);
        expect(stlData).toBe(null);
        callbackDone = true;
      });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getStl should execute callback", 1000);
  });

  it("Testing getStl when logged in with all invalid IDs", function() {
    waitsFor(function() {
      tryLogin();
      return onshapeCookie !== '';
    });

    var callbackDone = false;
    runs(function() {
      onshape.getStl(server, false, '248', '29393', '23942', '', '', '', onshapeCookie, function(success, stlData) {
        expect(success).toBe(false);
        expect(stlData).toBe(null);
        callbackDone = true;
      });
      waitsFor(function() {
        return callbackDone;
      }, "getStl should execute callback", 1000);
    });
  });

  it("Testing getStl with correct parameters for ASCII", function() {
    // get IDs
    waitForIds();

    var callbackDone = false;
    runs(function() {
      onshape.getStl(server, false, firstDocumentId, firstPartStudioElementId, firstWorkspaceId, '', '', '',
          onshapeCookie, function(success, stlData) {
        expect(success).toBe(true);
        expect(stlData).toEqual(jasmine.any(String));
        callbackDone = true;
      });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getStl should execute callback", 5000);
  });

  it("Testing getStl with correct parameters for binary", function() {
    // get IDs
    waitForIds();

    var callbackDone = false;
    runs(function() {
      onshape.getStl(server, true, firstDocumentId, firstPartStudioElementId, firstWorkspaceId, '', '', '',
          onshapeCookie, function(success, stlData) {
        expect(success).toBe(true);
        expect(stlData).toEqual(jasmine.any(String));

        // Should do the test below, but it exceeds the call stack size
        // expect(/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/.test(stlData)).toBe(true);
        callbackDone = true;
      });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getStl should execute callback", 5000);
  });

  it("Testing getting ASCII part with getStl", function() {
    waitForIds();

    var callbackDone = false;
    runs(function() {
      onshape.getStl(server, false, firstDocumentId, firstPartStudioElementId, firstWorkspaceId, 
        firstPartId, '', '', onshapeCookie, function(success, stlData) {
          expect(success).toBe(true);
          expect(stlData).toEqual(jasmine.any(String));
          callbackDone = true;
        });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getStl should execute callback", 5000);
  });

  it("Testing getting binary part with getStl", function() {
    waitForIds();

    var callbackDone = false;
    runs(function() {
      onshape.getStl(server, true, firstDocumentId, firstPartStudioElementId, firstWorkspaceId, 
        firstPartId, '', '', onshapeCookie, function(success, stlData) {
          expect(success).toBe(true);
          expect(stlData).toEqual(jasmine.any(String));
          callbackDone = true;
        });
    });
    waitsFor(function() {
      return callbackDone;
    }, "getStl should execute callback", 5000);
  });
});