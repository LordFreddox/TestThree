import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Global object to store preloaded models of type GLTF
const preloadedModels = {} as { [key: string]: any };

export { preloadedModels };

// Function to preload models
function preloadModels() {

  
  //const loader = new THREE.GLTFLoader();
  const loader = new GLTFLoader();
  const urlBase = './models/';
  
  // Disable the button initially
  //const arStartButton = document.getElementById('ar-start');
  //const loadingMessage = document.getElementById('loading-message');
  //arStartButton.style.display = 'none';
  //loadingMessage.style.display = 'flex';

  // List of models to preload
  const models = [
    { name: 'reticle', url: urlBase + 'reticle.glb' },
    { name: 'mainObject', url: urlBase + new URLSearchParams(window.location.search).get('ModelName') + ".glb" },
    // Add more models as needed
  ];

  let loadedCount = 0;

  models.forEach(model => {
    loader.load(model.url, (gltf) => {
      preloadedModels[model.name] = gltf;
      console.log(`${model.name} loaded`);
      loadedCount++;
      if (loadedCount === models.length) {
        //arStartButton.style.display = 'block';
        //loadingMessage.style.display = 'none';
      }
    }, undefined, (error) => {
      console.error(`Error loading ${model.name}:`, error);
    });
  });
}

// Preload models when the window loads
window.onload = preloadModels;