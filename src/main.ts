import {
  AnimationMixer, Object3D, Clock,
  /*AnimationClip,*/ MeshBasicMaterial,
  Mesh, BackSide, Vector3,
  SphereGeometry, Vector2,
  Raycaster, Intersection
} from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GetPlaces, Place, PROJECT } from './HTTP/http-service.ts';
import { scene, camera, renderer } from './Renderer.ts';
import {
  initFloorSelector, initCategorySelector,
  updateLabelPositions, updateLabelVisibility, CreateTextForPlace,
  MapObjectsListByCategoryName, labelsScene, SetupPlacesForSearchVirtualTour,
  SetupDescriptionCardForPlace, SetupPlacesForSearchMap3D
} from './view.ts';
// import { createNavMesh } from './Navigator.ts'
import { GetBoundingBoxSizeAndCenterOfObject, GetHTMLElement, shouldBlock, IsLocalHost } from './Utils.ts';
import { loadAvatar } from './CallManager/CallView.ts';
import { FillZTArea } from './ZT/ZTView.ts';
import { ClosePlaceCard } from './view.ts';
import { CloseSearchPlace } from './view.ts';
import { HideZT } from './ZT/ZTView.ts';
const urlParams = new URLSearchParams(window.location.search);
const ServType: string = urlParams.get('ServType')!;
const loadingscreen = (document.getElementById('loadingMain') as HTMLFormElement);
const loadingBar = document.getElementById('loading-bar') as HTMLElement;
const tutorial = document.getElementById('tutorial') as HTMLElement;
const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
const BASE_URL = `${window.location.origin}${basePath}/models/`;
const companyId = urlParams.get('fakeId') || urlParams.get('placeId') || "0";
localStorage.setItem('companyId', companyId);
let mixers: AnimationMixer[] = [];
// let allAvailableAnimationClipsMap = new Map<Object3D, AnimationClip[]>();
const clock = new Clock();
let lookAtCamera: Object3D[] = [];
let floorLevels: Object3D[] = [];
let interactObjects = [] as Object3D[];
const loader = new GLTFLoader();
let places: Place[];
const mouse = new Vector2();
const raycaster = new Raycaster();

export const controls = new OrbitControls(camera, renderer.domElement)
controls.minPolarAngle = Math.PI / 10;     // Permitir vista directamente hacia abajo
controls.maxPolarAngle = Math.PI / 2.1;    // Limitar angulo de camara
controls.enableDamping = true;             // Movimiento suave
var minPan = new Vector3();
var maxPan = new Vector3();
var _v = new Vector3();

let contador = 0;//valor a cambiar en el temporizador

let modelUrl: string;
if (IsLocalHost()) {
  modelUrl = `./models/${companyId}_${PROJECT.toLowerCase()}.glb`;
} else {
  modelUrl = companyId === "0" ? BASE_URL + 'default' + '.glb' : BASE_URL + `${companyId}_${PROJECT.toLowerCase()}.glb`;
}

if (companyId === "0" || IsLocalHost()) {
  GetPlacesFake();
} else {
  GetPlacesReal();
}
//GetPlacesReal(companyId);


document.addEventListener('wheel', function(e) {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
}, { passive: false });

