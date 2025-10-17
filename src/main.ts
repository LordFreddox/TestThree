import {
  AnimationMixer, Object3D, Clock,
  // MeshBasicMaterial, BackSide,
  // SphereGeometry, Intersection,
  Mesh, Vector3, Box3,Scene,Color,
  Euler
  // Raycaster
} from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Place, PlaceShort } from './Utils/Types.ts';
import { GetPlaces, PROJECT } from './HTTP/http-service.ts';
import { scene, camera, renderer, composer } from './Renderer.ts';
import {
  initFloorSelector, ClosePlaceCard, CloseSearchPlace,
  // initCategorySelector, 
  updateLabelPositions, updateLabelVisibility, CreateTextForPlace,
  MapObjectsListByCategoryName, SetupPlacesForSearchVirtualTour,
  SetupPlacesForSearchMap3D,
  showFloor,ChangeColorOfSingleObject,RestoreOriginalColors
  // SetupDescriptionCardForPlace
} from './view.ts';
import { generateBuildingsAroundModel } from './BuildingGenerator.ts';
import {
  GetBoundingBoxSizeAndCenterOfObject, GetHTMLElement,
  // shouldBlock,
  IsLocalHost, normalizeString
} from './Utils/Utils.ts';
import { EndCallView, loadAvatar } from './CallManager/CallView.ts';
import { FillZTArea, HideZT } from './ZT/ZTView.ts';
import { ChangeCompanyName, COMPANY_ID, SERV_TYPE, FAKE_ID } from './Utils/constants.ts';
import { DisplayChatAI, InitChat } from './chat.ts';
import { focusSitPlace } from './Boleteria.ts';
// const ServType: string = urlParams.get('ServType')!;
const loadingscreen = (document.getElementById('loadingMain') as HTMLFormElement);
const loadingBar = document.getElementById('loading-bar') as HTMLElement;
//const tutorial = document.getElementById('tutorial') as HTMLElement;
const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
const BASE_URL = `${window.location.origin}${basePath}/models/`;
// const companyId = urlParams.get('fakeId') || urlParams.get('placeId') || "0";
// localStorage.setItem('companyId', companyId);
let mixers: AnimationMixer[] = [];
// let allAvailableAnimationClipsMap = new Map<Object3D, AnimationClip[]>();
const clock = new Clock();
let lookAtCamera: Object3D[] = [];
let startingCameraPosition: Vector3;
let startingCameraRotation: Euler;

export let floorLevels: Object3D[] = [];
let interactObjects = [] as Object3D[];
const loader = new GLTFLoader();
const buildingModels: Object3D[] = [];

// Lista de rutas de modelos GLB de edificios para el generador
const buildingModelPaths = [
  './models/building1.glb',
  './models/building2.glb',
  './models/building3.glb',
  './models/building4.glb',
];

function loadBuildingModelsAndGenerate(
  scene: Scene,
  modelSize: Vector3 | null,
  modelCenter: Vector3 | null
): void {
  Promise.all(
    buildingModelPaths.map((path: string) => loader.loadAsync(path))
  ).then((results: { scene: Object3D }[]) => {
    results.forEach((gltf) => buildingModels.push(gltf.scene));
    // Llama a la función de generación con los modelos cargados
    generateBuildingsAroundModel(scene, modelSize, modelCenter, buildingModels);
  });
}
let places: Place[] = [];
// const mouse = new Vector2();
// const raycaster = new Raycaster();
let totalSceneSize: number = 0;
let raycastTimeout: ReturnType<typeof setTimeout> | null = null;
let modelSize: Vector3 | null = null;
let modelCenter: Vector3 | null = null;
export let isSingleLevel: boolean = true;

export const controls = new OrbitControls(camera, renderer.domElement)
controls.minPolarAngle = Math.PI / 10;     // Permitir vista directamente hacia abajo
controls.maxPolarAngle = Math.PI / 2.1;    // Limitar angulo de camara
controls.enableDamping = true;             // Movimiento suave
var minPan = new Vector3();
var maxPan = new Vector3();
var _v = new Vector3();

