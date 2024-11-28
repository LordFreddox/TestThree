import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader , GLTF} from 'three/addons/loaders/GLTFLoader.js'
//import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { AmbientLight } from 'three';
//import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
//import gsap from 'gsap';
//const playButton = (document.getElementById('boton') as HTMLFormElement);
const loadingscreen = (document.getElementById('loading') as HTMLFormElement);
const loadingBar = document.getElementById('loading-bar') as HTMLElement;
const tutorial = document.getElementById('tutorial') as HTMLElement;
//const logo = (document.getElementById('logo') as HTMLFormElement);
//const targetPosition= new THREE.Vector3();
const worldPosition = new THREE.Vector3();
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

/*const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 20;
const left = -frustumSize * aspect / 2;
const right = frustumSize * aspect / 2;
const top = frustumSize / 2;
const bottom = -frustumSize / 2;
const near = -50;// se corta el modelo
const far = 1500;*/

// Cámara ortográfica
/*const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
camera.position.set(1, 1, 1);*/
const controls = new OrbitControls(camera, renderer.domElement)
controls.minPolarAngle = 0;                // Permitir vista directamente hacia abajo
controls.maxPolarAngle = Math.PI / 2.1;    // Limitar angulo de camara
controls.maxDistance=50;//para camara perpectiva.
controls.minDistance=2;
//////////////////////////////////////////////////////////////////////////////////////////
//const minZoom = 0.2;//zoom con camara ortogonal
//const maxZoom = 3.5;
const panLimits = {
  xMin: -15,
  xMax: 15,
  zMin: -10,
  zMax: 10,
};
controls.addEventListener('change', () => {
//limitar zoom de la camara ortogonal
/*if (camera.zoom < minZoom) {
  camera.zoom = minZoom;
} else if (camera.zoom > maxZoom) {
  camera.zoom = maxZoom;
}*/
camera.updateProjectionMatrix();

  const offset = new THREE.Vector3();
  offset.copy(camera.position).sub(controls.target); 

  // límites de paneo en X y Z
  controls.target.x = Math.max(panLimits.xMin, Math.min(panLimits.xMax, controls.target.x));
  controls.target.z = Math.max(panLimits.zMin, Math.min(panLimits.zMax, controls.target.z));

  controls.target.y = 0;

  // Ajusta la posición de la cámara en consecuencia
  camera.position.x = controls.target.x + offset.x;
  camera.position.z = controls.target.z + offset.z;
  camera.position.y = controls.target.y + offset.y; // Altura constante
});
controls.enableDamping = true;
controls.dampingFactor = 0.1;

camera.position.set(0, 5, 7)
//const targetPosition = new THREE.Vector3(0, 0, 0);
controls.update()
let interactObjects = [] as THREE.Object3D[];
let lookAtCamera = [] as THREE.Object3D[];
const spawnModels: THREE.Vector3[] = [];
//const imageElement = document.getElementById("logo") as HTMLImageElement;



