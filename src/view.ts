import { Object3D, Color, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { camera, canvas } from './Renderer';
import { Place } from './http-service.js';
import { companyId, SetNewPathNavmesh } from './main.ts';
import { GetBoundingBoxSizeAndCenterOfObject } from './Utils.ts'
const COLOR_SELECTED = new Color(0x733D96);
let MapObjectsListByCategoryName = {} as { [key: string]: Object3D[] };
let MapObjectPlacesText = {} as { [key: string]: Object3D[] };
const originalColors = new Map<Object3D, Color>();
const tempV = new Vector3();
const paddingBetweenText = 30;
const BASE_URL_PATH_DESCRIPTION = 'https://strg01tockall.blob.core.windows.net/container-unity/ResumenRecorridos/';
const searchBar = document.getElementById('search-bar') as HTMLInputElement;
const placeSelectorStart = document.getElementById('placeStart') as HTMLSelectElement;
const placeSelectorEnd = document.getElementById('placeEnd') as HTMLSelectElement;
let labelsScene = new Map<Vector3, HTMLDivElement>();
const labelContainerElem = document.querySelector('#labelsScene');

searchBar?.addEventListener('input', () => {
    const searchTerm = searchBar.value.toLowerCase();
    filterCarouselItems(searchTerm);
});

(document.getElementById("back3D") as HTMLButtonElement).addEventListener('click', () => {
    document.getElementById('div3DView')!.style.display = 'none';
    document.getElementById('search-section')!.style.display = 'block';
});

(document.getElementById("previewButton") as HTMLButtonElement).onclick = async () => {
    document.getElementById('div3DView')!.style.display = 'block';
    document.getElementById('search-section')!.style.display = 'none';
};

(document.getElementById("fullviewButton") as HTMLButtonElement).onclick = async () => {
    const startPlaceId = placeSelectorStart.options[placeSelectorStart.selectedIndex].dataset.idPlace;
    const endPlaceId = placeSelectorEnd.options[placeSelectorEnd.selectedIndex].dataset.idPlace;
    if (startPlaceId === undefined || endPlaceId === undefined) return;

    const baseUrl = `https://strg01tockall.blob.core.windows.net/container-unity/UnityBundles/webgl/3DExperiences/index.html`;
    const urlParams = new URLSearchParams({ BigSurfaceId: companyId, Start: startPlaceId, Place: endPlaceId, ServType: "1" });
    const url = `${baseUrl}?${urlParams.toString()}`;
    window.open(url, '_blank');
};

function AddCarouselItem(imageUrl: string, description: string,
    object: Object3D, floorLevels: Object3D[], labelsScene: Map<Vector3, HTMLDivElement>) {
    const carouselContainer = document.querySelector('.carousel-container');
    const newItem = document.createElement('div');
    newItem.classList.add('carousel-item');
    newItem.innerHTML = `
        <img src="${imageUrl}" alt="${description}">
        <p>${description}</p>
    `;
    carouselContainer!.appendChild(newItem);
    newItem.addEventListener('click', () => {
        RestoreOriginalColors();
        ChangeColorOfSingleObject(object, COLOR_SELECTED);
        const floorObj = findFloorObject(object, floorLevels);
        const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
        const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
        floorSelector.value = floorIndex.toString();
        showFloor(floorIndex, floorLevels, labelsScene);
    });
}

function filterCarouselItems(searchTerm: string) {
    const carouselItems = document.querySelectorAll('.carousel-item');
    carouselItems.forEach((item) => {
        const description = item.querySelector('p')!.textContent!.toLowerCase();
        if (description.includes(searchTerm)) {
            (item as HTMLElement).classList.remove('hidden');
        } else {
            (item as HTMLElement).classList.add('hidden');
        }
    });
}

function SetupPlacesForSearch(places: Place[]) {

    places.forEach((_, index) => {
        placeSelectorEnd.appendChild(
            ReturnOptionsPlaces(
                places[index].companysubsidiary_name,
                index.toString(),
                places[index].place_id));
        placeSelectorStart.appendChild(
            ReturnOptionsPlaces(
                places[index].companysubsidiary_name,
                index.toString(),
                places[index].place_id));
    });

    placeSelectorStart.addEventListener('change', () => {
        checkAndDownloadJSON();
    });

    placeSelectorEnd.addEventListener('change', () => {
        checkAndDownloadJSON();
    });
}

function ReturnOptionsPlaces(name: string, index: string, idPlace: number): HTMLOptionElement {
    const option = document.createElement('option');
    option.value = index;
    option.text = name;
    option.dataset.idPlace = idPlace.toString();
    return option;
}

async function checkAndDownloadJSON() {
    if (placeSelectorStart && placeSelectorEnd) {
        const startPlaceId = placeSelectorStart.options[placeSelectorStart.selectedIndex].dataset.idPlace;
        const endPlaceId = placeSelectorEnd.options[placeSelectorEnd.selectedIndex].dataset.idPlace;

        if (!startPlaceId || !endPlaceId) {
            return;
        }

        if (placeSelectorEnd.selectedIndex == -1 || placeSelectorStart.selectedIndex == -1 || placeSelectorEnd.selectedIndex == placeSelectorStart.selectedIndex) {
            return;
        }

        const url = BASE_URL_PATH_DESCRIPTION + `${companyId}-${new URLSearchParams(window.location.search).get('project')?.toUpperCase()}` + "/resumen-" + startPlaceId + "_" + endPlaceId + ".json";
        SetNewPathNavmesh(startPlaceId, endPlaceId);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();
            const description = data.description;
            document.getElementById('description-path')!.innerHTML = description;
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }
}

function findFloorObject(object: Object3D, floorLevels: Object3D[]): Object3D | null {
    let current: Object3D | null = object;
    while (current) {
        if (floorLevels.includes(current)) return current;
        current = current.parent;
    }
    return null;
}

function initFloorSelector(floorLevels: Object3D[], labelsScene: Map<Vector3, HTMLDivElement>) {
    document.getElementById('floor-selector-title')!.style.display = 'block';
    const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
    floorSelector.style.display = 'block';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '-1';
    defaultOption.text = 'Todos los Pisos';
    floorSelector.appendChild(defaultOption);

    floorLevels.forEach((_, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.text = `Piso ${index + 1}`;
        floorSelector.appendChild(option);
    });

    floorSelector.addEventListener('change', (event) => {
        const selectedIndex = parseInt((event.target as HTMLSelectElement).value, 10);
        showFloor(selectedIndex, floorLevels, labelsScene);
    });
}

function showFloor(index: number, floorLevels: Object3D[], labelsScene: Map<Vector3, HTMLDivElement>) {
    if (index === -1) {
        // Show all floors
        floorLevels.forEach((floor) => {
            floor.visible = true;
        });
    } else {
        // Show only the selected floor
        floorLevels.forEach((floor, i) => {
            floor.visible = (i === index);
        });
    }
    labelsScene.forEach((elem) => {
        const labelFloorIndex = parseInt(elem.dataset.floorIndex || '-1', 10);
        if (index === -1 || index === labelFloorIndex) {
            elem.style.display = 'block';
            elem.classList.remove('HideFromFloor');
        } else {
            elem.style.display = 'none';
            elem.classList.add('HideFromFloor');
        }
    });
    updateLabelPositions();
    updateLabelVisibility();
}

function initCategorySelector(labelsScene: Map<Vector3, HTMLDivElement>) {
    document.getElementById('category-selector-title')!.style.display = 'block';
    const categorySelector = document.getElementById('category-selector') as HTMLSelectElement;
    categorySelector.style.display = 'block';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '-1';
    defaultOption.text = 'Todas las Categorías';
    categorySelector.appendChild(defaultOption);

    for (const key in MapObjectsListByCategoryName) {
        if (key === 'undefined') continue;
        const option = document.createElement('option');
        option.value = key;
        option.text = key;
        categorySelector.appendChild(option);
    }

    categorySelector.addEventListener('change', () => {
        showCategory((categorySelector.value), labelsScene);
    });
}

function showCategory(category: string, labelsScene: Map<Vector3, HTMLDivElement>) {
    labelsScene.forEach((elem) => {
        if (category === '-1' || elem.dataset.category === category) {
            elem.style.display = 'block';
            elem.classList.remove('HideFromCategory');
        } else {
            elem.style.display = 'none';
            elem.classList.add('HideFromCategory');
        }
    });

    // Restore all original colors first
    RestoreOriginalColors();

    // If category is not "-1", color only that category
    if (category !== '-1') {
        ChangeObjectColorsByCategory(category, COLOR_SELECTED);
    }

    updateLabelPositions();
    updateLabelVisibility();
}

function updateLabelPositions(/*labelsScene: Map<Vector3, HTMLDivElement>*/) {
    labelsScene.forEach((elem, position) => {
        if (elem.style.display == 'none') return;
        tempV.copy(position);
        tempV.project(camera);

        // convert the normalized position to CSS coordinates
        const x = (tempV.x * .5 + .5) * canvas.clientWidth;
        const y = (tempV.y * - .5 + .5) * canvas.clientHeight;

        elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    });
}

function updateLabelVisibility(/*labelsScene: Map<Vector3, HTMLDivElement>*/) {
    const labelData: LabelData[] = [];

    labelsScene.forEach((elem, position) => {
        if (elem.classList.contains('HideFromFloor')
            || elem.classList.contains('HideFromCategory')) {
            elem.style.display = 'none';
            return;
        }
        tempV.copy(position);
        tempV.project(camera);

        // convert the normalized position to CSS coordinates
        const x = (tempV.x * .5 + .5) * canvas.clientWidth;
        const y = (tempV.y * - .5 + .5) * canvas.clientHeight;
        const zIndex = (-tempV.z * .5 + .5) * 100000 | 0;

        // Store the label data
        labelData.push({ elem, x, y, zIndex });
        elem.style.display = 'block';
    });

    // Sort labels by zIndex in descending order
    labelData.sort((a, b) => b.zIndex - a.zIndex);

    // Hide overlapping labels
    for (let i = 0; i < labelData.length; i++) {
        const { elem, x, y, zIndex } = labelData[i];
        let overlap = false;

        for (let j = 0; j < i; j++) {
            const other = labelData[j];
            if (Math.abs(x - other.x) < elem.offsetWidth + paddingBetweenText && Math.abs(y - other.y) < elem.offsetHeight + paddingBetweenText) {
                overlap = true;
                break;
            }
        }

        if (overlap || (i > 0 && labelData[i - 1].zIndex === zIndex)) {
            elem.style.display = 'none';
        } else {
            elem.style.display = 'block';
            elem.style.zIndex = zIndex.toString();
        }
    }
}

function ChangeObjectColorsByCategory(category: string, color: Color) {
    if (MapObjectsListByCategoryName[category]) {
        MapObjectsListByCategoryName[category].forEach((object) => {
            ChangeColorOfSingleObject(object, color);
        });
    }
}

function ChangeColorOfSingleObject(object: Object3D, color: Color) {
    object.traverse((child) => {
        if (child instanceof Mesh) {
            const mesh = child;
            const material = mesh.material as MeshStandardMaterial;

            if (!originalColors.has(mesh)) {
                originalColors.set(mesh, material.color.clone());
            }

            mesh.material = material.clone();
            (mesh.material as MeshStandardMaterial).color.set(color);
        }
    });
}

function RestoreOriginalColors() {
    originalColors.forEach((color, object) => {
        const mesh = object as Mesh;
        (mesh.material as MeshStandardMaterial).color.copy(color);
    });
    for (const key in MapObjectPlacesText) {
        MapObjectPlacesText[key].forEach((text) => {
            text.visible = false;
        });
    }
    originalColors.clear();
}

function CreateTextForPlace(
    textName: Place, placeObject: Object3D, floorLevels: Object3D[], fontSize = 1, )
    {
    const elem = document.createElement('div');
    const formattedKey = textName.companysubsidiary_name.split(' - ')[0].replace(/ /g, '\n');
    elem.textContent = formattedKey;
    elem.style.fontSize = fontSize + 'em';
    labelContainerElem!.appendChild(elem);
    const { size, center } = GetBoundingBoxSizeAndCenterOfObject(placeObject);
    const topCenterPosition = new Vector3(center.x, center.y + size.y, center.z);
    labelsScene.set(topCenterPosition, elem);
    const floorObj = findFloorObject(placeObject, floorLevels);
    const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
    elem.dataset.floorIndex = floorIndex.toString();
    elem.dataset.category = textName.place_category_name;
}

interface LabelData {
    elem: HTMLDivElement;
    x: number;
    y: number;
    zIndex: number;
}

export {
    initFloorSelector, initCategorySelector, AddCarouselItem,
    updateLabelPositions, updateLabelVisibility,
    MapObjectsListByCategoryName, labelsScene, labelContainerElem,
    SetupPlacesForSearch, CreateTextForPlace
};