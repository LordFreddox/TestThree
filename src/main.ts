import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader , GLTF} from 'three/addons/loaders/GLTFLoader.js'
//import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { AmbientLight } from 'three';
import { OrthographicCamera, Vector3 } from 'three';
//import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
//import gsap from 'gsap';
// Crear la escena, cámara y renderer
//const playButton = (document.getElementById('boton') as HTMLFormElement);
const loadingscreen = (document.getElementById('loading') as HTMLFormElement);
const loadingBar = document.getElementById('loading-bar') as HTMLElement;
const tutorial = document.getElementById('tutorial') as HTMLElement;
//const logo = (document.getElementById('logo') as HTMLFormElement);
//const targetPosition= new THREE.Vector3();
const worldPosition = new THREE.Vector3();
let factorLerp = 1; 
//var buttonPosition = new THREE.Vector3(80, 10, 0);
//var centerPosition = new THREE.Vector3(0.1, -1, 0);
//var originPointIn3D= new THREE.Vector3(0.1, 2, -5);
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setClearColor(0x000000, 0);
scene.background = new THREE.Color(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.localClippingEnabled = true // Habilitar clipping
document.body.appendChild(renderer.domElement)
let mixer: THREE.AnimationMixer
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2()

const controls = new OrbitControls(camera, renderer.domElement)
controls.minPolarAngle = 0;                // Permitir vista directamente hacia abajo
controls.maxPolarAngle = Math.PI / 2.1;      // Limitar a un ángulo de 90 grados para evitar vistas desde abajo
controls.maxDistance=10;
controls.minDistance=2;
controls.autoRotate = false;
//controls.enablePan = false;
const panLimit = 10; // Ajusta según tu escena
controls.addEventListener('change', () => {
  const target = controls.target;

  target.x = Math.max(-panLimit, Math.min(panLimit, target.x));
  target.y = Math.max(-panLimit, Math.min(panLimit, target.y));
  target.z = Math.max(-panLimit, Math.min(panLimit, target.z));
});

camera.position.set(0, 20, 5)
controls.update()
let interactObjects = [] as THREE.Object3D[];
const imageElement = document.getElementById("logo") as HTMLImageElement;



/*const videoTexture = loadVideoTexture('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/tutos/zoomout.webm');
// Crear un material con la textura de video
videoTexture.format = THREE.RGBAFormat;
const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, transparent: true });
const geometry = new THREE.PlaneGeometry(10, 7); // Ajusta las dimensiones según necesites
const plane = new THREE.Mesh(geometry, videoMaterial);
plane.position.set(0, 11, 0); // Eleva el plano a Y = 1
plane.rotation.x = -Math.PI / 4; // Gira 90 grados hacia arriba
scene.add(plane);
plane.position.set(0, 10, 0);
plane.rotation.x = -Math.PI / 4;/*
//let interactMapAudio = {} as { [key: string]: THREE.Audio };
/*
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
    */

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


/*function loadVideoTexture(videoPath: string): THREE.VideoTexture {
  // Crear el elemento de video
  const video = document.createElement('video');
  video.src = videoPath;
  video.crossOrigin = 'anonymous'; // Para videos externos si es necesario
  video.muted = true; // Si quieres que el video se reproduzca automáticamente
  video.loop = true; // Para que el video se repita
  video.play();

  // Crear la textura de video
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;

  return videoTexture;
}*/

/*function handleMessage(e:any) {
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




// Crear el plano de recorte
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // Dirección inicial del plano de recorte
const clipPlanes = [clipPlane]
*/
var bigSurface = String(getUrlParameter("BigSurfaceId"));
var model = bigSurface.split("-", 3); 
new RGBELoader().load('img/cumulus_sky_dome_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  //scene.environment = texture
  scene.background = texture
  //scene.background = null
  scene.backgroundBlurriness = 0
})
const ambientLight = new AmbientLight(0xffffff, 2); // Luz blanca suave
scene.add(ambientLight);