let modelUrl: string;
if (IsLocalHost()) {
  modelUrl = `./models/${PROJECT.toUpperCase()}/${COMPANY_ID}.glb`;
} else {
  modelUrl = `${BASE_URL}${PROJECT.toUpperCase()}/${COMPANY_ID}.glb`;
}

if (FAKE_ID === null) {
  if (COMPANY_ID === "0" || IsLocalHost()) {
    GetPlacesFake();
  } else {
    GetPlacesReal();
  }
} else {
  Start();
}

//GetPlacesReal(companyId);


document.addEventListener('wheel', function (e) {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
}, { passive: false });

function Start() {
  if (SERV_TYPE === '3' || SERV_TYPE === '2') {
    loader.load(
      modelUrl,
      (gltf) => {
        //tutorial.style.display = 'flex';
        gltf.scene.position.set(0, 0, 0);
        scene.add(gltf.scene);
        const { size, center } = GetBoundingBoxSizeAndCenterOfObject(gltf.scene);
        modelSize = size;
        modelCenter = center;
        totalSceneSize = size.length();
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
          camera.position.set(size.x + 10, center.y + size.y + 13, 0);
        }
        //camera.position.set(size.x + 10, center.y + size.y + 13, 0);
        //camera.position.set(50, 50, 0);
        // camera.far = size.length() * 10;
        // camera.zoom = -size.length() / 10;
        startingCameraPosition = camera.position.clone();
        startingCameraRotation = camera.rotation.clone();
        camera.updateProjectionMatrix();
        controls.target.set(center.x, center.y, center.z);
        controls.minDistance = size.length() / 20;
        controls.maxDistance = size.length() / 1;
        //Tuve que cambiar el valor Y del Pan para los modelos multinivel, se requiere para mover el target en el eje Y
        minPan = new Vector3(-size.length() / 2, -size.length() / 2, -size.length() / 4);
        maxPan = new Vector3(size.length() / 2, size.length() / 2, size.length() / 4);
        // const mediam = (size.x + size.z) / 2;
        // controls.minZoom = mediam / 50;
        // controls.maxZoom = mediam / 2.5;
        controls.update();

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
          initFloorSelector(floorLevels);
          isSingleLevel = false;
        } else {
          // document.getElementById('floor-selector-title')!.style.display = 'none';
          document.getElementById('floor-carousel-container')!.style.display = 'none';
          isSingleLevel = true;
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

        if (FAKE_ID === null) {
          const arrowLength: number = gltf.scenes[0].userData.arrowLength ?? 5;
          const arrowColor: string = gltf.scenes[0].userData.arrowColor ?? "#595959";
          SetupPlacesOnScene(places, arrowLength, arrowColor);
        } else { //enable ui on fakeId
          document.getElementById('div3DView')!.style.display = 'block';
          document.getElementById('search-section')!.style.display = 'none';
          document.getElementById('category-selector-parent')!.style.display = 'none';
        }

        for (let i = 0; i < places.length; i++) {
          if (places[i].bigcompany_level === 1) {
            ChangeCompanyName(places[i].bigcompany_name_short);
            break;
          }
        }

        const userConfig = gltf.scenes[0].userData.generateBuildings ?? false;
        if (userConfig == true)
          loadBuildingModelsAndGenerate(scene, modelSize, modelCenter);
        GetHTMLElement('#loadingMain').style.display = "none";
        if (floorLevels.length > 0) {
          showFloor(-1, floorLevels);
        }
        updateLabelPositions();
        updateLabelVisibility();
      },
      (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;

        if (loadingBar) {
          loadingBar.style.width = `${progress}%`;
        }
      },
      (error) => {
        console.error('An error happened', error);
      },
    );
    /*updateLabelPositions();
    updateLabelVisibility();*/
  }
}

