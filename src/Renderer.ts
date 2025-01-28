import { Scene, AmbientLight, WebGLRenderer, Color,
    OrthographicCamera, DirectionalLight, 
} from 'three';

let scene: Scene;
let renderer: WebGLRenderer;
let canvas: HTMLCanvasElement;
let camera: OrthographicCamera;

scene = new Scene();
renderer = new WebGLRenderer({ antialias: true, alpha: true, canvas: document.querySelector('canvas')! });
renderer.setClearColor(0x000000, 0);
scene.background = new Color(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
canvas = document.querySelector('canvas')!;
camera = new OrthographicCamera(
    -20 * (window.innerWidth / window.innerHeight) / 2,
    20 * (window.innerWidth / window.innerHeight) / 2, 
    20 / 2, 
    -20 / 2, 
    1, 
    1500);
const light = new DirectionalLight(0xffffff, 1);
const ambientLight = new AmbientLight(0xffffff, 1.5); // Luz blanca suave
scene.add(ambientLight, light);

export { scene, camera, renderer, canvas };