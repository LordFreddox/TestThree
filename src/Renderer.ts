import { Scene, AmbientLight, WebGLRenderer, Color,
    /* OrthographicCamera,*/ DirectionalLight,
    PerspectiveCamera, 
} from 'three';
import { updateLabelPositions } from './view.ts';

let scene: Scene;
let renderer: WebGLRenderer;
let canvas: HTMLCanvasElement;
// let camera: OrthographicCamera;
let camera: PerspectiveCamera;

scene = new Scene();
renderer = new WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('canvas')! });
renderer.setClearColor(0x000000, 0);
scene.background = new Color(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
canvas = document.querySelector('canvas')!;
// camera = new OrthographicCamera(
//     -20 * (window.innerWidth / window.innerHeight) / 2,
//     20 * (window.innerWidth / window.innerHeight) / 2, 
//     20 / 2, 
//     -20 / 2, 
//     1, 
//     1500);
camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
const light = new DirectionalLight(0xffffff, 1);
const ambientLight = new AmbientLight(0xffffff, 1.5); // Luz blanca suave
scene.add(ambientLight, light);

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

export { scene, camera, renderer, canvas };