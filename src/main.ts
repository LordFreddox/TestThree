
import './style.css'
import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as TWEEN from '@tweenjs/tween.js';
//import Stats from 'three/addons/libs/stats.module.js'
const playButton = (document.getElementById('boton') as HTMLFormElement);
var targetOrigin:string;
//var buttonPosition = new THREE.Vector3(80, 10, 0);
var centerPosition = new THREE.Vector3(0.1, -1, 0);
var originPointIn3D= new THREE.Vector3(0, 0, 0);


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
    

const scene = new THREE.Scene()

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
          const payload = JSON.parse(message.payLoad);
          //buttonPosition = new THREE.Vector3(payload.left, payload.bottom, 500);
          originPointIn3D = getPointIn3DFromRelativeCoordinates(payload.left, payload.bottom);
          
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

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0.1, 0.5, 1)

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

let mixer: THREE.AnimationMixer


new GLTFLoader().load('https://'+model[0]+'.glb', (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene)
  //   //console.log(gltf  )
  const action1 = mixer.clipAction(gltf.animations[0]);
  const action2 = mixer.clipAction(gltf.animations[1]);
  action1.setLoop(THREE.LoopOnce, 1);  // Configura la animación para que no se repita
  action1.clampWhenFinished = true; //Detener al finalizar
  action2.setLoop(THREE.LoopOnce, 1);  // Configura la animación para que no se repita
  action2.clampWhenFinished = true;

  //const originPointIn3D = getPointIn3DFromScreenPercentage(0.1, 0.90);
  //gltf.scene.position.copy(originPointIn3D);
  gltf.scene.position.copy(originPointIn3D);
  animateModelToPosition(gltf.scene, centerPosition);
  growModelToAppear(gltf.scene);
  // Listener para el evento 'finished' de la animación
  mixer.addEventListener('finished', async () => {
    
  
    console.log('La animación ha terminado');
    // Aquí puedes iniciar la animación de movimiento del modelo
    //const pointIn3D = getPointIn3DFromScreenPercentage(0.15, 0.90);
    //await animateModelToPosition(gltf.scene, pointIn3D);
    await animateModelToPosition(gltf.scene, originPointIn3D);
    shrinkModelToDisappear(gltf.scene).then(() => {
      console.log('El modelo ha desaparecido.');
    });
    
  });
  scene.add(gltf.scene)
  playButton.addEventListener('click', () => {
    action1.play();
    action2.play();
    InitAudio();
    updateAndSendMessage('GesturesCatched','');
    //animateModelToPosition(gltf.scene, buttonPosition);
    //shrinkModelToDisappear(gltf.scene);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function animateModelToPosition(model: THREE.Object3D, targetPosition: THREE.Vector3) {
  const startPosition = model.position.clone();
  new TWEEN.Tween(startPosition)
    .to(targetPosition, 2000) // 1000ms = 1 segundo
    .easing(TWEEN.Easing.Quadratic.InOut) // Usar una función de suavizado
    .onUpdate(() => {
      model.position.copy(startPosition);
    })
    .start();
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function getPointIn3DFromRelativeCoordinates(xPercentage: number, yPercentage: number): THREE.Vector3 {
  // Calcular las coordenadas NDC
  mouse.x = (xPercentage / window.innerWidth) * 2 - 1;
  mouse.y = (yPercentage / window.innerHeight) * 2 - 1;

  // Actualizar el raycaster con las coordenadas del mouse y la cámara
  raycaster.setFromCamera(mouse, camera);
  console.log(scene.children);
  // Intersecar el rayo con un plano en el espacio 3D
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointIn3D = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, pointIn3D);
  console.log(scene.children);
  return pointIn3D;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function shrinkModelToDisappear(model: THREE.Object3D): Promise<void> {
  return new Promise((resolve) => {
    const startScale = model.scale.clone();
    const endScale = new THREE.Vector3(0, 0, 0);

    new TWEEN.Tween(startScale)
      .to(endScale, 2000) // 1000ms = 1 segundo
      .easing(TWEEN.Easing.Quadratic.InOut) // Usar una función de suavizado
      .onUpdate(() => {
        model.scale.copy(startScale);
      })
      .onComplete(() => {
        //scene.remove(model); // Opcional: Remover el modelo de la escena
        resolve();
      })
      .start();
  });
}
function growModelToAppear(model: THREE.Object3D, duration: number = 2000) {
  const targetScale = new THREE.Vector3(1, 1, 1);
  const startScale = new THREE.Vector3(0.01, 0.01, 0.01); // Tamaño inicial pequeño

  // Establecer el tamaño inicial del modelo
  model.scale.copy(startScale);

  // Animar el crecimiento del modelo hasta el tamaño objetivo
  new TWEEN.Tween(model.scale)
    .to(targetScale, duration)
    .easing(TWEEN.Easing.Quadratic.InOut) // Usar una función de suavizado
    .start();
}
/*function getPointIn3DFromScreenPercentage(xPercentage: number, yPercentage: number): THREE.Vector3 {
  // Calcular las coordenadas del punto en la pantalla
  const xScreen = window.innerWidth * xPercentage;
  const yScreen = window.innerHeight * yPercentage;

  // Convertir las coordenadas de pantalla a coordenadas normalizadas de dispositivo (NDC)
  mouse.x = (xScreen / window.innerWidth) * 2 - 1;
  mouse.y = -(yScreen / window.innerHeight) * 2 + 1;

  // Actualizar el raycaster con las coordenadas del mouse y la cámara
  raycaster.setFromCamera(mouse, camera);

  // Intersecar el rayo con un plano en el espacio 3D
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointIn3D = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, pointIn3D);

  return pointIn3D;
}*/
/*function getPointIn3DFromScreenPixels(xPixel: number, yPixel: number): THREE.Vector3 {
  mouse.x = (xPixel / window.innerWidth) * 2 - 1;
  mouse.y = -(yPixel / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointIn3D = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, pointIn3D);

  return pointIn3D;
}*/


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


console.log("modelo:"+model+"cargo");
 // Cargar y reproducir el audio
 const listener = new THREE.AudioListener();
 camera.add(listener);

 const sound = new THREE.Audio(listener);
 const audioLoader = new THREE.AudioLoader();
 

 function InitAudio(){
  audioLoader.load('https://'+model[0]+'.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
    sound.play();
    playButton.style.display = 'none';
});
 }
const clock = new THREE.Clock()
//const stats = new Stats()
//document.body.appendChild(stats.dom)

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) {
    mixer.update(delta);
  }
  TWEEN.update();
  //stats.update()
  renderer.render(scene, camera);
}

animate()