function Start() {
  if(ServType === '3'||ServType === '2'){ 
    loader.load(
      modelUrl,
      (gltf) => {
        //tutorial.style.display = 'flex';
        gltf.scene.position.set(0, 0, 0);
        scene.add(gltf.scene);
        const { size, center } = GetBoundingBoxSizeAndCenterOfObject(gltf.scene);
  
        const spawn = gltf.scene.getObjectByProperty('name', 'spawn') ||
          gltf.scene.children.find(child => child.name.toLowerCase().includes('spawn'));
  
        if (spawn) {
          // Obtener posición mundial del objeto "spawn"
          const spawnPosition = new Vector3();
          spawn.getWorldPosition(spawnPosition);
  
          // Posiciona la cámara relativa al spawn
          camera.position.set(
            spawnPosition.x + 2,
            spawnPosition.y + 5,
            spawnPosition.z + 0 // puedes ajustar este valor si quieres moverla también en Z
          );
  
          camera.lookAt(spawnPosition);
        } else {
          console.warn('No se encontró un objeto con nombre que incluya "spawn".');
          camera.position.set(size.x + 10, center.y + size.y + 13, 0);
        }
        //camera.position.set(size.x + 10, center.y + size.y + 13, 0);
        //camera.position.set(50, 50, 0);
        // camera.far = size.length() * 10;
        // camera.zoom = -size.length() / 10;
        controls.minDistance = size.length() / 20;
        controls.maxDistance = size.length();
        const mediam = (size.x + size.z) / 2;
        minPan = new Vector3(-size.length() / 2, 0, -size.length() / 4);
        maxPan = new Vector3(size.length() / 2, 0, size.length() / 4);
        controls.minZoom = mediam / 75;
        controls.maxZoom = mediam / 2.5;
        controls.update();
  
        //create skybox
        const geometry = new SphereGeometry(1, 60, 40);
        const material = new MeshBasicMaterial({
          color: 0xCBCBCB,
          side: BackSide,
        });
        const backgroundSphere = new Mesh(geometry, material);
        backgroundSphere.name = 'backgroundSphere';
        scene.add(backgroundSphere);
        backgroundSphere.scale.set(
          size.length() + 100, size.length() + 100, size.length() + 100);
  
        //populate animation array
        // const mixer = new AnimationMixer(gltf.scene);
        // allAvailableAnimationClipsMap.set(gltf.scene, gltf.animations);
        // let animationClips = gltf.animations;
        // animationClips.forEach((clip) => {
        //   mixer.clipAction(clip).play();
        // });
        // mixers.push(mixer);
  
        gltf.scene.traverse(child => {
          if (child.name.includes('ROTATE_')) {
            lookAtCamera.push(child);
          }
        });
  
        //populate floorLevels array with the objects that has the following name piso1, piso2, piso3 and so on
        let index = 1;
        while (true) {
          const object = gltf.scene.getObjectByName('piso' + index);
          if (object) {
            floorLevels.push(object);
            index++;
          } else {
            break;
          }
        }
  
        if (floorLevels.length > 1) {
          initFloorSelector(floorLevels, labelsScene);
        } else {
          document.getElementById('floor-selector-title')!.style.display = 'none';
          document.getElementById('floor-selector')!.style.display = 'none';
        }
  
        const objetivoParent = scene.getObjectByName("objetivos");
        if (objetivoParent) {
          objetivoParent.children.forEach(child => {
            child.visible = false;
          });
        }
  
        loadingscreen.style.display = "none";
        // const navmeshObj = scene.getObjectByName('navmesh');
        // if (navmeshObj) {
        //   createNavMesh(navmeshObj as Mesh)
        // }

        SetupPlacesOnScene(places);
  
        //Set selected floor to 1
        const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
        floorSelector.selectedIndex = 0;
        const event = new Event('change', { bubbles: true });
        floorSelector.dispatchEvent(event);
  
        GetHTMLElement('#loadingMain').style.display = "none";
      },
      (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
  
        if (loadingBar) {
          loadingBar.style.width = `${progress}%`;
        }
      },
      (error) => {
        console.error('An error happened', error);
      }
    );
  }
}

controls.addEventListener('change', () => {
  updateLabelPositions();
  _v.copy(controls.target);
  controls.target.clamp(minPan, maxPan);
  _v.sub(controls.target);
  camera.position.sub(_v);
});

controls.addEventListener('end', () => {
  updateLabelVisibility();
  contador = 2;//valor a cambiar en el temporizador
  const duracion = 1; // 1 segundo
  const intervalos = 100; // cada 100ms
  const pasos = duracion / intervalos;
  const decremento = contador / pasos;

  const intervalo = setInterval(() => {
    contador -= decremento;
    if (contador <= 0) {
      contador = 0;
      clearInterval(intervalo);
    }
  }, intervalos);
});

controls.update();



function GetPlacesReal() {
  GetPlaces().then(json => {
    places = json.data_place.places;
    SetupExplorerOrVirtualtour(places);
  }).catch((error) => {
    console.error("Error al obtener los lugares:", error);
  });
}

function GetPlacesFake() {
  fetch(`src/testJsons/response_${companyId}_${PROJECT.toLowerCase()}.json`)
    .then(json => {
      if (!json.ok) {
        console.log('Network response was not ok');
      }
      return json.json();
    })
    .then(json => {
      places = json.response.data_place.places;
      SetupExplorerOrVirtualtour(places);
    });
}

function SetupPlacesOnScene(places: Place[]) {
  places.forEach((place) => {
    const object = scene.getObjectByName(place.place_id.toString());
    if (object) {
      SetupPlacesForSearchMap3D(place, object, floorLevels);
      object.userData.place = place;
      object.userData.isPlaceObject = true;
      if (!MapObjectsListByCategoryName[place.place_category_name]) {
        MapObjectsListByCategoryName[place.place_category_name] = [];
      }
      MapObjectsListByCategoryName[place.place_category_name].push(object);
      CreateTextForPlace(place, object, floorLevels);
      interactObjects.push(object);
    }
  });
  updateLabelPositions();
  updateLabelVisibility();
  initCategorySelector();
}