controls.addEventListener('change', () => {
  updateLabelPositions();
  _v.copy(controls.target);
  controls.target.clamp(minPan, maxPan);
  _v.sub(controls.target);
  camera.position.sub(_v);
});

// let canRaycast = true;

controls.addEventListener('start', () => {
  // canRaycast = false;
  if (raycastTimeout) {
    clearTimeout(raycastTimeout);
    raycastTimeout = null;
  }
});

controls.addEventListener('end', () => {
  updateLabelVisibility();
  if (raycastTimeout) {
    clearTimeout(raycastTimeout);
  }

  raycastTimeout = setTimeout(() => {
    // canRaycast = true;
    // console.log("Raycast enabled again");
  }, 2000); // espera 2 segundos antes de volver a permitir raycast
  updateLabelVisibility();
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
  fetch(`src/testJsons/response_${COMPANY_ID}_${PROJECT.toLowerCase()}.json`)
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

function SetupPlacesOnScene(places: Place[], arrowLenght: number, arrowColor: string) {
  let settingLogoGS: boolean = true;
  const logoImg = GetHTMLElement(".logoGS") as HTMLImageElement;

  places.forEach((place) => {
    if (settingLogoGS && place.bigcompany_level === 1) {
      logoImg.onerror = () => {
        logoImg.style.visibility = 'hidden';
        settingLogoGS = false;
      };
      logoImg.onload = () => {
        logoImg.style.visibility = 'visible';
      };

      logoImg.src = place.company_logo_url;
      settingLogoGS = false;
    }

    const object = scene.getObjectByName(place.place_id.toString());
    if (object) {
      SetupPlacesForSearchMap3D(place, object, floorLevels);
      object.userData.place = place;
      object.userData.isPlaceObject = true;
      if (!MapObjectsListByCategoryName[place.place_category_name]) {
        MapObjectsListByCategoryName[place.place_category_name] = [];
      }
      MapObjectsListByCategoryName[place.place_category_name].push(object);
      CreateTextForPlace(place, object, floorLevels, arrowLenght, arrowColor);
      interactObjects.push(object);
    }
  });

  if (settingLogoGS) {
    logoImg.style.visibility = 'hidden';
  }
  // initCategorySelector(); //disable categorySelector for now
}

async function SetupExplorerOrVirtualtour(places: Place[]) {
  switch (SERV_TYPE) {
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
      loadAvatar(COMPANY_ID);
      FillZTArea(COMPANY_ID);
      document.getElementById('div3DView')!.style.display = 'block';
      document.getElementById('search-section')!.style.display = 'none';
      // document.getElementById('text-chat-AI')!.style.display = 'none';
      //document.getElementById('btnZTList')!.style.display = 'none';
      //document.getElementById('ZTArea')!.style.display = 'none';
      break;
    case "3":
      await loadAvatar(COMPANY_ID);
      InitChat();
      // FillZTArea(COMPANY_ID);
      GetHTMLElement('#containerZTList')!.style.display = 'none';
      // GetHTMLElement('#avatarButton')!.style.display = 'none';
      GetHTMLElement('.avatarImgScript').onclick = () => {
        EndCallView();
        DisplayChatAI();
        ClosePlaceCard();
      };
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
    //tutorial.style.display = 'none';
  }
  ClosePlaceCard();
  CloseSearchPlace();
  HideZT();
});

// Variables globales para el movimiento
let isMovingCamera = false;
const targetPosition = new Vector3();
const targetLookAt = new Vector3();
const lerpSpeed = 0.01;
// let originalMinDistance: number;
// let originalMaxDistance: number;
// Función para enfocar la cámara a un objeto
export function focusCameraOnObject(object: Object3D) {
  if (!object) {
    console.warn("Objeto no válido");
    return;
  }
  console.log("Enfocando cámara en objeto:", object.name);
  //camera.position.copy(object.position);

  const offset = new Vector3(0, 30, 0);
  //const offset = new Vector3(3, 5, -5); 
  object.updateMatrixWorld();

  const worldPos = new Vector3();

  object.getWorldPosition(worldPos);
  //camera.position.set(worldPos.x, worldPos.y + 50, worldPos.z);
  camera.lookAt(worldPos);
  targetPosition.copy(worldPos).add(offset);
  targetLookAt.copy(worldPos);
  //targetPosition.copy(object.position).add(offset);
  console.log("world", worldPos, "Posición:", object.position);
  /*if (originalMinDistance === undefined || originalMaxDistance === undefined) {
    originalMinDistance = controls.minDistance;
    originalMaxDistance = controls.maxDistance;
  }
  //desactivamos temporalmente las restricciones de zoom
  controls.minDistance = 0;
  controls.maxDistance = Infinity;*/
  controls.enabled = false; // evitamos que el usuario interactúe
  isMovingCamera = true;
}
let markerTemplate: Object3D | null = null;
let currentMarker: Object3D | null = null;

// Cargar el modelo glb del marcador
const markerloader = new GLTFLoader();
markerloader.load('./models/marker.glb', (gltf) => {
  markerTemplate = gltf.scene;
});

// Spawnear el marcador
export function spawnMarkerAboveObject(target: Object3D) {
  // Eliminar el marcador anterior
  if (currentMarker)
    removeCurrentMarker();
  if (!markerTemplate) return;

  // Clonar el modelo
  const marker = markerTemplate.clone();

  // Obtener tamaño del objeto objetivo
  const box = new Box3().setFromObject(target);
  const size = new Vector3();
  box.getSize(size);
  const height = size.y;

  // Escalar el diamante en proporción al objeto
  const scaleFactor = height * 0.3; // Ajusta esto si se ve muy grande o pequeño
  marker.scale.setScalar(scaleFactor);

  // Asegurar matrices actualizadas antes de obtener la posición global
  target.updateMatrixWorld(true);
  // Obtener posición del objeto
  const worldPosition = new Vector3();
  target.getWorldPosition(worldPosition);

  // Posicionar el marcador justo encima
  marker.position.copy(worldPosition);
  marker.position.y += height + scaleFactor / 2 + 0.05;

  // Añadir a escena y guardar referencia
  scene.add(marker);
  currentMarker = marker;
}

export function focusCameraOnFloor(floor: Object3D, controls: OrbitControls) {
  if (!floor) return;

  const box = new Box3().setFromObject(floor);
  const center = box.getCenter(new Vector3());

  const offset = new Vector3(30, 30, 30);

  const newCameraPos = center.clone().add(offset);

  // Cambiamos la posición y el target sin animación
  camera.position.copy(newCameraPos);
  controls.target.copy(center);

  controls.update();
}

export function SearchPlacesByDistanceCategoryArea(
  startObject: Object3D,
  categoryFilter: string): string {
  let foundObjects: { place_id: string, companysubsidiary_name: string, distance: string }[] = [];
  let foundObjectsFar: { place_id: string, companysubsidiary_name: string, distance: string }[] = [];

  const startPosition: Vector3 = new Vector3;
  startObject.getWorldPosition(startPosition);
  interactObjects.forEach(object => {
    const probePosition: Vector3 = new Vector3;
    object.getWorldPosition(probePosition);
    const calculatedDistance = startPosition.distanceTo(probePosition);
    if (object.userData.place.place_category_name === categoryFilter) {
      if (calculatedDistance < totalSceneSize / 10 //filter by 10% of total scene size
        // object.userData.place.place_area_id === startObject.userData.place.place_area_id //filter by same area id
      ) {
        foundObjects.push({
          place_id: object.userData.place.place_id,
          companysubsidiary_name: object.userData.place.companysubsidiary_name,
          distance: `A ${calculatedDistance} metros`
        });
      } else if (calculatedDistance < totalSceneSize / 5) {//filter by 25% of total scene size
        foundObjects.push({
          place_id: object.userData.place.place_id,
          companysubsidiary_name: object.userData.place.companysubsidiary_name,
          distance: `A ${calculatedDistance} metros`
        });
      }
    }
  });
  if (foundObjects.length > 0) { //some places passed the filter
    return `Se recomiendan los siguientes lugares cercanos a ti con la categoría de ${categoryFilter}: ${JSON.stringify(foundObjects)}`;
  }
  if (foundObjectsFar.length > 0) { //nothing passed the filter
    return `No se encontraron lugares cercanos a ti, sin embargo te puedo recomendar estos que estan un poco mas lejos: ${JSON.stringify(foundObjectsFar)}`;
  }
  return `No se encontraron lugares recomendados con esa categoría`;
}

export function removeCurrentMarker() {
  if (!currentMarker) return;

  scene.remove(currentMarker);

  currentMarker.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });

  currentMarker = null;
}

