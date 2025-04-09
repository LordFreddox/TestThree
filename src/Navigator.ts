import { Pathfinding } from 'three-pathfinding';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Object3D, Mesh, Scene, Vector3, /*ArrowHelper,*/
  CatmullRomCurve3,TubeGeometry, MeshStandardMaterial,
  DoubleSide } from 'three';
import { scene } from './Renderer';
// import { DebugNavMesh } from './Utils';

const zoneId: string = 'VirtualTour';
const groupId: number = 0;
let pathfinder: Pathfinding | null = null;

let modelStart: Object3D | null = null;
let modelEnd: Object3D | null = null;
let arrowHelpers: Mesh[] = [];

function loadModels(scene: Scene): Promise<void> {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    let loadCount = 0;
    loader.load('models/StartPath.glb', (gltf) => {
      modelStart = gltf.scene;
      modelStart.visible = false;
      scene.add(modelStart);
      if (++loadCount === 2) resolve();
    });

    loader.load('models/FinishPath.glb', (gltf) => {
      modelEnd = gltf.scene;
      modelEnd.visible = false;
      scene.add(modelEnd);
      if (++loadCount === 2) resolve();
    });
  });
}

async function createNavMesh(navMesh: Mesh): Promise<void> {
  await loadModels(scene);
  const zone = Pathfinding.createZone(navMesh.geometry);
  pathfinder = new Pathfinding();
  pathfinder.setZoneData(zoneId, zone);
  console.log("path baked");
  if (!modelStart || !modelEnd) {
    console.error('Models for start or end points have not been loaded yet');
    return;
  }
  const navmeshObj = navMesh as Object3D;
  if (navmeshObj) {
    navmeshObj.visible = false;
  } else {
    console.error('Navmesh object not found in the scene.');
  }
  // DebugNavMesh(navMesh);
}

async function getPathAndDisplay(startPlace: string, endPlace: string): Promise<void> {
  clearArrows();

  if (pathfinder === null) return;

  const startPosition = scene.getObjectByName(startPlace + "_objetivo");
  const endPosition = scene.getObjectByName(endPlace + "_objetivo");

  if (!startPosition || !endPosition) {
    console.error('Could not find the specified object in the scene');
    return;
  }

  const startNode = pathfinder.getClosestNode(startPosition.position, zoneId, groupId);
  const endNode = pathfinder.getClosestNode(endPosition.position, zoneId, groupId);

  if (!startNode || !endNode) {
    console.error('Could not find valid start or end points on navmesh');
    return;
  }

  const adjustedStart = new Vector3().copy(startNode.centroid);
  const adjustedEnd = new Vector3().copy(endNode.centroid);
  // const adjustedStart = startPosition.position;
  // const adjustedEnd = endPosition.position;

  if (!modelStart || !modelEnd || adjustedStart == adjustedEnd) {
  } else {
    modelStart.position.copy(adjustedStart);
    modelEnd.position.copy(adjustedEnd);
    modelStart.visible = true;
    modelEnd.visible = true;
  }

  const path = pathfinder.findPath(
    adjustedStart,
    adjustedEnd,
    zoneId,
    groupId
  );

  if (path && path.length > 1) {
    const curve = new CatmullRomCurve3(path, false, "catmullrom", 0);
    const tubeGeometry = new TubeGeometry(curve, 200, 0.1, 8, false);
    const tubeMaterial = new MeshStandardMaterial({ color: 0x00BFFF, side: DoubleSide });
    const tube = new Mesh(tubeGeometry, tubeMaterial);
    scene.add(tube);
    arrowHelpers.push(tube);
    
    // for (let i = 0; i < path.length - 1; i++) {
    //   const start = path[i];
    //   const end = path[i + 1];

    //   const midpoint = new Vector3()
    //     .addVectors(start, end)
    //     .divideScalar(2);

    //   const arrowHelper = new ArrowHelper(
    //     new Vector3(end.x - start.x, end.y - start.y, end.z - start.z), // dir
    //     midpoint, // origin
    //     0.75, // Length
    //     0xff0000, // hex color
    //     0.2, // head length
    //     0.2 // head width
    //   );

    //   scene.add(arrowHelper);
    //   arrowHelpers.push(arrowHelper);
    // }
  }
}

function clearArrows() {
  for (const arrow of arrowHelpers) {
    scene.remove(arrow);
  }
  arrowHelpers = [];
}

export {
  createNavMesh, getPathAndDisplay
};