console.log("superficie"+model[0]);
const loader = new GLTFLoader();
function loadModelWithCallback(
  url: string,
  onLoad: (gltf: GLTF) => void,
  onProgress?: (xhr: ProgressEvent) => void,
  //onError?: (error: ErrorEvent) => void
) {
  loader.load(
    url,
    (gltf) => {
      // Inicializa el mixer y posiciona el modelo
      //const mixer = new THREE.AnimationMixer(gltf.scene);
      console.log(gltf);

      gltf.scene.position.set(0, 0, 0);

      // Llamamos al callback al finalizar la carga
      onLoad(gltf);
    },
    onProgress,
  );
}
loadModelWithCallback(
  'https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/models/' + model[0] + '.glb',
  (gltf) => {
    console.log("Modelo cargado completamente:", gltf);
    tutorial.style.display='flex';
    // Puedes agregar el modelo a la escena o ejecutar otra lógica aquí
    scene.add(gltf.scene);
    console.log("se cargó el modelo");
    //desactivamos pantalla de carga.
    loadingscreen.style.display = "none";

    if (imageElement) {
      imageElement.src = "https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/img/"+model[0]+".png"; // Reemplaza con la ruta de tu imagen
      console.log("cargó la imagen");
    } else {
      console.error("No se encontró el elemento de imagen.");
    }
  },
  (xhr) => {
    const progress = (xhr.loaded / xhr.total) * 100;
    console.log(`Progreso de carga: ${progress}%`);
    
    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }
  },
  /*(error) => {
    console.error("Error al cargar el modelo:", error);
  }*/
);

  
  /*setTimeout(() => {
    playButton.style.display = 'block'
  }, 3000)*/

  /*if (model[0] === '1105') {
    logo.style.display = 'block'
  }*/

  /*mixer.addEventListener('finished', async () => {
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
    
  })*/

  /*scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material.clippingPlanes = clipPlanes
    }
  })*/

  /*scene.add(gltf.scene)
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
        //console.log('Hijo encontrado:', child.name);
        if (child.name.includes('INTERACT_')){
          console.log('Hijo encontrado:');
        interactObjects.push(child);
        //console.log('array:'+interactObjects.length);
      }
    }
});*/
  /*playButton.addEventListener('click', () => {
    action1.play()
    action2.play()
    InitAudio()
    updateAndSendMessage('GesturesCatched', '')
    console.log("reproduce animación");
    playButton.style.display = 'none';
  })*/

  // Animar el plano de recorte de abajo hacia arriba después de cargar el modelo
  /*gsap.fromTo(
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
  )*/
//})
let hasUserInteracted = false;

controls.addEventListener('start', () => {
  if (!hasUserInteracted) {
    console.log("El usuario ha interactuado por primera vez.");
    hasUserInteracted = true;
    // Quitamos el tutorial
    tutorial.style.display = 'none';
  }
});

// Si necesitas rastrear todos los cambios posteriores, puedes usar el evento 'change' también
controls.addEventListener('change', () => {
  //console.log("El usuario ha interactuado");
  // Este evento se dispara en cada movimiento o cambio de zoom
});
const clock = new THREE.Clock()

const animate = () => {
  const delta = clock.getDelta();
  requestAnimationFrame(animate);
    renderer.render(scene, camera);
  controls.update();

  if (mixer) {
    mixer.update(delta);
  }

  if (factorLerp < 1) {
    factorLerp += 0.01; // Ajusta la velocidad

    // Interpolación de la posición de la cámara hacia el objeto interactuable
    camera.position.lerpVectors(camera.position, worldPosition, factorLerp);

    // Haz que la cámara mire hacia el objeto
    camera.lookAt(worldPosition);
  }

  renderer.render(scene, camera);
}


animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
window.addEventListener('click', (event) => {
  // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the ray
  //const intersects = raycaster.intersectObjects(scene.children, true);
  const intersects = raycaster.intersectObjects(interactObjects, true);
  //if (intersects.length > 0) {
    if (intersects.length > 0 && intersects[0].object.name.includes('INTERACT_')){
      
    const object = intersects[0].object;
    console.log("Objeto "+object.type);
    console.log("Nombre del modelo "+object.name);
    
    object.getWorldPosition(worldPosition);
    console.log("Posición en el mundo:", worldPosition);
    //targetPosition.copy(object.position); // Asigna la posición del objeto al targetPosition
    worldPosition.y += 5;
    //console.log("posicion del modelo "+targetPosition);
    factorLerp = 0;
  }
      /*const object = intersects[0].object;
      const actionObject = actionsObjectArray.find(actionObj => actionObj.name === object.name);
      if (actionObject) {
          const action = animationArray.find(animAction => animAction.getClip().name === object.name);
          if (action) {
          action.reset().play();
          // Stop all animations from array animationArray that are not the current action
          animationArray.forEach((animAction) => {
              if (animAction.getClip().name !== object.name) {
              animAction.stop();
              }
          });
          }
      }*/
  });

/*function InitAudio() {
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
}*/