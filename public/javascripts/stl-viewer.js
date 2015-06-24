(function() {
  if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
  var container, stats;
  var camera, controls, scene, renderer;
  var loadedModels = [];
  var elementsDict;

  window.onload = function() {
    // prevent mouse clicks from going to model while dialog is open
    $('#stl-tolerance-modal').bind('click mousedown', function(e) {
      e.stopImmediatePropagation();
    });

    $('#stl-tolerance-submit').click(function() {
      deleteModels();
      var angleTolerance = $('#angle-tolerance').val();
      var chordTolerance = $('#chord-tolerance').val();
      loadStl(angleTolerance, chordTolerance);
      $('#stl-tolerance-modal').modal('hide');
    });

    init();
    loadStl(-1, -1);
    animate();
  };

  function init() {
    // Initialize Camera
    camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 1e6);
    camera.position.set(3, 3, 3); // must initialize camera position

    // Initialize Controls
    controls = new THREE.TrackballControls(camera);
    controls.minDistance = 0.5;

    // Initialize Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 0.1, 1e6);

    createLights();

    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.setClearColor( scene.fog.color, 1 );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMapEnabled = true;
    renderer.shadowMapCullFace = THREE.CullFaceBack;

    // Stats
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';

    // Add to DOM
    container = $('#stl-viewer-container');
    container.append(renderer.domElement);
    container.append( stats.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
  }

  function deleteModels() {
    for (var i = loadedModels.length - 1; i >= 0; --i) {
      scene.remove(loadedModels[i]);
      loadedModels.pop();
    }
  }

  function createLights() {
    scene.add( new THREE.AmbientLight( 0x777777 ) );
    addShadowedLight( 10, 10, 15, 0xffffff, 1.35 );
    addShadowedLight( 5, 10, -10, 0xffffff, 1 );
    addShadowedLight( -10, -5, -10, 0xffffff, 1 );
  }

  /*
   * Grab STL data from server. Information about which STL to grab is located
   * in the URL query string.
   */
  function loadStl(angleTolerance, chordTolerance) {
    var binary = false;
    var url = '/api/stl' + window.location.search;
    if (angleTolerance && chordTolerance) {
      url += '&angleTolerance=' + angleTolerance;
      url += '&chordTolerance=' + chordTolerance;
    }

    $('#stl-progress-bar').removeClass('hidden');
    $.ajax(url, {
      type: 'GET',
      data: {
        binary: binary
      },
      success: function(data) {
        if (binary) {
          // Convert base64 encoded string to Uint8Array
          var u8 = new Uint8Array(atob(data).split('').map(function(c) {
            return c.charCodeAt(0);
          }));
          // Load stl data from buffer of Uint8Array
          loadStlData(u8.buffer);
        } else {
          // ASCII
          loadStlData(data);
        }
        $('#stl-progress-bar').addClass('hidden')
      }
    });
  }

  /*
   * Load STL data using the STL loader included with three.js
   * @param data The data from the STL file.
   */
  function loadStlData(data) {
    var material = new THREE.MeshPhongMaterial({
                                                ambient: 0x555555,
                                                color: 0xAAAAAA,
                                                specular: 0x111111,
                                                shininess: 200
                                              });
    // Initialize loader
    var loader = new THREE.STLLoader();
    // Load using loader.parse rather than loader.load because we are loading
    // from data rather than from a file
    var geometry = loader.parse(data);

    // Zoom Camera to model
    THREE.GeometryUtils.center(geometry);
    geometry.computeBoundingSphere();
    fitToWindow(geometry.boundingSphere.radius);

    // Add mesh to scene
    var mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    loadedModels.push(mesh);
    scene.add(mesh);
  }

  function addShadowedLight(x, y, z, color, intensity) {
    var directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    scene.add( directionalLight );

    var d = 1;
    directionalLight.shadowCameraLeft = -d;
    directionalLight.shadowCameraRight = d;
    directionalLight.shadowCameraTop = d;
    directionalLight.shadowCameraBottom = -d;

    directionalLight.shadowCameraNear = 1;
    directionalLight.shadowCameraFar = 4;

    directionalLight.shadowMapWidth = 1024;
    directionalLight.shadowMapHeight = 1024;

    directionalLight.shadowBias = -0.005;
    directionalLight.shadowDarkness = 0.15;
  }

  function fitToWindow(boundingSphereRadius) {
    var dist = camera.aspect * boundingSphereRadius / Math.tan(camera.fov * (Math.PI / 180));

    var cameraUnitVector = camera.position.clone().normalize();
    camera.position = cameraUnitVector.multiplyScalar(dist);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
  }

  function render() {
    controls.update();
    renderer.render(scene, camera);
  }

  // Functions to support loading list of models to view ...
  function getElements() {
    var dfd = $.Deferred();
    $.ajax('/api/elements'+ window.location.search, {
      dataType: 'json',
      type: 'GET',
      success: function(data) {
        addElements(data, dfd);
      },
      error: function() {
        console.log('An error occurred whilst GETing elements');
      }
    });
    return dfd.promise();
  }

  function getParts() {
    var dfd = $.Deferred();
    $.ajax('/api/parts' + window.location.search, {
      dataType: 'json',
      type: 'GET',
      success: function(data) {
        addParts(data, dfd, elementsDict);
      },
      error: function() {
        console.log('An error occurred whilst GETing parts.');
      }
    });
    return dfd.promise();
  }

  function addElements(data, dfd) {
    console.log('adding elements');
    var onshapeElements = $("#onshape-elements");
    onshapeElements.empty();
    for (var i = 0; i < data.length; ++i) {
      if (data[i].type === "Part Studio") {
        // URL must contain query string!
        // (Query string contains document and workspace information)
        var href = "/viewstl" + window.location.search + "&stlElementId=" + data[i].id;

        $("#elt-select2").append("<option href='" + href + "'>" + "Element - " + data[i].name + "</option>")
      }
    }

    elementsDict = createElementsDict(data);
    dfd.resolve();
  }

  function createElementsDict(elementsArray) {
    dict = {};
    for (var i = 0; i < elementsArray.length; ++i) {
      dict[elementsArray[i]["id"]] = elementsArray[i];
    }
    return dict;
  }

  function addParts(data, dfd, elementsDict) {
    data.sort(function(a, b) {
      var key1 = a["elementId"];
      var key2 = b["elementId"];
      if (key1 < key2) {
        return -1;
      } else if (key1 > key2) {
        return 1;
      } else {
        return 0;
      }
    });

    var onshapePartsContainer = $('#onshape-parts-container');
    onshapePartsContainer.empty();

    var prevElementId = null;
    var partList = null;
    for (var i = 0; i < data.length; ++i) {
      var elementId = data[i]["elementId"];
      var partId = data[i]["id"];
      if (prevElementId === null || elementId != prevElementId) {
        partListId = createPartList(onshapePartsContainer, elementId,
            elementsDict[elementId]["name"]);
        partList = $('#' + partListId);
        prevElementId = elementId;
      }
      var href = "/viewstl" + window.location.search + "&stlElementId=" +
          elementId + "&partId=" + partId;
      $("#elt-select2")
          .append(
          "<option href='" + href + "'>" + "Part -" + data[i].name + "</option>"
      )

    }

    dfd.resolve();
  }

  function createPartList(partsContainer, elementId, elementName) {
    var partListId = 'onshape-parts-' + elementId;
    partsContainer.append("<div class='panel-heading'><h3 class='panel-title'>" +
    escapeString(elementName) + "</h3></div>");
    partsContainer.append("<div class='list-group' id='" + partListId + "'></div>");
    return partListId;
  }

  function escapeString(string) {
    return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