export function GetPlacesInfoByName(place_name: string): PlaceShort[] {
  let placeFound: PlaceShort[] = [];
  const searchnormalized = normalizeString(place_name.toLocaleLowerCase())
  for (let index = 0; index < places.length; index++) {
    const originalNormalized = normalizeString(places[index].companysubsidiary_name.toLocaleLowerCase());
    if (originalNormalized.includes(searchnormalized))
      placeFound.push({
        place_id: places[index].place_id,
        place_category_name: places[index].place_category_name,
        companysubsidiary_name: places[index].companysubsidiary_name,
        place_area_name: places[index].place_area_name
      });
  }
  return placeFound;
}

export function GetAllCategories(): string[] {
  let categories: string[] = [];
  for (let index = 0; index < places.length; index++) {
    if (!categories.includes(places[index].place_category_name)) {
      categories.push(places[index].place_category_name);
    }
  }
  return categories;
}

export function RestartScene() {
  camera.position.copy(startingCameraPosition);
  camera.rotation.copy(startingCameraRotation);
  // controls.target.set(modelCenter!.x, modelCenter!.y, modelCenter!.z);
  controls.update();
  if (floorLevels.length > 0) {
    showFloor(-1, floorLevels);
  }
  ClosePlaceCard();
  CloseSearchPlace();
  HideZT();
  removeCurrentMarker();
  GetHTMLElement('#avatarButton').style.removeProperty('top');
  GetHTMLElement('#avatarButton').style.removeProperty('left');
  //GetHTMLElement('#tutorial').style.display = 'flex';
}