function SetupExplorerOrVirtualtour(places: Place[]) {
  switch (ServType) {
    case "1":
      GetHTMLElement('.container-select-place').style.top = '1vh';
      GetHTMLElement('#previewButton').style.display = 'none';
      document.getElementById('div3DView')!.style.display = 'none';
      document.getElementById('search-section')!.style.display = 'block';
      // document.getElementById("back3D")!.style.display = 'block';
      // if (places[0]) {
      //   const imageElement = document.getElementById('imageSearchSprite');
      //   if (imageElement) {
      //     imageElement.setAttribute('src', places[0].company_picture_url);

      //     imageElement.onerror = function () {
      //       imageElement.style.visibility = 'hidden';
      //     };

      //     imageElement.onload = function () {
      //       imageElement.style.visibility = 'visible';
      //     };
      //   }
      // }
      // document.getElementById('imageSearchSprite')!.setAttribute('src', places[0].company_picture_url)
      SetupPlacesForSearchVirtualTour(places);
      GetHTMLElement('#loadingMain').style.display = "none";
      break;
    case "2":
        loadAvatar(companyId);
        FillZTArea(companyId);
        document.getElementById('div3DView')!.style.display = 'block';
        document.getElementById('search-section')!.style.display = 'none';
        document.getElementById('ecommerce-redirect')!.style.display = 'none';
        //document.getElementById('btnZTList')!.style.display = 'none';
        //document.getElementById('ZTArea')!.style.display = 'none';
    break;
    case "3":
      loadAvatar(companyId);
      FillZTArea(companyId);
      document.getElementById('div3DView')!.style.display = 'block';
      document.getElementById('search-section')!.style.display = 'none';
      break;
  }

  Start();
}

let hasUserInteracted = false;

controls.addEventListener('start', () => {
  if (!hasUserInteracted) {
    hasUserInteracted = true;
    tutorial.style.display = 'none';
  }
});

window.addEventListener('touchend', (event) => {
  //disable raycast 
  //cerrar pantallas 
 
  if(shouldBlock(event)) return; 
  ClosePlaceCard();
  CloseSearchPlace();
  HideZT();
  if(contador!== 0) return;
  const touch = event.changedTouches[0];
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
 
  // Remove the previous debug line if it exists
  //scene.remove(scene.getObjectByName('rayLine')!);

  const intersects: Intersection[] = raycaster.intersectObjects(interactObjects, true);
  if (intersects.length > 0) {
    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].object.userData.isPlaceObject &&
        intersects[i].object.parent?.visible === true) {
        SetupDescriptionCardForPlace(intersects[i].object);
        break;
      }
    }
  }

  //add debug lines
  //const rayOrigin = raycaster.ray.origin;
  //const rayDirection = raycaster.ray.direction.clone().multiplyScalar(50); // Extend the direction for visualization
  //const points = [rayOrigin, rayOrigin.clone().add(rayDirection)];
  //const geometry = new THREE.BufferGeometry().setFromPoints(points);
  //const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  //const line = new THREE.Line(geometry, material);
  //line.name = 'rayLine';
  //scene.add(line);
});


// Variables globales para el movimiento
let isMovingCamera = false;
const targetPosition = new Vector3();
const targetLookAt = new Vector3();
const lerpSpeed = 0.01;

// Función para enfocar la cámara a un objeto
export function focusCameraOnObject(object: Object3D) {
  if (!object) {
    console.warn("Objeto no válido");
    return;
  }

  const offset = new Vector3(0, 5, 0);
  //const offset = new Vector3(3, 5, -5); 
  object.updateMatrixWorld();

  const worldPos = new Vector3();
  object.getWorldPosition(worldPos);
targetLookAt.copy(worldPos);
  targetPosition.copy(worldPos).add(offset);
  

  isMovingCamera = true;
}

function animate() {
   if (isMovingCamera) {
    // Mover posición y target suavemente
    controls.target.lerp(targetLookAt, lerpSpeed);
    controls.update();

    camera.position.lerp(targetPosition, lerpSpeed);
    console.log("Posicion:", camera.position.distanceTo(targetPosition));
    // Si ya llegamos al punto
    if (camera.position.distanceTo(targetPosition) <= 2) {
      console.log("Cámara ha llegado al objetivo:", targetPosition);
      camera.position.copy(targetPosition);
      controls.enabled = true;
      controls.target.copy(targetLookAt);
      controls.update();
      isMovingCamera = false;
    }
  } 
  else {
  controls.update();
  mixers.forEach((mixer) =>
    mixer.update(clock.getDelta())
  );
  lookAtCamera.forEach((object) => {
    object.lookAt(camera.position);
  });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();