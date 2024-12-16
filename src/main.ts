import * as THREE from 'three'
//import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader , GLTF} from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { AmbientLight } from 'three';
import { GetPlaces, Place} from './http-service.js';

const loadingscreen = (document.getElementById('loading') as HTMLFormElement);
const loadingBar = document.getElementById('loading-bar') as HTMLElement;
const tutorial = document.getElementById('tutorial') as HTMLElement;
// Add event listener to search bar
const searchBar = document.getElementById('search-bar') as HTMLInputElement;
searchBar?.addEventListener('input', () => {
  const searchTerm = searchBar.value.toLowerCase();
  filterCarouselItems(searchTerm);
});
const scene = new THREE.Scene();
const BASE_URL = 'https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/ThreeJSProduction/MapsThree/models/';
//let animationArray = [] as THREE.AnimationAction[];
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setClearColor(0x000000, 0);
scene.background = new THREE.Color(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.localClippingEnabled = true // Habilitar clipping
document.body.appendChild(renderer.domElement)
let mixers: THREE.AnimationMixer[] = [];
let allAvailableAnimationClipsMap = new Map<THREE.Object3D, THREE.AnimationClip[]>();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2()
const clock = new THREE.Clock();
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 20;
const left = -frustumSize * aspect / 2;
const right = frustumSize * aspect / 2;
const top = frustumSize / 2;
const bottom = -frustumSize / 2;
const near = 1;// se corta el modelo
const far = 1500;
let MapObjectsListByCategoryName = {} as { [key: string]: THREE.Object3D[] };
const originalColors = new Map<THREE.Object3D, THREE.Color>();

// Cámara ortográfica
const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
const controls = new OrbitControls(camera, renderer.domElement)
controls.minPolarAngle = 0;                // Permitir vista directamente hacia abajo
controls.maxPolarAngle = Math.PI / 2.1;      // Limitar angulo de camara
var minPan = new THREE.Vector3( -10, -10, -10);
var maxPan = new THREE.Vector3( 10, 10, 10);
var _v = new THREE.Vector3();

controls.addEventListener('change', () => {
//camera.updateProjectionMatrix();

  /*const offset = new THREE.Vector3();
  offset.copy(camera.position).sub(controls.target); 

  // límites de paneo en X y Z
  controls.target.x = Math.max(controlOrbitPanLimits.xMin, Math.min(controlOrbitPanLimits.xMax, controls.target.x));
  controls.target.z = Math.max(controlOrbitPanLimits.zMin, Math.min(controlOrbitPanLimits.zMax, controls.target.z));
  controls.target.y = 0;

  // Ajusta la posición de la cámara en consecuencia
  camera.position.x = controls.target.x + offset.x;
  camera.position.z = controls.target.z + offset.z;
  camera.position.y = controls.target.y + offset.y; // Altura constante*/

  _v.copy(controls.target);
  controls.target.clamp(minPan, maxPan);
  _v.sub(controls.target);
  camera.position.sub(_v);
});

controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.update()
let interactObjects = [] as THREE.Object3D[];

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

/*new RGBELoader().load('img/cumulus_sky_dome_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const geometry = new THREE.SphereGeometry(1, 60, 40);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });

  const backgroundSphere = new THREE.Mesh(geometry, material);
  backgroundSphere.name = 'backgroundSphere';
  scene.add(backgroundSphere);
});*/

const light = new THREE.DirectionalLight(0xffffff, 1);
const ambientLight = new AmbientLight(0xffffff, 1.5); // Luz blanca suave
scene.add(ambientLight, light);

const loader = new GLTFLoader();
function loadModelWithCallback(
  url: string,
  onLoad: (gltf: GLTF) => void,
  onProgress?: (xhr: ProgressEvent) => void,
) {
  loader.load(
    url,
    (gltf) => {

      onLoad(gltf);
    },
    onProgress,
  );
}

const placeId = new URLSearchParams(window.location.search).get('placeId') || "0";
const modelUrl = placeId === "0" ? BASE_URL + 'default' + '.glb' : BASE_URL + placeId + '.glb';

loadModelWithCallback(
  modelUrl,
  (gltf) => {
    tutorial.style.display='flex';
    gltf.scene.position.set(0, 0, 0);
    scene.add(gltf.scene);

    //calculate bounding box of the scene to set camera position
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    camera.position.set(center.x + 10, center.y + size.y + 10, center.z + size.z + 10);
    camera.far = size.length() * 10;

    //create skybox
    const geometry = new THREE.SphereGeometry(1, 60, 40);
    const material = new THREE.MeshBasicMaterial({
      color: 0xCBCBCB,
      side: THREE.BackSide,
    });
    const backgroundSphere = new THREE.Mesh(geometry, material);
    scene.add(backgroundSphere);
    backgroundSphere.scale.set(
        size.length() + 100, size.length() + 100, size.length() + 100);

    minPan = new THREE.Vector3(-size.length() / 4, 0, -size.length() / 4);
    maxPan = new THREE.Vector3(size.length() / 4, 0, size.length() / 4);
    controls.minZoom = 0.5;
    controls.maxZoom = size.length() / 10;
    controls.update();

    //populate animation array
    const mixer = new THREE.AnimationMixer(gltf.scene);
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
    loadingscreen.style.display = "none";
    document.getElementById('footer')!.style.display = 'block';
    const companyId = new URLSearchParams(window.location.search).get('placeId') || "0";
    
    if (companyId === "0" || window.location.hostname === "localhost") {
      GetPlacesFake();
    }else{
      GetPlacesReal(companyId);
    }
  },
  (xhr) => {
    const progress = (xhr.loaded / xhr.total) * 100;
    
    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }
  },
);

