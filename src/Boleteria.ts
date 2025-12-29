import { Object3D, Color } from 'three';
import { scene } from './Renderer.ts';
import { focusCameraOnObject } from './main.ts';
import { ChangeColorOfSingleObject, RestoreOriginalColors } from './view.ts';
import { normalizeString } from './Utils/Utils.ts';

export function focusSitPlace(placeId: string): string {
  RestoreOriginalColors();
  const searchnormalized = normalizeString(placeId.toLocaleLowerCase());

  let targetObject: Object3D | undefined;
  scene.traverse((child) => {
    const originalNormalized = normalizeString(child.userData?.place_id?.toLocaleLowerCase());
    
    if (originalNormalized === searchnormalized) {
      targetObject = child;
    }
  });

  if (!targetObject) {
    console.warn(`No se encontró ningún objeto con userData.place_id = ${placeId}`);
    return 'No se pudo encontrar un lugar con ese nombre';
  }

  const parent = targetObject.parent;
  if (!parent) {
    console.warn(`No se encontró el padre del objeto con place_id = ${placeId}`);
    return 'No se pudo encontrar un lugar con ese nombre';
  }

  focusCameraOnObject(parent);
  console.log('Asiento especifico: ', targetObject);
  console.log('Padre del objeto: ', parent);
  ChangeColorOfSingleObject(parent, new Color(0x733D96));
  ChangeColorOfSingleObject(targetObject, new Color(0x2bff00));
  return `Cámara enfocada exitosamente en el lugar ${placeId}`;
}