import {
    Object3D, Box3, Vector3, Group, MeshBasicMaterial,
    Mesh, ArrowHelper,
    Color
} from 'three';
import { scene } from '../Renderer.ts';

const blockerClassName = 'raycast-blocker';

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

function IsLocalHost(): boolean {
    if (window.location.hostname === "localhost")
        return true;
    else
        return false;
}

function shouldBlock(event: TouchEvent): boolean {
    let targetElement = event.target as HTMLElement;

    while (targetElement) {
        if (targetElement.classList.contains(blockerClassName)) {
            return true;
        }

        const parentElement = targetElement.parentElement;
        if (parentElement) {
            targetElement = parentElement;
        } else {
            break; // or handle it in another way if needed
        }
    }

    return false;
}

function GetHTMLElement(element: string): HTMLElement {
    return document.querySelector(element) as HTMLElement;
}

function normalizeString(str: string): string {
    // Remove diacritical marks
    if (!str)
        return "";

    let normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Remove punctuation and special characters (keep only alphanumeric and spaces)
    normalized = normalized.replace(/[^a-zA-Z0-9\s]/g, '');
    normalized = normalized.replace(/\s/g, ''); //removing all spaces, tabs, newlines.
    return normalized;
}

function CreateArrowRender(startPosition: Vector3, endPosition: Vector3,
    centerPosition: Vector3, arrowLenght: number, color: string): ArrowHelper {
    const realColor: Color = new Color(color);
    const arrow = new ArrowHelper(
        new Vector3(endPosition.x - startPosition.x,
            endPosition.y - startPosition.y,
            endPosition.z - startPosition.z), // dir
        centerPosition, // origin
        arrowLenght, // Length
        realColor, // hex color
        0.5, // head length
        0.5 // head width
    );
    // const lineGeometry = new BufferGeometry().setFromPoints([startPosition, endPosition]);
    // const lineMaterial = new LineBasicMaterial({ color: color });
    // const line = new Line(lineGeometry, lineMaterial);
    arrow.visible = false;
    scene.add(arrow);
    return arrow;
}

function GetObjectListByUserDataTags(tag: string): Object3D[] {
    let returnedObjects: Object3D[] = [];
    scene.traverse((child) => {
        if (child.userData?.tag === tag) {
            returnedObjects.push(child);
        }
    });
    return returnedObjects;
}

export {
    GetBoundingBoxSizeAndCenterOfObject, DebugNavMesh,
    GetHTMLElement, IsLocalHost, shouldBlock, normalizeString,
    CreateArrowRender, GetObjectListByUserDataTags
}