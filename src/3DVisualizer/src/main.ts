import './style.css'
import {
  Scene, EquirectangularReflectionMapping,
  PerspectiveCamera, WebGLRenderer,
  Mesh, MeshStandardMaterial
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
enum ProjectBaseURL {
    TRIPTRAPP = 'https://apiapp.tockall-triptrapp.com/api',
    CAFAM = 'https://apiapp.cafammelgar.tockall.com/api',
    ZYON_PRU = 'https://as-ws-siteit-test.azurewebsites.net/api',
    ZYON = 'https://apiapp.zyon.tockall.com/api'
}
//import Stats from 'three/addons/libs/stats.module.js'
//import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'
const urlParams = new URLSearchParams(window.location.search);
const placeId = urlParams.get('placeId');
const companyId = urlParams.get('companyId');
//const project = urlParams.get('project');
const scene = new Scene();
const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
const BASE_URL = `${window.location.origin}${basePath}/models/`;
const PROJECT = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const PROJECT_BASE = ProjectBaseURL[PROJECT];

new RGBELoader().load('img/venice_sunset_1k.hdr', (texture) => {
  texture.mapping = EquirectangularReflectionMapping
  scene.environment = texture
})

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(1.5, 0.75, 2)

const renderer = new WebGLRenderer({ antialias: true })
//renderer.toneMapping = THREE.ACESFilmicToneMapping
//renderer.toneMappingExposure = 0.1
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// const textureLoader = new THREE.TextureLoader()
// const textureFlare0 = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/First-Car-Shooter@main/dist/client/img/lensflare0.png')

// const lensflare = new Lensflare()
// lensflare.addElement(new LensflareElement(textureFlare0, 1000, 0))
// light.add(lensflare)

console.log("placeId: " + placeId)
console.log("CompanyId: " + companyId)//Cargar el modelo GLTF con el company ID y seleccionar y cambiar de material al objetivo con el place ID
//new GLTFLoader().load("https://strg01tockall.blob.core.windows.net/container-unity/Maps3D-UI-test/models/"+placeId+"_"+project+".glb", (gltf) => {
new GLTFLoader().load(`${BASE_URL}${PROJECT_BASE}/${companyId}.glb`, (gltf) => {
// const suzanne = gltf.scene.getObjectByName('Suzanne') as THREE.Mesh
  // suzanne.castShadow = true

  // const plane = gltf.scene.getObjectByName('Plane') as THREE.Mesh
  // plane.receiveShadow = true
  if(placeId!=null){
  const objeto = gltf.scene.getObjectByName(placeId);
  if (objeto && objeto instanceof Mesh) {
  const materialMoradoTranslucido = new MeshStandardMaterial({
    color: 0x8000ff,
    transparent: true,
    opacity: 0.5,
    roughness: 0.5,
    metalness: 0.1
  });

  objeto.material = materialMoradoTranslucido;
} else {
  console.warn("Objeto no encontrado o no es un Mesh:", objeto);
}
}


  scene.add(gltf.scene)
})
function animate() {
  requestAnimationFrame(animate)

  controls.update()

  renderer.render(scene, camera)

}

animate()