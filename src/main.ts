
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
//import Stats from 'three/addons/libs/stats.module.js'
const welcomeScreen = (document.getElementById('boton') as HTMLFormElement);
welcomeScreen.addEventListener("click", InitAudio);

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
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
  return false;
};

var model = getUrlParameter("BigSurfaceId");

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

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 0.5, 0)

/*const stats = new Stats()
document.body.appendChild(stats.dom)*/

// function lerp(from: number, to: number, speed: number) {
//   const amount = (1 - speed) * from + speed * to
//   return Math.abs(from - to) < 0.001 ? to : amount
// }

let mixer: THREE.AnimationMixer
//let animationActions: { [key: string]: THREE.AnimationAction } = {}
//let activeAction: THREE.AnimationAction
// let speed = 0,
//   toSpeed = 0

/*const listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load('sounds/avatar.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
	sound.play();
  console.log("se cargó el audio");
});*/

new GLTFLoader().load('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/AVATAR%20AR%20EXPERIENCIA%203D/models/'+model+'.glb', (gltf) => {
  gltf.scene.scale.set(0.6, 0.6, 0.6); 
  mixer = new THREE.AnimationMixer(gltf.scene)
  //   //console.log(gltf  )
  mixer.clipAction(gltf.animations[1]).play()
  scene.add(gltf.scene)
});
console.log("modelo:"+model+"cargo");
 // Cargar y reproducir el audio
 const listener = new THREE.AudioListener();
 camera.add(listener);

 const sound = new THREE.Audio(listener);
 const audioLoader = new THREE.AudioLoader();
 

 function InitAudio(){
  audioLoader.load('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/AVATAR%20AR%20EXPERIENCIA%203D/sounds/'+model+'.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
    sound.play();
    welcomeScreen.style.display = 'none';
});
 }
/*
if(model=="100"){
//new GLTFLoader().load('models/mascara.glb', (gltf) => {
new GLTFLoader().load('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/AVATAR%20AR%20EXPERIENCIA%203D/models/man.glb', (gltf) => {
  gltf.scene.scale.set(0.6, 0.6, 0.6); 
  mixer = new THREE.AnimationMixer(gltf.scene)
  //   //console.log(gltf  )
  mixer.clipAction(gltf.animations[1]).play()
  scene.add(gltf.scene)
})
console.log("El Dorado");
}
else{
  console.log("No trajo Modelo");
}*/
const clock = new THREE.Clock()
let delta = 0

function animate() {
  requestAnimationFrame(animate)

  delta = clock.getDelta()

  controls.update()

  mixer.update(delta)
  renderer.render(scene, camera)

}

animate()
