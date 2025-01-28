import {
  Color, AnimationMixer, Object3D,
  AnimationClip, Raycaster, Vector2, Clock, Vector3,
  Intersection, LoopOnce, Box3, Mesh,
  SphereGeometry, MeshBasicMaterial, BackSide, MeshStandardMaterial
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GetPlaces, Place, PROJECT } from './http-service.js';
import { scene, camera, renderer, canvas } from './Renderer.ts';
import {
  initFloorSelector, initCategorySelector, AddCarouselItem,
  updateLabelPositions, updateLabelVisibility, findFloorObject,
  MapObjectsListByCategoryName
} from './view.ts';
import { createNavMeshAndDisplayPath } from './Navigator.ts';

const urlParams = new URLSearchParams(window.location.search);
const labelContainerElem = document.querySelector('#labelsScene');
const loadingscreen = (document.getElementById('loadingMain') as HTMLFormElement);
const loadingBar = document.getElementById('loading-bar') as HTMLElement;
const tutorial = document.getElementById('tutorial') as HTMLElement;
const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
const BASE_URL = `${window.location.origin}${basePath}/models/`;
const companyId = urlParams.get('placeId') || "0";
let mixers: AnimationMixer[] = [];
let allAvailableAnimationClipsMap = new Map<Object3D, AnimationClip[]>();
const raycaster = new Raycaster();
const mouse = new Vector2()
const clock = new Clock();
let lookAtCamera: Object3D[] = [];
let floorLevels: Object3D[] = [];
let labelsScene = new Map<Vector3, HTMLDivElement>();
let interactObjects = [] as Object3D[];

const controls = new OrbitControls(camera, renderer.domElement)
controls.minPolarAngle = Math.PI / 10;     // Permitir vista directamente hacia abajo
controls.maxPolarAngle = Math.PI / 2.1;    // Limitar angulo de camara
controls.enableDamping = true;             // Movimiento suave
var minPan = new Vector3();
var maxPan = new Vector3();
var _v = new Vector3();

controls.addEventListener('change', () => {
  updateLabelPositions(labelsScene);
  _v.copy(controls.target);
  controls.target.clamp(minPan, maxPan);
  _v.sub(controls.target);
  camera.position.sub(_v);
});

controls.addEventListener('end', () => {
  updateLabelVisibility(labelsScene);
});

controls.update();

const placeId = urlParams.get('fakeId') || urlParams.get('placeId') || "0";
let modelUrl: string;
if (window.location.hostname === "localhost") {
  modelUrl = './models/' + placeId + '.glb';
} else {
  modelUrl = placeId === "0" ? BASE_URL + 'default' + '.glb' : BASE_URL + placeId + '.glb';
}

function GetBoundingBoxSizeAndCenterOfObject(object: Object3D) {
  const box = new Box3().setFromObject(object);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { size, center };
}

function GetPlacesReal(companyId: string) {
  GetPlaces(companyId).then(json => {
    let places: Place[];
    if (PROJECT === 'BOT') {
      //initialize places array with objects
      places = json.data.places.map(() => ({} as Place));
      for (let i = 0; i < json.data.places.length; i++) {
        places[i].place_id = json.data.places[i].id;
        places[i].place_category_name = json.data.places[i].category;
        places[i].place_area_name = json.data.places[i].floor.name;
        places[i].place_area_id = json.data.places[i].floor.id;
        places[i].companysubsidiary_name = json.data.places[i].name;
        places[i].companysubsidiary_image_url = json.data.places[i].image;
        places[i].company_id = json.data.places[i].company.id;
        places[i].company_name = json.data.places[i].company.name;
      }
    } else {
      places = json.data_place.places;
    }
    places.forEach((place) => {
      const object = scene.getObjectByName(place.place_id.toString());
      if (object) {
        AddCarouselItem(place.companysubsidiary_image_url, place.companysubsidiary_name, object,
          floorLevels, labelsScene);
        object.userData = place;
        if (!MapObjectsListByCategoryName[place.place_category_name]) {
          MapObjectsListByCategoryName[place.place_category_name] = [];
        }
        MapObjectsListByCategoryName[place.place_category_name].push(object);
        CreateTextForPlace(place, object);
      }
    });
    updateLabelPositions(labelsScene);
    updateLabelVisibility(labelsScene);
    initCategorySelector(labelsScene);
  }).catch((error) => {
    console.error("Error al obtener los lugares:", error);
  });
}