function animate() {
  if (isMovingCamera) {
    // Movimiento de la camara
    controls.target.lerp(targetPosition, lerpSpeed);
    //controls.update();

    camera.position.lerp(targetPosition, lerpSpeed);
    // Si ya llegamos al punto
    if (camera.position.distanceTo(targetPosition) <= 3) {
      camera.position.copy(targetPosition);

      // Fijamos el target en el objeto seleccionado
      controls.target.copy(targetLookAt);

      controls.enabled = true;
      isMovingCamera = false;
      // updateLabelVisibility();
    }
    updateLabelPositions();

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
  composer.render();
}


const btnFocusPlace = document.getElementById('btnFocusPlace');
if (btnFocusPlace) {
  btnFocusPlace.addEventListener('click', () => {
    const placeName = btnFocusPlace.getAttribute('data-place') || 'NB05';
    console.log('Botón 1 presionado:', placeName);
    focusSitPlace(placeName);
  });
}

const btnFocusPlace2 = document.getElementById('btnFocusPlace2');
if (btnFocusPlace2) {
  btnFocusPlace2.addEventListener('click', () => {
    const placeName2 = btnFocusPlace2.getAttribute('data-place') || 'ON11';
    console.log('Botón 2 presionado:', placeName2);
    focusSitPlace(placeName2);
  });
}

animate();
