import { Object3D, Box3,Vector3 } from 'three';

function GetBoundingBoxSizeAndCenterOfObject(object: Object3D) {
    const box = new Box3().setFromObject(object);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
}

export { GetBoundingBoxSizeAndCenterOfObject }