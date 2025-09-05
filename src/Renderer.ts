import { Scene, AmbientLight, WebGLRenderer, Color,
    /* OrthographicCamera,*/ DirectionalLight,
    PerspectiveCamera, Vector2,Fog
} from 'three';
import { updateLabelPositions } from './view.ts';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene: Scene;
let renderer: WebGLRenderer;
let canvas: HTMLCanvasElement;
// let camera: OrthographicCamera;
let camera: PerspectiveCamera;

scene = new Scene();
renderer = new WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('canvas')! });
renderer.setClearColor(0x000000, 0);
scene.background = new Color(0x404040);
renderer.setSize(window.innerWidth, window.innerHeight);
canvas = document.querySelector('canvas')!;
// camera = new OrthographicCamera(
//     -20 * (window.innerWidth / window.innerHeight) / 2,
//     20 * (window.innerWidth / window.innerHeight) / 2, 
//     20 / 2, 
//     -20 / 2, 
//     1, 
//     1500);
camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1,4000);
const light = new DirectionalLight(0xffffff, 1);
const ambientLight = new AmbientLight(0xffffff, 1.5); // Luz blanca suave
scene.add(ambientLight, light);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength (intensidad del bloom)
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

//scene.fog = new Fog(0x808080, 50, 800); //niebla de las escenas, por definir con tamaño de escena

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    // camera.left = -20 * (window.innerWidth / window.innerHeight) / 2;
    // camera.right = 20 * (window.innerWidth / window.innerHeight) / 2;
    // camera.top = 20 / 2;
    // camera.bottom = -20 / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateLabelPositions();
}

export { scene, camera, renderer, canvas, composer };