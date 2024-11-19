/*import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { preloadedModels } from './preload_plane_detection_models.js';

// XR globals.
let xrButton = document.getElementById('ar-start');
let XRSession: XRSession | null = null;
let XRReferenceSpace: XRReferenceSpace | null = null;
let XRHitTestSource: XRHitTestSource | null = null;
let viewerSpace = null;

// WebGL scene globals.
let gl: WebGL2RenderingContext | null = null;

// Three.js scene globals.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();
camera.add(listener);
let renderer: THREE.WebGLRenderer;
let reticle = new THREE.Object3D();
let canvas;
let mainObject = new THREE.Object3D();
let mixer: THREE.AnimationMixer | undefined;
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

// Main script globals.
let animationArray = [] as THREE.AnimationAction[];
let interactObjects = [] as THREE.Object3D[];
let interactMapAudio = {} as { [key: string]: THREE.Audio };
let reticleIsActive = false;
let textObjectToLookAt: THREE.Object3D | undefined = new THREE.Object3D();
let cameraWorldPosition = new THREE.Vector3();

function checkSupportedState() {
  navigator.xr!.isSessionSupported('immersive-ar').then((supported) => {
    if (supported) {
      xrButton!.innerHTML = 'Comenzar AR';
      console.log("WebXR supported");
    } else {
      xrButton!.innerHTML = 'AR no soportado';
      console.log("WebXR not supported navigator.xr.isSessionSupported");
    }

    (xrButton as HTMLButtonElement).disabled = !supported;
  });
}

function initXR() {
  if (!window.isSecureContext) {
    console.error("WebXR unavailable due to insecure context");
  }
  if (navigator.xr) {
    xrButton!.addEventListener('click', onButtonClicked);
    navigator.xr.addEventListener('devicechange', checkSupportedState);
    checkSupportedState();
  } else {
    console.error("WebXR not available navigator.xr");
  }
}

function onButtonClicked() {
  if (!XRSession) {
    // Ask for an optional DOM Overlay, see https://immersive-web.github.io/dom-overlays/
    if (new URLSearchParams(window.location.search).get('UI') == null) //not sending UI in url params disables dom overlay
    {
      navigator.xr!.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
      }).then(onSessionStarted, onRequestSessionError);
    }
    else {
      navigator.xr!.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.getElementById('overlay')! }
      }).then(onSessionStarted, onRequestSessionError);
      const exitButton = document.getElementById('ar-exit');
      exitButton!.style.display = 'block';
      exitButton!.onclick = () => { XRSession!.end(); };
    }
  } else {
    console.log("Ending session");
    XRSession.end();
  }
}

function onSessionStarted(session: XRSession) {
  XRSession = session;
  session.addEventListener('end', onSessionEnded);
  if (document.getElementById("canvas")) {
    canvas = document.getElementById("canvas");
  } else {
    canvas = document.createElement("canvas");
    canvas.id = "canvas";
  }
  document.body.appendChild(canvas);

  gl = (canvas as HTMLCanvasElement).getContext('webgl2', {
    xrCompatible: true
  });

  //#region Three.js
  scene.add(new THREE.AmbientLight(0xbcc2c2, 1));// soft white light
  scene.add(new THREE.DirectionalLight(0xffffff, 1));

  // Set up the WebGLRenderer, which handles rendering to the session's base layer.
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    preserveDrawingBuffer: true,
    canvas: canvas,
    context: gl
  });
  renderer.autoClear = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  // The API directly updates the camera matrices.
  // Disable matrix auto updates so three.js doesn't attempt
  // to handle the matrices independently.
  camera.matrixAutoUpdate = false;

  //setLighting();

  if (preloadedModels["reticle"]) {
    reticle = preloadedModels["reticle"].scene;
    reticle.visible = false;
    scene.add(reticle);
    reticleIsActive = true;
  }

  if (preloadedModels["mainObject"]) {
    SetupMainObject();
    session.addEventListener("select", SelectEvent);
  }
  //#endregion

  //#region WebXR setup
  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
  session.requestReferenceSpace('local').then((refSpace) => {
    XRReferenceSpace = refSpace;
    console.log("Local reference space created");

    // Request the viewer reference space after the local reference space is created
    return session.requestReferenceSpace('viewer');
  }).then((viewerRefSpace) => {
    viewerSpace = viewerRefSpace;
    console.log("Viewer space created");

    // Request the hit test source after the viewer reference space is created
    return session.requestHitTestSource({ space: viewerSpace });
  }).then((viewerHitTestSource) => {
    XRHitTestSource = viewerHitTestSource;
    console.log("Hit test source created");

    // Request the animation frame after the hit test source is created
    session.requestAnimationFrame(onXRFrame);
  }).catch((err) => {
    console.error("An error occurred during WebXR setup:", err);
  });
  //#endregion
}

function onRequestSessionError(ex: any) {
  alert("Failed to start immersive AR session.");
  console.error(ex.message);
}

function onEndSession(session: XRSession) {
  session.end();
  console.log("onEndSession");
}

function onSessionEnded(event: any) {
  XRSession = null;
  xrButton.innerHTML = 'Iniciar AR';
  document.getElementById('ar-exit').style.display = "none";
  gl = null;
  ResetAR();
  console.log("onSessionEnded");
}

function onXRFrame(time: DOMHighResTimeStamp, frame: XRFrame) {
  // Queue up the next draw request.
  XRSession.requestAnimationFrame(onXRFrame);

  // Bind the graphics framebuffer to the baseLayer's framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, XRSession.renderState.baseLayer.framebuffer)

  // Retrieve the pose of the device.
  // XRFrame.getViewerPose can return null while the XRSession attempts to establish tracking.
  const pose = frame.getViewerPose(XRReferenceSpace);
  if (pose) {
    // In mobile AR, we only have one view.
    const view = pose.views[0];

    const viewport = XRSession.renderState.baseLayer.getViewport(view);
    renderer.setSize(viewport.width, viewport.height);

    // Use the view's transform matrix and projection matrix to configure the THREE.camera.
    camera.matrix.fromArray(view.transform.matrix)
    camera.projectionMatrix.fromArray(view.projectionMatrix);
    camera.updateMatrixWorld(true);

    if (reticleIsActive) {
      const XRHitTestResult = frame.getHitTestResults(XRHitTestSource);
      if (XRHitTestResult.length > 0 && reticle) {
        const hitPose = XRHitTestResult[0].getPose(XRReferenceSpace);
        reticle.visible = true;
        reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z)
        reticle.updateMatrixWorld(true);
      }
    }
  }

  if (mixer) mixer.update(clock.getDelta());
  if (textObjectToLookAt){
    textObjectToLookAt.lookAt(cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld));
  }
  renderer.render(scene, camera)
}

initXR();

function SelectEvent(event: { frame: any; inputSource: { targetRaySpace: any; }; }) {

  if (reticle.visible) {
    reticle.visible = false;
    reticleIsActive = false;
    mainObject.visible = true;
    mainObject.position.copy(reticle.position);
  }

  if (!mainObject.visible) return;

  // Get the pose of the input source
  const frame = event.frame;
  const referenceSpace = event.inputSource.targetRaySpace;
  const pose = frame.getPose(referenceSpace, XRReferenceSpace);

  if (pose) {
    let touchDir = new THREE.Vector3();

    const inputSourcePosition = pose.transform;
    touchDir.set(0, 0, -1);
    touchDir.applyQuaternion(inputSourcePosition.orientation);

    const touchPos = inputSourcePosition.position;

    // Convert the position to normalized device coordinates
    /*touchPos.x = (inputSourcePosition.x / window.innerWidth) * 2 - 1;
    touchPos.y = -(inputSourcePosition.y / window.innerHeight) * 2 + 1;

    scene.updateMatrixWorld(true);

    // Update the raycaster with the camera and touch position
    raycaster.setFromCamera(touchPos, camera);

    //camera.getWorldDirection(raycaster.ray.direction);
    //raycaster.ray.origin = touchPos;
    raycaster.ray.direction = touchDir;

    // Remove the previous line if it exists
    if (scene.getObjectByName('rayLine')) {
      scene.remove(scene.getObjectByName('rayLine'));
    }

    // Find intersected objects
    const intersects = raycaster.intersectObjects(interactObjects, true);
    if (intersects.length > 0 &&
        intersects[0].object.name.includes('INTERACT_')
        )
     {
      const object = intersects[0].object;

      //play audio with name
      if (interactMapAudio[object.name] &&
        !interactMapAudio[object.name].isPlaying) {
        StopAllAudios();
        interactMapAudio[object.name].play();
      }

      //hide selected INTERACT object
      interactObjects.forEach(element => {
        if (element.name === object.name) {
          ((element as THREE.Mesh).material as THREE.MeshStandardMaterial).visible = false;
        } else {
          ((element as THREE.Mesh).material as THREE.MeshStandardMaterial).visible = true;
          element.children.forEach(child => {
            if (child.name.includes("TEXT")) {
              child.visible = false;
            }
          });
        }
      });

      animationArray.forEach((animAction) => {
        animAction.stop();
      });
      //play animation with name
        const children = object.children;
        children.forEach(child => {
          animationArray.forEach((animAction) => {
            if (animAction.getClip().name === child.name)
              animAction.play();
          });
        });
      //}

      //find the "TEXT" object on object.name.children and make it to look at the camera
      object.children.forEach(child => {
        if (child.name.includes("TEXT")) {
          child.visible = true;
          textObjectToLookAt = child;
        }
      });
    }

    // Visualize the raycaster
    /*const rayOrigin = raycaster.ray.origin;
    const rayDirection = raycaster.ray.direction.clone().multiplyScalar(10); // Extend the direction for visualization
    const points = [rayOrigin, rayOrigin.clone().add(rayDirection)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.Line(geometry, material);
    line.name = 'rayLine';
    scene.add(line);
  }
}

function SetupMainObject() {
  mainObject = preloadedModels["mainObject"].scene;
  scene.add(mainObject);
  mainObject.visible = false;

  //download audio
  mainObject.children.forEach(element => {
    //setup for interact objects
    if (element.name.includes('INTERACT_')) {
      //add to interactObjects array all objects that have the name INTERACT_
      if (interactObjects.find((obj) => obj.name === element.name) == null)
        interactObjects.push(element);
      //load audio for each object
      if (interactMapAudio[element.name] == null){
        audioLoader.load('./audio/' + element.userData["audio_name"] + '.mp3', (buffer) => {
          const audio = new THREE.Audio(listener);
          audio.setBuffer(buffer);
          audio.setLoop(true);
          audio.setVolume(0.5);
          console.log("Audio loaded for " + element.name);
          interactMapAudio[element.name] = audio;
        }, undefined, (error) => {
          console.error(error);
        });
      }
    }

    //setup for global objects
    /*if (element.name.includes('GlobalAnimations')) {
      //load audio for each object as a positional audio
      element.children.forEach(child => {
        audioLoader.load('public/assets/audio/' + child.userData["audio_name"] + '.mp3', (buffer) => {
          const audio = new THREE.PositionalAudio(listener);
          audio.setBuffer(buffer);
          audio.setRefDistance(1);
          audio.setLoop(true);
          audio.setRolloffFactor(2); // How quickly the sound attenuates
          audio.setDistanceModel('linear'); // Linear attenuation
          console.log("Positional audio loaded for " + child.name);
          const helper = new PositionalAudioHelper( audio, 0.1 );
          audio.add(helper);
          child.add(audio);
          audio.play();
        }, undefined, (error) => {
          console.error(error);
      });
      });
    }
  });

  //hide all "TEXT" children objects
  interactObjects.forEach(element => {
    const children = element.children;
    children.forEach(child => {
      if (child.name.includes("TEXT")) {
        child.visible = false;
      };
    }
  )});

  mixer = new THREE.AnimationMixer(mainObject);
  let localVariableAnimationClips = [] as THREE.AnimationClip[];
  preloadedModels["mainObject"].animations.forEach((clip: THREE.AnimationClip) => {
    //autoplay all animation that starts with "GLOBAL_"
    if (clip.name.includes("GLOBAL_")) {
      localVariableAnimationClips.push(clip);
      mixer.clipAction(clip).play().setLoop(THREE.LoopRepeat, Infinity);
    }

    //populate animationArray with all animations if not already there excluding GLOBAL_
    if (!animationArray.find(action => action.getClip().name === clip.name) &&
    localVariableAnimationClips.find(action => action === clip) == undefined) {
      animationArray.push(mixer.clipAction(clip));
    }    
  });
}

function setLighting() {
  new RGBELoader()
    .setPath('https://threejs.org/examples/textures/equirectangular/')
    .load('royal_esplanade_1k.hdr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.background = texture;
      scene.environment = texture;
    });
}

function ResetAR(){
  scene.remove(mainObject);
  StopAllAudios();
  reticleIsActive = false;
  textObjectToLookAt = undefined;
  mixer.stopAllAction();
  interactObjects.forEach(element => {
      ((element as THREE.Mesh).material as THREE.MeshStandardMaterial).visible = true;
  });
}

function StopAllAudios() {
  for (const key in interactMapAudio) {
    if (interactMapAudio.hasOwnProperty(key)) {
      const audio = interactMapAudio[key];
      if (audio.isPlaying) {
        audio.stop();
      }
    }
  }
}*/