import { Pathfinding } from 'three-pathfinding';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Object3D, Mesh, Scene, Vector3, ArrowHelper } from 'three';

const your_zone_id = 'my_navmesh_zone';

export type NavMeshConfig = {
  pathfinder: Pathfinding;
  zoneId: string;
  groupId: number;
};

let modelStart: Object3D | null = null;
let modelEnd: Object3D | null = null;

function loadModels(scene: Scene): Promise<void> {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    let loadCount = 0;
    loader.load('models/StartPath.glb', (gltf) => {
      modelStart = gltf.scene;
      scene.add(modelStart);
      if (++loadCount === 2) resolve();
    });

    loader.load('models/FinishPath.glb', (gltf) => {
      modelEnd = gltf.scene;
      scene.add(modelEnd);
      if (++loadCount === 2) resolve();
    });
  });
}

async function createNavMeshAndDisplayPath(your_mesh: Mesh, scene: Scene, startPosition: Vector3, endPosition: Vector3): Promise<void> {
  await loadModels(scene);
  const zone = Pathfinding.createZone(your_mesh.geometry);
  const pathfinder = new Pathfinding();
  pathfinder.setZoneData(your_zone_id, zone);

  const config: NavMeshConfig = {
    pathfinder,
    zoneId: your_zone_id,
    groupId: 0,
  };

  if (modelStart === null || modelEnd === null) {
    throw new Error('Models for start or end points have not been loaded yet.');
  }

  const navmeshObj = scene.getObjectByName('navmesh');
  if (navmeshObj) {
    navmeshObj.visible = false;
    await getPathAndDisplay(startPosition, endPosition, scene, config);
  } else {
    console.error('Navmesh object not found in the scene.');
  }
}

async function getPathAndDisplay(startPosition: Vector3, endPosition: Vector3, scene: Scene, config: NavMeshConfig): Promise<void> {
  const { pathfinder, zoneId, groupId } = config;

  const startNode = pathfinder.getClosestNode(startPosition, zoneId, groupId);
  const endNode = pathfinder.getClosestNode(endPosition, zoneId, groupId);

  if (!startNode || !endNode) {
    console.error('Could not find valid start or end points on navmesh');
    return;
  }

  const adjustedStart = new Vector3().copy(startNode.centroid);
  const adjustedEnd = new Vector3().copy(endNode.centroid);

  if (modelStart === null || modelEnd === null) {
    console.error('Models for start or end points have not been loaded yet.');
    return;
  }

  modelStart.position.copy(adjustedStart);
  modelEnd.position.copy(adjustedEnd);

  const path = pathfinder.findPath(
    adjustedStart,
    adjustedEnd,
    zoneId,
    groupId
  );

  if (path && path.length > 1) {

    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];

      // Calculate midpoint of the segment
      const midpoint = new Vector3()
        .addVectors(start, end)
        .divideScalar(2);

      // Create an ArrowHelper for this segment
      const arrowHelper = new ArrowHelper(
        new Vector3(end.x - start.x, end.y - start.y, end.z - start.z), // dir
        midpoint, // origin
        0.75, // Length
        0xff0000, // hex color
        0.2, // head length
        0.2 // head width
      );

      // Add the arrow helper to the scene
      scene.add(arrowHelper);
    }
  }
}

/*function DebugNavMesh(your_mesh: Mesh, scene: Scene) {
  const content = new Group();
  scene.add(content);
  content.clear();
  content.add(your_mesh);
  content.add(
    new Mesh(
      your_mesh.geometry,
      new MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
    )
  );
  content.add(
    new Mesh(your_mesh.geometry, new MeshBasicMaterial({
      color: 0xFFFFFF,
      opacity: 0.75,
      transparent: true
    }))
  );
}*/

export{
  createNavMeshAndDisplayPath, getPathAndDisplay
};