import {
  Scene, Mesh, Vector3,
  BoxGeometry, MeshStandardMaterial, Color
} from 'three';

const geometry = new BoxGeometry(1, 1, 1);

const spacing = 25;         // espacio entre edificios
const minHeight = 1;        // altura mínima
const maxHeight = 5;        // altura máxima
const minWidth = 10;        // ancho mínimo
const maxWidth = 30;        // ancho máximo
const maxDistance = 200;    // distancia máxima para gradiente de color/altura
const extraHeight = 20;     // altura adicional en edificios lejanos

function getColorByDistance(pos: Vector3, center: Vector3): Color {
  const dist = pos.distanceTo(center);
  const t = Math.min(dist / maxDistance, 1);

  const colorNear = new Color(0x40E0D0); 
  const colorFar = new Color(0x808080);

  return colorNear.lerp(colorFar, t);
}

export function generateBuildingsAroundModel(
  scene: Scene,
  modelSize: Vector3 | null,
  modelCenter: Vector3 | null,
  citySize: number = 400
): void {
  if (!modelSize || !modelCenter) {
    console.warn("No se encuentra el bounding box del modelo.");
    return;
  }

  const minX = modelCenter.x - modelSize.x / 2;
  const maxX = modelCenter.x + modelSize.x / 2;
  const minZ = modelCenter.z - modelSize.z / 2;
  const maxZ = modelCenter.z + modelSize.z / 2;

  for (let i = -citySize / 2; i < citySize / 2; i += spacing) {
    for (let j = -citySize / 2; j < citySize / 2; j += spacing) {
      // Generar edificios fuera del bounding box del modelo
      if (i < minX - spacing || i > maxX + spacing ||
          j < minZ - spacing || j > maxZ + spacing) {

        const position = new Vector3(i, 0, j);
        const dist = position.distanceTo(modelCenter);
        const t = Math.min(dist / maxDistance, 1);

        // altura según distancia
        const baseHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        const height = baseHeight + t * extraHeight;

        const width  = Math.random() * (maxWidth - minWidth) + minWidth;
        const depth  = Math.random() * (maxWidth - minWidth) + minWidth;

        position.y = height / 2;

        const color = getColorByDistance(position, modelCenter);

        const buildingMaterial = new MeshStandardMaterial({
          color: color,
          transparent: true,
          opacity: 0.5,
        });

        const building = new Mesh(geometry, buildingMaterial);
        building.scale.set(width, height, depth);
        building.position.copy(position);

        scene.add(building);
      }
    }
  }
}
