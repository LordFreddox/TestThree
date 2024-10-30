import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
//import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap';
// Crear la escena, cámara y renderer
const playButton = (document.getElementById('boton') as HTMLFormElement);
const logo = (document.getElementById('logo') as HTMLFormElement);
var targetOrigin:string;
//var buttonPosition = new THREE.Vector3(80, 10, 0);
//var centerPosition = new THREE.Vector3(0.1, -1, 0);
//var originPointIn3D= new THREE.Vector3(0.1, 2, -5);
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.localClippingEnabled = true // Habilitar clipping
document.body.appendChild(renderer.domElement)
let mixer: THREE.AnimationMixer


const controls = new OrbitControls(camera, renderer.domElement)
camera.position.set(0, 2, 5)
controls.update()

const messageToFlutter = {
  origin_scene: 'avatar', //avatar
  action: 'actionName',
  payLoad: ''
};

// Enum for scene actions
const SceneAction = {
  OnSceneLoaded: 'OnSceneLoaded',
  SceneInitialSettings: 'SceneInitialSettings',
  StartScene: 'StartScene', //sacar mascara del boton
  StopScene: 'StopScene', //esconder mascara del boton
  GesturesCatched: 'GesturesCatched', //revicibí gestures events
};

      window.addEventListener("message", handleMessage);
      window.addEventListener("load", function () {
      updateAndSendMessage('OnSceneLoaded','');
      updateAndSendMessage(SceneAction.SceneInitialSettings,`{"left":0.03, "bottom":0.03, "width":77.06639734670358, "height":77.06639734670358, "location":"http://localhost:60901/#/563-company/brand"}`);
      });
    

var getUrlParameter = function getUrlParameter(sParam: string) {
  var sPageURL = window.location.search.substring(1), sURLVariables = sPageURL.split('&'), sParameterName, i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
  return false;
};

function handleMessage(e:any) {
  //testing, uncomment for production
  //if (e.origin === window.location.origin) { return; } //avoid getting own events

  if (isJsonString(e.data) === false) { return; }
  const message = JSON.parse(e.data);
  switch (message.action) {
      case SceneAction.SceneInitialSettings:
          //targetOrigin = message.location;
          targetOrigin= e.origin;
          //updateAndSendMessage(SceneAction.StartScene,'');
/////////////////const payload = JSON.parse(message.payLoad);
          //buttonPosition = new THREE.Vector3(payload.left, payload.bottom, 500);
          //originPointIn3D = getPointIn3DFromRelativeCoordinates(payload.left, payload.bottom);
          
          //InstantiateMask(buttonPosition.unproject(camera), centerPosition);
          break;
      case SceneAction.StartScene:
          //MoveMaskToPosition(buttonPosition, centerPosition);
          break;
      case SceneAction.StopScene:
          //MoveMaskToPosition(centerPosition, buttonPosition);
          break;
      default:
          break;
  }
}


function updateAndSendMessage(action:string, payload:string) {
  messageToFlutter.action = action;
  messageToFlutter.payLoad = payload;

  // Use "*" for targetOrigin or specify a more specific target for security
  if(targetOrigin === undefined) targetOrigin = "*";
  window.top?.postMessage(JSON.stringify(messageToFlutter), targetOrigin);
}

function isJsonString(str:string) {
  try {
    const parsed = JSON.parse(str)
    if (parsed && typeof parsed === "object") {
      return true
    }
  } catch { return false }
  return false
}

var bigSurface = String(getUrlParameter("BigSurfaceId"));
var model = bigSurface.split("-", 3); 

new RGBELoader().load('img/venice_sunset_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture
  //scene.background = texture
  scene.background = null
  //scene.backgroundBlurriness = 1
})


// Crear el plano de recorte
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // Dirección inicial del plano de recorte
const clipPlanes = [clipPlane]

new GLTFLoader().load('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/ThreeAvatarPortalTest/models/'+model[0]+'.glb', (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene)
  const action1 = mixer.clipAction(gltf.animations[0])
  const action2 = mixer.clipAction(gltf.animations[1])
  action1.setLoop(THREE.LoopOnce, 1)
  action1.clampWhenFinished = true
  action2.setLoop(THREE.LoopOnce, 1)
  action2.clampWhenFinished = true
  gltf.scene.position.set(0, 0.1, 4)

  setTimeout(() => {
    playButton.style.display = 'block'
  }, 3000)

  if (model[0] === '1105') {
    logo.style.display = 'block'
  }

  mixer.addEventListener('finished', async () => {
    console.log('La animación ha terminado')
    gsap.fromTo(
      clipPlane,
      { constant: 1}, // Comienza desde la parte inferior
      {
        constant: -5,
        duration: 5, // Ajusta esta duración para controlar la velocidad
        ease: 'power1.inOut',
        onUpdate: () => {
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material.clippingPlanes = clipPlanes
            }
          })
          renderer.render(scene, camera)
        }
      }
    )
    
  })

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material.clippingPlanes = clipPlanes
    }
  })

  scene.add(gltf.scene)

  playButton.addEventListener('click', () => {
    action1.play()
    action2.play()
    InitAudio()
    updateAndSendMessage('GesturesCatched', '')
    console.log("reproduce animación");
    playButton.style.display = 'none';
  })

  // Animar el plano de recorte de abajo hacia arriba después de cargar el modelo
  gsap.fromTo(
    clipPlane,
    { constant: -5}, // Comienza desde la parte inferior
    {
      constant: 1,
      duration: 5, // Ajusta esta duración para controlar la velocidad
      ease: 'power1.inOut',
      onUpdate: () => {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material.clippingPlanes = clipPlanes
          }
        })
        renderer.render(scene, camera)
      }
    }
  )
})

const clock = new THREE.Clock()

const animate = () => {
  const delta = clock.getDelta();
  requestAnimationFrame(animate)
  controls.update()
  if (mixer) {
    mixer.update(delta);
  }
  renderer.render(scene, camera)

}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})


function InitAudio() {
  // Create a new Audio object
  const audio = new Audio('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/ThreeAvatarFlutter/sounds/' + model[0] + '.mp3');
  
  // Set the volume
  audio.volume = 0.5;
  
  // Play the audio
  audio.play().then(() => {
    // Hide the play button once the audio starts playing
    playButton.style.display = 'none';
  }).catch((error) => {
    console.error("Error playing audio:", error);
  });
}