/*const videoTexture = loadVideoTexture('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/tutos/zoomout.webm');
// Crear un material con la textura de video
videoTexture.format = THREE.RGBAFormat;
const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, transparent: true });
const geometry = new THREE.PlaneGeometry(10, 7); 
const plane = new THREE.Mesh(geometry, videoMaterial);
plane.position.set(0, 11, 0); 
plane.rotation.x = -Math.PI / 4; 
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

function animateCamera(newtarget: THREE.Vector3, duration: number) {
  const startPosition = camera.position.clone();
  const endposition = new THREE.Vector3(newtarget.x-5,newtarget.y+10,newtarget.z);
  const startTime = performance.now();
  //const startRotation = camera.rotation.clone();
  function update() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      camera.position.lerpVectors(startPosition, endposition, t);
      
      //camera.rotation.copy(startRotation);
      camera.lookAt(newtarget);
      // Continuar la animación si no ha terminado
      if (t < 1) {
          requestAnimationFrame(update);
      }
  }

  update();
}
document.getElementById('moveCameraButton')?.addEventListener('click', () => {
  //animateCamera(targetPosition, 2000); // 2 segundos para completar el movimiento
});

/*function loadVideoTexture(videoPath: string): THREE.VideoTexture {
  // Crear el elemento de video
  const video = document.createElement('video');
  video.src = videoPath;
  video.crossOrigin = 'anonymous'; // Para videos externos si es necesario
  video.muted = true; 
  video.loop = true; 
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
new RGBELoader().load('img/cumulus_sky_dome_1k.hdr', (texture) => {//para camara perpectiva
  texture.mapping = THREE.EquirectangularReflectionMapping
  //scene.environment = texture
  scene.background = texture
  //scene.background = null
  scene.backgroundBlurriness = 0
})
///////////////////////////////////////////////////////////////////////////////////////////////
const hdrLoader = new RGBELoader();// para camara ortografica
hdrLoader.load('img/cumulus_sky_dome_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;

  // Crear una esfera gigante como fondo
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide, // La textura debe renderizarse al interior de la esfera
  });

  const backgroundSphere = new THREE.Mesh(geometry, material);
  scene.add(backgroundSphere);
});
const ambientLight = new AmbientLight(0xffffff, 2); // Luz blanca suave
scene.add(ambientLight);

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
    scene.add(gltf.scene);
    console.log("se cargó el modelo");
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Object3D) {
          console.log('Hijo encontrado:', child.name);
          if (child.name.includes('INTERACT_')){
          interactObjects.push(child);
          lookAtCamera.push(child);
          //console.log('array:'+interactObjects.length);
        }
        if (child.name.includes('BANNER_')){
          lookAtCamera.push(child);
          console.log("se encontró letrero");
          //console.log('array:'+interactObjects.length);
        }
      }
  });
  gltf.scene.traverse((node) => {
    if (node.name.startsWith("SPAWN_")) {
      spawnModels.push(node.position.clone());
      console.log("Found spawn point:", node.name, node.position);
    }
  });
  spawnModels.forEach((position) => {
    spawnModelAt(position); // Llama a tu función para instanciar modelos
  });
    //desactivamos pantalla de carga
    loadingscreen.style.display = "none";

    /*if (imageElement) {
      imageElement.src = "https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/img/"+model[0]+".png"; // Reemplaza con la ruta de tu imagen
      console.log("cargó la imagen");
    } else {
      console.error("No se encontró el elemento de imagen.");
    }*/
  },
  (xhr) => {
    const progress = (xhr.loaded / xhr.total) * 100;
    //console.log(`Progreso de carga: ${progress}%`);
    
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
      { constant: 1}, 
      {
        constant: -5,
        duration: 5, 
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
    { constant: -5},
    {
      constant: 1,
      duration: 5,
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

controls.addEventListener('change', () => {
  //console.log("El usuario ha interactuado");
  const cameraRotationZ = camera.rotation.z;
    // Actualizar la rotación de los objetos interactuables
    lookAtCamera.forEach((object) => {
      console.log("objeto del foreach"+object);
        object.rotation.z = -cameraRotationZ;
    });
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

  /*if (factorLerp < 1) {
    factorLerp += 0.01; 

    
    camera.position.lerpVectors(camera.position, worldPosition, factorLerp);

    camera.lookAt(worldPosition);
  }*/

  renderer.render(scene, camera);
}
function spawnModelAt(position: THREE.Vector3) {
  loader.load('https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/models/tree.glb', (gltf) => {
    const model = gltf.scene;

    // Posicionar el modelo
    model.position.copy(position);

    // Agregar el modelo a la escena
    scene.add(model);
  });
}

animate()

window.addEventListener('resize', () => {
  //camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
window.addEventListener('click', (event) => {
  console.log("se hizo click");
  // Calcular posición del mouse en coordenadas normalizadas
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Configurar el raycaster con la posición del mouse y la cámara
  raycaster.setFromCamera(mouse, camera);

  // Calcular intersecciones con los objetos interactuables
  const intersects = raycaster.intersectObjects(interactObjects, true);
console.log("array"+interactObjects);
  if (intersects.length > 0 && intersects[0].object.name.includes('INTERACT_')) {
      console.log(interactObjects);
      const object = intersects[0].object;

      // Obtener la posición global del objeto
      object.getWorldPosition(worldPosition);
      console.log("Posición en el mundo:", worldPosition);

      // Ajustar la posición objetivo (ej. elevarla)
      //worldPosition.y += 5;

      // Animar la cámara hacia el objetivo
      animateCamera(worldPosition, 2000);
  }
  if (intersects.length > 0 && intersects[0].object.name.includes('INTERACT_')) {
      console.log(interactObjects);
      const object = intersects[0].object;

      // Obtener la posición global del objeto
      object.getWorldPosition(worldPosition);
      console.log("Posición en el mundo:", worldPosition);

      // Ajustar la posición objetivo (ej. elevarla)
      //worldPosition.y += 5;

      // Animar la cámara hacia el objetivo
      animateCamera(worldPosition, 2000);
  }
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