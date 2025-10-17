import { Object3D, Color } from 'three';
import { scene } from './Renderer.ts';
import { focusCameraOnObject } from './main.ts';
import { ChangeColorOfSingleObject, RestoreOriginalColors } from './view.ts';

export function focusSitPlace(placeId: string) {
  RestoreOriginalColors();

  let targetObject: Object3D | undefined;
  scene.traverse((child) => {
    if (child.userData?.place_id === placeId) {
      targetObject = child;
    }
  });

  if (!targetObject) {
    console.warn(`No se encontró ningún objeto con userData.place_id = ${placeId}`);
    return;
  }

  const parent = targetObject.parent;
  if (!parent) {
    console.warn(`No se encontró el padre del objeto con place_id = ${placeId}`);
    return;
  }

  focusCameraOnObject(parent);
console.log('Asiento especifico: ', targetObject);
console.log('Padre del objeto: ', parent);
  ChangeColorOfSingleObject(parent, new Color(0x733D96));
  ChangeColorOfSingleObject(targetObject, new Color(0x2bff00));
}