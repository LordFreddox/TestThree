import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load GLB model
const loader = new GLTFLoader();
let mixer: THREE.AnimationMixer;
let animationArray: THREE.AnimationAction[] | null = [];
let actionsObjectArray: THREE.Object3D[] = [];

loader.load('./models/chontabot.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    actionsObjectArray = model.children;

    //remove object that is not MAIN
    const mainObject = actionsObjectArray.find((child) => child.name === 'MAIN');
    if(mainObject)
        actionsObjectArray = actionsObjectArray.filter((child) => child !== mainObject);

    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
        animationArray.push(mixer.clipAction(clip));
    });

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        if (mixer) mixer.update(clock.getDelta());
        renderer.render(scene, camera);
    }
    animate();
}, undefined, (error) => {
    console.error(error);
});

// Set camera position
camera.position.z = 5;

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle mouse click
window.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        const actionObject = actionsObjectArray.find(actionObj => actionObj.name === object.name);
        if (actionObject) {
            const action = animationArray.find(animAction => animAction.getClip().name === object.name);
            if (action) {
            action.reset().play();
            // Stop all animations from array animationArray that are not the current action
            animationArray.forEach((animAction) => {
                if (animAction.getClip().name !== object.name) {
                animAction.stop();
                }
            });
            }
        }
    }
});

// Add audio listener
const listener = new THREE.AudioListener();
camera.add(listener);

// Load and play audio
const audioLoader = new THREE.AudioLoader();
const sound = new THREE.Audio(listener);
audioLoader.load('./audio/GlobalAudio.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
}, undefined, (error) => {
    console.error(error);
});