function GetPlacesFake() {
  fetch(`src/testJsons/response_${companyId}.json`)
    .then(json => {
      if (!json.ok) {
        console.log('Network response was not ok');
      }
      return json.json();
    })
    .then(json => {
      let places: Place[];
      if (PROJECT === 'BOT') {
        //initialize places array with objects
        places = json.data.places.map(() => ({} as Place));
        for (let i = 0; i < json.data.places.length; i++) {
          places[i].place_id = json.data.places[i].id;
          places[i].place_category_name = json.data.places[i].category;
          places[i].place_area_name = json.data.places[i].floor.name;
          places[i].place_area_id = json.data.places[i].floor.id;
          places[i].companysubsidiary_name = json.data.places[i].name;
          places[i].companysubsidiary_image_url = json.data.places[i].image;
          places[i].company_id = json.data.places[i].company.id;
          places[i].company_name = json.data.places[i].company.name;
        }
      } else {
        places = json.response.data_place.places;
      }
      places.forEach((place) => {
        const object = scene.getObjectByName(place.place_id.toString());
        if (object) {
          AddCarouselItem(place.companysubsidiary_image_url, place.companysubsidiary_name, object,
            floorLevels, labelsScene);
          object.userData = place;
          if (!MapObjectsListByCategoryName[place.place_category_name]) {
            MapObjectsListByCategoryName[place.place_category_name] = [];
          }
          MapObjectsListByCategoryName[place.place_category_name].push(object);
          CreateTextForPlace(place, object);
        }
      });
      updateLabelPositions(labelsScene);
      updateLabelVisibility(labelsScene);
      initCategorySelector(labelsScene);
    });
}

function CreateTextForPlace(textName: Place, placeObject: Object3D, fontSize = 1) {
  const elem = document.createElement('div');
  const formattedKey = textName.companysubsidiary_name.split(' - ')[0].replace(/ /g, '\n');
  elem.textContent = formattedKey;
  elem.style.fontSize = fontSize + 'em';
  labelContainerElem!.appendChild(elem);
  const { size, center } = GetBoundingBoxSizeAndCenterOfObject(placeObject);
  const topCenterPosition = new Vector3(center.x, center.y + size.y, center.z);
  labelsScene.set(topCenterPosition, elem);
  const floorObj = findFloorObject(placeObject, floorLevels);
  const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
  elem.dataset.floorIndex = floorIndex.toString();
  elem.dataset.category = textName.place_category_name;
}

let hasUserInteracted = false;

controls.addEventListener('start', () => {
  if (!hasUserInteracted) {
    hasUserInteracted = true;
    tutorial.style.display = 'none';
  }
});

window.addEventListener('pointerup', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Remove the previous debug line if it exists
  //scene.remove(scene.getObjectByName('rayLine')!);

  const intersects: Intersection[] = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].object.userData.isInteractable) {
        //const intersectedInteract = intersects[i].object;
      }
    }
  }

  //add debug lines
  /*const rayOrigin = raycaster.ray.origin;
  const rayDirection = raycaster.ray.direction.clone().multiplyScalar(50); // Extend the direction for visualization
  const points = [rayOrigin, rayOrigin.clone().add(rayDirection)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const line = new THREE.Line(geometry, material);
  line.name = 'rayLine';
  scene.add(line);*/
});

const loader = new GLTFLoader();
loader.load(
  modelUrl,
  (gltf) => {
    tutorial.style.display = 'flex';
    gltf.scene.position.set(0, 0, 0);
    scene.add(gltf.scene);
    const { size, center } = GetBoundingBoxSizeAndCenterOfObject(gltf.scene);
    camera.position.set(size.x + 10, center.y + size.y + 13, 0);
    camera.far = size.length() * 10;
    camera.zoom = -size.length() / 10;
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
    const mixer = new AnimationMixer(gltf.scene);
    allAvailableAnimationClipsMap.set(gltf.scene, gltf.animations);
    let animationClips = gltf.animations;
    animationClips.forEach((clip) => {
      mixer.clipAction(clip).play();
    });
    mixers.push(mixer);

    gltf.scene.traverse(child => {
      if (child.name.includes('INTERACT_')) {
        interactObjects.push(child);
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

    if (floorLevels.length > 0) {
      initFloorSelector(floorLevels, labelsScene);
    }

    if(urlParams.get('ServType') == '1')//if servType 1 then calculate navmesh
    {
      const navmeshObj = gltf.scene.getObjectByName('navmesh');
      if (navmeshObj) {
        const startPosition = scene.getObjectByName(`${urlParams.get('Start')!}_objetivo`)!.position;
        const endPosition = scene.getObjectByName(`${urlParams.get('Place')!}_objetivo`)!.position;
        /*const startPosition = scene.getObjectByName("start")!.position;
        const endPosition = scene.getObjectByName("finish")!.position;*/

        createNavMeshAndDisplayPath(navmeshObj as Mesh, scene, startPosition, endPosition);
      }
    }

    //find all objects whos name end with _objetivo and set visible.false
    const objetivoParent = scene.getObjectByName("objetivos");
    if (objetivoParent) {
      const objetivoObjects = objetivoParent.children.filter(child => child.name.endsWith('_objetivo'));
      objetivoObjects.forEach(obj => obj.visible = false);
    }

    if (companyId === "0" || window.location.hostname === "localhost") {
      GetPlacesFake();
    } else {
      GetPlacesReal(companyId);
    }

    loadingscreen.style.display = "none";
    document.getElementById('footer')!.style.display = 'block';
  },
  (xhr) => {
    const progress = (xhr.loaded / xhr.total) * 100;

    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }

    //forceUpdateCircleAnimation();
  },
  (error) => {
    console.error('An error happened', error);
  }
);

function animate() {
  controls.update();
  mixers.forEach((mixer) =>
    mixer.update(clock.getDelta())
  );
  lookAtCamera.forEach((object) => {
    object.lookAt(camera.position);
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();