import {
  Scene, Vector3, Color, FogExp2, MeshStandardMaterial, Object3D
} from 'three';

// Parámetros de generación
const spacing = 60;
const minHeight = 1;
const maxHeight = 5;
const extraHeight = 50;
const minWidth = 2;
const maxWidth = 25;
const extraWidth = 100;
const maxDistance = 1000;
const gridSize = 400;
const extraSpacing = 150; 

// Gradiente de colores
function getColorAndOpacityByDistance(pos: Vector3, center: Vector3): { color: Color, opacity: number } {
  const dist = pos.distanceTo(center);
  const t = Math.min(dist / maxDistance, 1);

  const startColor = new Color("#7d7d7d"); // Color inicial
  const endColor   = new Color(0x404040);  // Color final
  const color = startColor.clone().lerp(endColor, t);

  // Opacidad: inicia en 0.7 y se desvanece a 0.15 en la distancia
  const opacity = 0.7 * (1 - t) + 0.15 * t;
  return { color, opacity };
}

/**
 * @param scene Escena de three.js
 * @param modelSize Tamaño del modelo central
 * @param modelCenter Centro del modelo central
 * @param buildingModels Lista de modelos GLB ya cargados (Object3D[])
 */
export function generateBuildingsAroundModel(
  scene: Scene,
  modelSize: Vector3 | null,
  modelCenter: Vector3 | null,
  buildingModels: Object3D[]
): void {
  if (!modelSize || !modelCenter) {
    console.warn("No se encuentra el bounding box del modelo.");
    return;
  }
  if (!buildingModels || buildingModels.length === 0) {
    console.warn("No hay modelos de edificios disponibles.");
    return;
  }

  scene.fog = new FogExp2(0x1a1a2e, 0.0012);

  const minX = modelCenter.x - modelSize.x / 2 - gridSize;
  const maxX = modelCenter.x + modelSize.x / 2 + gridSize;
  const minZ = modelCenter.z - modelSize.z / 2 - gridSize;
  const maxZ = modelCenter.z + modelSize.z / 2 + gridSize;

  for (let i = minX; i < maxX;) {
    for (let j = minZ; j < maxZ;) {
      const position = new Vector3(i, 0, j);
      const dist = position.distanceTo(modelCenter);
      const t = Math.min(dist / maxDistance, 1);

      if (t > 0.6 && Math.random() < 0.7) {
        // spacing extra si se salta el edificio
        j += spacing / 2 + Math.random() * extraSpacing;
        continue;
      }
      if (t > 0.85 && Math.random() < 0.9) {
        j += spacing / 2 + Math.random() * extraSpacing;
        continue;
      }

      if (i < modelCenter.x - modelSize.x / 2 - spacing ||
          i > modelCenter.x + modelSize.x / 2 + spacing ||
          j < modelCenter.z - modelSize.z / 2 - spacing ||
          j > modelCenter.z + modelSize.z / 2 + spacing) {

        const modelIndex = Math.floor(Math.random() * buildingModels.length);
        const buildingTemplate = buildingModels[modelIndex];
        const building = buildingTemplate.clone(true);

        const scaleFactor = 0.3;
        // Altura completamente aleatoria sin dependencia de la distancia
        const extraH = Math.random() * extraHeight * scaleFactor;
        const height = (Math.random() * (maxHeight - minHeight) + minHeight) * scaleFactor + extraH;

        const baseWidth = (Math.random() * (maxWidth - minWidth) + minWidth) * scaleFactor;
        const width = baseWidth + t * extraWidth * scaleFactor + Math.random() * (t * extraWidth * 0.1) + Math.random() * 1.5;
        const depth = baseWidth + t * extraWidth * scaleFactor + Math.random() * (t * extraWidth * 0.1) + Math.random() * 1.5;

        building.scale.set(width, height, depth);

        const groundOffset = -15;
        position.y = height / 2 + groundOffset;
        building.position.copy(position);

        building.rotation.y = Math.random() * Math.PI * 2;

        const { color, opacity } = getColorAndOpacityByDistance(position, modelCenter);

        building.traverse((child) => {
          // @ts-ignore
          if (child.isMesh && child.material) {
            // @ts-ignore
            child.material = new MeshStandardMaterial({
              color: color,
              transparent: true,
              opacity: opacity,
              roughness: 0.35,
              metalness: 0.7,
              emissive: color.clone().multiplyScalar(0.25),
              emissiveIntensity: 0.5
            });
          }
        });

        scene.add(building);

        // spacing extra proporcional a la altura extra
        j += spacing / 2 + extraH;
      } else {
        j += spacing / 2;
      }
    }
    i += spacing / 2;
  }
}