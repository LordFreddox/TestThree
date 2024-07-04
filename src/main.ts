
import './style.css'
import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

//import Stats from 'three/addons/libs/stats.module.js'
const playButton = (document.getElementById('boton') as HTMLFormElement);


declare function sendMessageWindow(): void;


const scene = new THREE.Scene()

//const gridHelper = new THREE.GridHelper(100, 100)
//scene.add(gridHelper)

/*function GetURLParameter(sParam: string) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
  return "";
}*/

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

/*const stats = new Stats()
document.body.appendChild(stats.dom)*/

// function lerp(from: number, to: number, speed: number) {
//   const amount = (1 - speed) * from + speed * to
//   return Math.abs(from - to) < 0.001 ? to : amount
// }

let mixer: THREE.AnimationMixer


new GLTFLoader().load('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/ThreeAvatarFlutter/models/'+model[0]+'.glb', (gltf) => {
  gltf.scene.scale.set(0.6, 0.6, 0.6); 
  mixer = new THREE.AnimationMixer(gltf.scene)
  //   //console.log(gltf  )
  const action = mixer.clipAction(gltf.animations[0]);
  action.setLoop(THREE.LoopOnce, 1);  // Configura la animación para que no se repita
  action.clampWhenFinished = true; //Detener al finalizar
  //mixer.clipAction(gltf.animations[0]).play()
  scene.add(gltf.scene)

  playButton.addEventListener('click', () => {
    action.play();
    InitAudio();
  });
});
console.log("modelo:"+model+"cargo");
 // Cargar y reproducir el audio
 const listener = new THREE.AudioListener();
 camera.add(listener);

 const sound = new THREE.Audio(listener);
 const audioLoader = new THREE.AudioLoader();
 

 function InitAudio(){
  audioLoader.load('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/ThreeAvatarFlutter/sounds/'+model[0]+'.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
    sound.play();
    playButton.style.display = 'none';
});
    sendMessageWindow();
 }
const clock = new THREE.Clock()
let delta = 0

function animate() {
  requestAnimationFrame(animate)

  delta = clock.getDelta()


  mixer.update(delta)

  renderer.render(scene, camera)

}

animate()
