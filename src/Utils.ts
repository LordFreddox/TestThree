import { Object3D, Box3, Vector3, Group, MeshBasicMaterial, Mesh } from 'three';
import { scene } from './Renderer.ts';

function GetBoundingBoxSizeAndCenterOfObject(object: Object3D) {
    const box = new Box3().setFromObject(object);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
}

function DebugNavMesh(navMesh: Mesh) {
    const content = new Group();
    scene.add(content);
    content.clear();
    content.add(navMesh);
    content.add(
        new Mesh(
            navMesh.geometry,
            new MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
        )
    );
    content.add(
        new Mesh(navMesh.geometry, new MeshBasicMaterial({
            color: 0xFFFFFF,
            opacity: 0.75,
            transparent: true
        }))
    );
}

export { GetBoundingBoxSizeAndCenterOfObject, DebugNavMesh }