function GetPlacesReal(companyId: string){
  GetPlaces(companyId).then(json => {
    const places: Place[] = json.data_place;
    places.forEach((place) => {
    const object = scene.getObjectByName(place.place_id.toString());
    if (object) {
      AddCarouselItem(place.companysubsidiary_image_url, place.companysubsidiary_name, object);
      object.userData = place;
      if (!MapObjectsListByCategoryName[place.place_category_name]) {
        MapObjectsListByCategoryName[place.place_category_name] = [];
      }
      MapObjectsListByCategoryName[place.place_category_name].push(object);
    }
    });
    CreateButtonFilters();
  }).catch((error) => {
    console.error("Error al obtener los lugares:", error);
  });
}

function GetPlacesFake(){
  fetch('src/response.json')
  .then(json => {
    if (!json.ok) {
      console.log('Network response was not ok');
    }
    return json.json();
  })
  .then(json => {
    const places: Place[] = json.response.data_place.places;
    places.forEach((place) => {
    const object = scene.getObjectByName(place.place_id.toString());
    if (object) {
      AddCarouselItem(place.companysubsidiary_image_url, place.companysubsidiary_name, object);
      object.userData = place;
      if (!MapObjectsListByCategoryName[place.place_category_name]) {
        MapObjectsListByCategoryName[place.place_category_name] = [];
      }
      MapObjectsListByCategoryName[place.place_category_name].push(object);
    }
    });
    CreateButtonFilters();
  });
}

function CreateButtonFilters() {
  const loader = new GLTFLoader();
  loader.load('./models/ButtonFilterPrefab.glb', (gltf) => {
    const prefab = gltf.scene;
    let zPosition = prefab.children[0].position.z - 5;
    // Iterate through keys on Map MapObjectsListByCategoryName
    for (const key in MapObjectsListByCategoryName) {
      const button = prefab.clone(true).children[0];
      button.userData.place_category_name = key;
      button.position.z = zPosition;
      const mixer = new THREE.AnimationMixer(button);
      const animationClips = gltf.animations.map(clip => clip.clone());
      allAvailableAnimationClipsMap.set(button, animationClips);
      animationClips.forEach((clip) => {
        mixer.clipAction(clip);
      });
      mixers.push(mixer);
      zPosition -= 5;
      button.visible = true;
      scene.add(button);
    }
    /*prefab.traverse(child => {
      child.visible = false;
    });*/
  });
}

let hasUserInteracted = false;

controls.addEventListener('start', () => {
  if (!hasUserInteracted) {
    //console.log("El usuario ha interactuado por primera vez.");
    hasUserInteracted = true;
    // Quitamos el tutorial
    tutorial.style.display = 'none';
  }
});

controls.addEventListener('change', () => {
  //console.log("El usuario ha interactuado");
  const cameraRotationZ = camera.rotation.z;
    // Actualizar la rotación de los objetos interactuables
    interactObjects.forEach((object) => {
        object.rotation.z = cameraRotationZ;
    });
});

function animate() {
  renderer.render(scene, camera);
  controls.update();
  mixers.forEach((mixer) => 
    mixer.update(clock.getDelta())
  );
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/*window.addEventListener('resize', () => {
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
});*/

window.addEventListener('pointerup', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Remove the previous debug line if it exists
  //scene.remove(scene.getObjectByName('rayLine')!);

  const intersects: THREE.Intersection[] = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].object.userData.isInteractable) {
        const intersectedInteract = intersects[i].object;
        //intersectedInteract.getWorldPosition(worldPosition);
        //controls.target.copy(intersectedInteract.position);
        RestoreOriginalColors();
        const animationClips = allAvailableAnimationClipsMap.get(intersectedInteract);
        if (animationClips) {
          const clip = THREE.AnimationClip.findByName(animationClips, intersectedInteract.userData.animationName);
          const mixer = mixers.find((mixer) => mixer.getRoot() === intersectedInteract);
          if (mixer && clip) {
            const action = mixer.clipAction(clip);
            action.play().setLoop(THREE.LoopOnce, 1);
          }
        }
        ChangeObjectColorsByCategory(intersectedInteract.userData.place_category_name, new THREE.Color(0xff0000));
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

function ChangeObjectColorsByCategory(category: string, color: THREE.Color) {
  if (MapObjectsListByCategoryName[category]) {
    MapObjectsListByCategoryName[category].forEach((object) => {
      ChangeColorOfSingleObject(object, color);
    });
  }
}

function ChangeColorOfSingleObject(object: THREE.Object3D, color: THREE.Color) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mesh = child;
      const material = mesh.material as THREE.MeshStandardMaterial;

      // Store the original color if not already stored
      if (!originalColors.has(mesh)) {
        originalColors.set(mesh, material.color.clone());
      }

      // Clone the material to ensure each object has its own instance
      mesh.material = material.clone();
      (mesh.material as THREE.MeshStandardMaterial).color.set(color);
    }
  });
}

function RestoreOriginalColors() {
  originalColors.forEach((color, object) => {
    const mesh = object as THREE.Mesh;
    (mesh.material as THREE.MeshStandardMaterial).color.copy(color);
  });

  // Clear the map after restoring colors
  originalColors.clear();
}

function AddCarouselItem(imageUrl: string, description: string, object: THREE.Object3D) {
  const carouselContainer = document.querySelector('.carousel-container');
  const newItem = document.createElement('div');
  newItem.classList.add('carousel-item');
  newItem.innerHTML = `
    <img src="${imageUrl}" alt="${description}">
    <p>${description}</p>
  `;
  carouselContainer!.appendChild(newItem);
  //add a button event to the item
  newItem.addEventListener('click', () => {
    RestoreOriginalColors();
    ChangeColorOfSingleObject(object, new THREE.Color(0xff0000));
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