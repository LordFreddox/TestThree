import { Pathfinding } from 'three-pathfinding';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { BufferGeometry, LineBasicMaterial, Line, Object3D, Mesh, Group, Scene, MeshBasicMaterial, Vector3 } from 'three';

const your_zone_id = 'my_navmesh_zone';

export type NavMeshConfig = {
  pathfinder: Pathfinding;
  zoneId: string;
  groupId: number;
};

let modelStart: Object3D | null = null;
let modelEnd: Object3D | null = null;

function loadModels(scene: Scene): Promise<void> {
  return new Promise((resolve, reject) => {
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

export async function createNavMeshAndDisplayPath(your_mesh: Mesh, scene: Scene, startPosition: Vector3, endPosition: Vector3): Promise<void> {
  await loadModels(scene); // Wait for models to be loaded

  const zone = Pathfinding.createZone(your_mesh.geometry);
  const pathfinder = new Pathfinding();
  pathfinder.setZoneData(your_zone_id, zone); // Set the zone data here

  const config: NavMeshConfig = {
    pathfinder,
    zoneId: your_zone_id,
    groupId: 0, // Set a default group ID
  };

  //DebugNavMesh(your_mesh, scene);

  if (modelStart === null || modelEnd === null) {
    throw new Error('Models for start or end points have not been loaded yet.');
  }

  const navmeshObj = scene.getObjectByName('navmesh');
  if (navmeshObj) {
    navmeshObj.visible = false;
    getPathAndDisplay(startPosition, endPosition, scene, config);
  } else {
    console.error('Navmesh object not found in the scene.');
  }
}

export function getPathAndDisplay(startPosition: Vector3, endPosition: Vector3, scene: Scene, config: NavMeshConfig): void {
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

  if (path && path.length) {
    const lineMaterial = new LineBasicMaterial({ color: 0xff0000, linewidth: 1000 });
    const pathLines = [];

    // Adding pathlines for the very first line from adjustedStart to the first point in the path
    const firstPointInPath = path[0];
    const adjustedFirstPointInPath = new Vector3(firstPointInPath.x, firstPointInPath.y, firstPointInPath.z);
    const firstLineGeometry = new BufferGeometry().setFromPoints([adjustedStart, adjustedFirstPointInPath]);
    const firstLine = new Line(firstLineGeometry, lineMaterial);
    pathLines.push(firstLine);

    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];

      const adjustedStart = new Vector3(start.x, start.y, start.z);
      const adjustedEnd = new Vector3(end.x, end.y, end.z);

      const geometry = new BufferGeometry().setFromPoints([adjustedStart, adjustedEnd]);
      const line = new Line(geometry, lineMaterial);
      pathLines.push(line);
    }

    pathLines.forEach(line => scene.add(line));
  } else {
    console.warn("Path is too short to draw lines.");
  }
}

function DebugNavMesh(your_mesh: Mesh, scene: Scene) {
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
}