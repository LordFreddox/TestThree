import { Scene, AmbientLight, WebGLRenderer, Color,
  OrthographicCamera, AnimationMixer, Object3D,
  AnimationClip, Raycaster, Vector2, Clock, Vector3,
  DirectionalLight, Intersection, LoopOnce, Box3, Mesh,
  SphereGeometry, MeshBasicMaterial, BackSide, MeshStandardMaterial
} from 'three'
import { GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GetPlaces, Place, PROJECT} from './http-service.js';

const loadingscreen = (document.getElementById('loadingMain') as HTMLFormElement);
const loadingBar = document.getElementById('loading-bar') as HTMLElement;
const tutorial = document.getElementById('tutorial') as HTMLElement;
const searchBar = document.getElementById('search-bar') as HTMLInputElement;
searchBar?.addEventListener('input', () => {
  const searchTerm = searchBar.value.toLowerCase();
  filterCarouselItems(searchTerm);
});
const labelContainerElem = document.querySelector( '#labelsScene' );

const scene = new Scene();
const BASE_URL = 'https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/models/';
//let animationArray = [] as THREE.AnimationAction[];
const renderer = new WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('canvas')! });
renderer.setClearColor(0x000000, 0);
scene.background = new Color(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.localClippingEnabled = true; // Habilitar clipping
//document.body.appendChild(renderer.domElement);
const canvas = document.querySelector('canvas')!;
// Cámara ortográfica
const camera = new OrthographicCamera(
  -20 * (window.innerWidth / window.innerHeight) / 2,
  20 * (window.innerWidth / window.innerHeight) / 2, 
  20 / 2, 
  -20 / 2, 
  1, 
  1500);

//const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 2000)

let mixers: AnimationMixer[] = [];
let allAvailableAnimationClipsMap = new Map<Object3D, AnimationClip[]>();
const raycaster = new Raycaster();
const mouse = new Vector2()
const clock = new Clock();
let MapObjectsListByCategoryName = {} as { [key: string]: Object3D[] };
let MapObjectPlacesText = {} as { [key: string]: Object3D[] };
const originalColors = new Map<Object3D, Color>();
let lookAtCamera: Object3D[] = [];
let floorLevels: Object3D[] = [];
let labelsScene = new Map<Vector3, HTMLDivElement>();

const tempV = new Vector3();
interface LabelData {
  elem: HTMLDivElement;
  x: number;
  y: number;
  zIndex: number;
}
const paddingBetweenText = 30;
const COLOR_SELECTED = new Color(0x733D96);
const controls = new OrbitControls(camera, renderer.domElement)
controls.minPolarAngle = Math.PI / 10;                // Permitir vista directamente hacia abajo
controls.maxPolarAngle = Math.PI / 2.1;      // Limitar angulo de camara
controls.enableDamping = true;             // Movimiento suave
var minPan = new Vector3();
var maxPan = new Vector3();
var _v = new Vector3();

function updateLabelPositions() {
  labelsScene.forEach((elem, position) => {
    if(elem.style.display == 'none') return;
    tempV.copy(position);
    tempV.project(camera);

    // convert the normalized position to CSS coordinates
    const x = (tempV.x * .5 + .5) * canvas.clientWidth;
    const y = (tempV.y * - .5 + .5) * canvas.clientHeight;

    elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
  });
}

function updateLabelVisibility() {
  const labelData: LabelData[] = [];

  labelsScene.forEach((elem, position) => {
    if(elem.classList.contains('NoHide') || elem.classList.contains('HideFromFloor')) return;
    tempV.copy(position);
    tempV.project(camera);

    // convert the normalized position to CSS coordinates
    const x = (tempV.x * .5 + .5) * canvas.clientWidth;
    const y = (tempV.y * - .5 + .5) * canvas.clientHeight;
    const zIndex = (-tempV.z * .5 + .5) * 100000 | 0;

    // Store the label data
    labelData.push({ elem, x, y, zIndex });
    elem.style.display = 'block';
  });

  // Sort labels by zIndex in descending order
  labelData.sort((a, b) => b.zIndex - a.zIndex);

  // Hide overlapping labels
  for (let i = 0; i < labelData.length; i++) {
    const { elem, x, y, zIndex } = labelData[i];
    let overlap = false;

    for (let j = 0; j < i; j++) {
      const other = labelData[j];
      if (Math.abs(x - other.x) < elem.offsetWidth + paddingBetweenText && Math.abs(y - other.y) < elem.offsetHeight + paddingBetweenText) {
        overlap = true;
        break;
      }
    }

    if (overlap || (i > 0 && labelData[i - 1].zIndex === zIndex)) {
      elem.style.display = 'none';
    } else {
      elem.style.display = 'block';
      elem.style.zIndex = zIndex.toString();
    }
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
});

controls.update();
let interactObjects = [] as Object3D[];

/*function animateCamera(newtarget: THREE.Vector3, duration: number) {
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
        controls.update();
        requestAnimationFrame(update);
      }
      else {
        controls.target.copy(newtarget);
      }
  }

  update();
}*/

const light = new DirectionalLight(0xffffff, 1);
const ambientLight = new AmbientLight(0xffffff, 1.5); // Luz blanca suave
scene.add(ambientLight, light);

const urlParams = new URLSearchParams(window.location.search);
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

function GetPlacesReal(companyId: string){
  GetPlaces(companyId).then(json => {
    json.data_place.places.forEach((place) => {
    const object = scene.getObjectByName(place.place_id.toString());
    if (object) {
      AddCarouselItem(place.companysubsidiary_image_url, place.companysubsidiary_name, object);
      object.userData = place;
      if (!MapObjectsListByCategoryName[place.place_category_name]) {
        MapObjectsListByCategoryName[place.place_category_name] = [];
      }
      MapObjectsListByCategoryName[place.place_category_name].push(object);
      CreateTextForPlace(place, object);
    }
    });
    //CreateButtonFilters();
  }).catch((error) => {
    console.error("Error al obtener los lugares:", error);
  });
}

function GetPlacesFake(){
  fetch('src/response_bot.json')
  .then(json => {
    if (!json.ok) {
      console.log('Network response was not ok');
    }
    return json.json();
  })
  .then(json => {
    let places: Place[];
    if(PROJECT === 'BOT'){
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
    }else{
      places = json.response.data_place.places;
    }
    places.forEach((place) => {
    const object = scene.getObjectByName(place.place_id.toString());
    if (object) {
      AddCarouselItem(place.companysubsidiary_image_url, place.companysubsidiary_name, object);
      object.userData = place;
      if (!MapObjectsListByCategoryName[place.place_category_name]) {
        MapObjectsListByCategoryName[place.place_category_name] = [];
      }
      MapObjectsListByCategoryName[place.place_category_name].push(object);
      CreateTextForPlace(place, object);
    }
    });
    updateLabelPositions();
    updateLabelVisibility();
    //CreateButtonFilters();
  });
}

function findFloorObject(object: Object3D): Object3D | null {
  let current: Object3D | null = object;
  while (current) {
    if (floorLevels.includes(current)) return current;
    current = current.parent;
  }
  return null;
}

function CreateTextForPlace(place: Place, placeObject: Object3D, fontSize = 1, isNoHide = false) {
  const elem = document.createElement( 'div' );
  const formattedKey = place.companysubsidiary_name.split(' - ')[0].replace(/ /g, '\n');
  elem.textContent = formattedKey;
  elem.style.fontSize = fontSize + 'em';
  if(isNoHide)
    elem.classList.add('NoHide');
  labelContainerElem!.appendChild( elem );
  const { size, center } = GetBoundingBoxSizeAndCenterOfObject(placeObject);
  const topCenterPosition = new Vector3(center.x, center.y + size.y, center.z);
  labelsScene.set(topCenterPosition, elem);
  const floorObj = findFloorObject(placeObject);
  const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
  elem.dataset.floorIndex = floorIndex.toString();
}

/*function CreateButtonFilters() {
    const loader = new GLTFLoader();
    loader.load('./models/ButtonFilterPrefab.glb', (gltf) => {
        const prefab = gltf.scene;
        const backgroundSphere = scene.getObjectByName('backgroundSphere');
        if (backgroundSphere) {
            scene.remove(backgroundSphere);
        }
        const { size } = GetBoundingBoxSizeAndCenterOfObject(scene);      

        if (backgroundSphere) {
            scene.add(backgroundSphere);
        }
        let zPosition = size.z / 2;
        for (const key in MapObjectsListByCategoryName) {
          const button = prefab.clone(true).children[0];
          button.userData.place_category_name = key;
          button.position.set((size.x / 2) + 3.5, 0, zPosition / 2);
          const mixer = new AnimationMixer(button);
          const animationClips = gltf.animations.map(clip => clip.clone());
          allAvailableAnimationClipsMap.set(button, animationClips);
          animationClips.forEach((clip) => {
              mixer.clipAction(clip);
          });
          mixers.push(mixer);
          button.visible = true;
          scene.add(button);

          const formattedKey = key.replace(/ /g, '\n');
          CreateTextForPlace(formattedKey, button, 2, true);

          zPosition -= 10;
      }
    });
}*/

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
        const intersectedInteract = intersects[i].object;
        //intersectedInteract.getWorldPosition(worldPosition);
        //controls.target.copy(intersectedInteract.position);
        RestoreOriginalColors();
        const animationClips = allAvailableAnimationClipsMap.get(intersectedInteract);
        if (animationClips) {
          const clip = AnimationClip.findByName(animationClips, intersectedInteract.userData.animationName);
          const mixer = mixers.find((mixer) => mixer.getRoot() === intersectedInteract);
          if (mixer && clip) {
            const action = mixer.clipAction(clip);
            action.play().setLoop(LoopOnce, 1);
          }
        }
        ChangeObjectColorsByCategory(intersectedInteract.userData.place_category_name, COLOR_SELECTED);
        break;
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

function ChangeObjectColorsByCategory(category: string, color: Color) {
  if (MapObjectsListByCategoryName[category]) {
    MapObjectsListByCategoryName[category].forEach((object) => {
      ChangeColorOfSingleObject(object, color);
    });
  }
}

function ChangeColorOfSingleObject(object: Object3D, color: Color) {
  object.traverse((child) => {
    if (child instanceof Mesh) {
      const mesh = child;
      const material = mesh.material as MeshStandardMaterial;

      if (!originalColors.has(mesh)) {
        originalColors.set(mesh, material.color.clone());
      }

      mesh.material = material.clone();
      (mesh.material as MeshStandardMaterial).color.set(color);
    }
  });
}

function RestoreOriginalColors() {
  originalColors.forEach((color, object) => {
    const mesh = object as Mesh;
    (mesh.material as MeshStandardMaterial).color.copy(color);
  });
  for (const key in MapObjectPlacesText) {
    MapObjectPlacesText[key].forEach((text) => {
      text.visible = false;
    });
  }
  originalColors.clear();
}

function AddCarouselItem(imageUrl: string, description: string, object: Object3D) {
  const carouselContainer = document.querySelector('.carousel-container');
  const newItem = document.createElement('div');
  newItem.classList.add('carousel-item');
  newItem.innerHTML = `
    <img src="${imageUrl}" alt="${description}">
    <p>${description}</p>
  `;
  carouselContainer!.appendChild(newItem);
  newItem.addEventListener('click', () => {
    RestoreOriginalColors();
    ChangeColorOfSingleObject(object, COLOR_SELECTED);
    const floorObj = findFloorObject(object);
    const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
    const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
    floorSelector.value = floorIndex.toString(); 
    showFloor(floorIndex);
  });
}

function filterCarouselItems(searchTerm: string) {
  const carouselItems = document.querySelectorAll('.carousel-item');
  carouselItems.forEach((item) => {
    const description = item.querySelector('p')!.textContent!.toLowerCase();
    if (description.includes(searchTerm)) {
      (item as HTMLElement).classList.remove('hidden');
    } else {
      (item as HTMLElement).classList.add('hidden');
    }
  });
}

const loader = new GLTFLoader();
loader.load(
  modelUrl,
  (gltf) => {
    tutorial.style.display='flex';
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
          if (child.name.includes('INTERACT_')){
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

    if(floorLevels.length > 0){
      initFloorSelector();
    }
    
    const companyId = new URLSearchParams(window.location.search).get('placeId') || "0";
    
    if (companyId === "0" || window.location.hostname === "localhost") {
      GetPlacesFake();
    }else{
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

function initFloorSelector() {
  const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
  floorSelector.style.display = 'block';

  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '-1';
  defaultOption.text = 'Todos los Pisos';
  floorSelector.appendChild(defaultOption);

  floorLevels.forEach((floor, index) => {
    const option = document.createElement('option');
    option.value = index.toString();
    option.text = `Piso ${index + 1}`;
    floorSelector.appendChild(option);
  });

  floorSelector.addEventListener('change', (event) => {
    const selectedIndex = parseInt((event.target as HTMLSelectElement).value, 10);
    showFloor(selectedIndex);
  });
}

function showFloor(index: number) {
  if (index === -1) {
    // Show all floors
    floorLevels.forEach((floor) => {
      floor.visible = true;
    });
  } else {
    // Show only the selected floor
    floorLevels.forEach((floor, i) => {
      floor.visible = (i === index);
    });
  }
  labelsScene.forEach((elem) => {
    const labelFloorIndex = parseInt(elem.dataset.floorIndex || '-1', 10);
    if(index === -1 || index === labelFloorIndex){
      elem.style.display = 'block';
      elem.classList.remove('HideFromFloor');
    }else{
      elem.style.display = 'none';
      elem.classList.add('HideFromFloor');
    }
  });
  updateLabelPositions();
  updateLabelVisibility();
}

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