import { Object3D, Color, Mesh, MeshStandardMaterial, Vector3, ArrowHelper } from 'three';
import { camera, canvas, scene } from './Renderer.ts';
import { Place } from './Utils/Types.ts';
import { PROJECT } from './HTTP/http-service.ts';
// import { getPathAndDisplay } from './Navigator.ts';
import { CreateArrowRender, GetBoundingBoxSizeAndCenterOfObject, GetHTMLElement, normalizeString } from './Utils/Utils.ts';
import { setCurrentAgent } from './chat.ts';
import { EndCallView } from './CallManager/CallView.ts';
import { UpdateDescription } from './AI.ts';
// import { controls } from './main.ts';
import { focusCameraOnObject, floorLevels, removeCurrentMarker, controls } from './main.ts';//metodo para animar la camara al objeto seleccionado
import { spawnMarkerAboveObject, focusCameraOnFloor } from './main.ts';
import { COMPANY_ID } from './Utils/constants.ts';

const COLOR_SELECTED = new Color(0x733D96);
let MapObjectsListByCategoryName = {} as { [key: string]: Object3D[] };
let MapObjectPlacesText = {} as { [key: string]: Object3D[] };
const originalColors = new Map<Object3D, Color>();
const tempV = new Vector3();
const paddingBetweenText = 30;
const BASE_URL_PATH_DESCRIPTION = 'https://strg01tockall.blob.core.windows.net/container-unity/ResumenRecorridos/';
const searchBar = document.getElementById('searchPlace3D') as HTMLInputElement;
const closeSeachIcon = document.getElementById('icon-close') as HTMLInputElement;
const input_searcher = document.getElementById('input_searcher') as HTMLInputElement;
const placeSelectors = document.getElementsByClassName('container-input');
let labelsScene = new Map<Vector3, HTMLDivElement>();
let labelsLine = new Map<HTMLDivElement, ArrowHelper>();
const labelContainerElem = document.querySelector('#labelsScene');
let startPlaceId: string | undefined;
let endPlaceId: string | undefined
const searchPanel = GetHTMLElement('.container-select-place');
const containerSearch = GetHTMLElement('#container-search');
const descriptionPathPanel = document.getElementById('description-path');
const webviewContainer = document.getElementById('webView') as HTMLIFrameElement;
const placesList = GetHTMLElement('#placesList');
const personList = GetHTMLElement('#personList');
const divCardPlace = GetHTMLElement('#divCardPlace');
let currentController: AbortController | null = null;
// const SearchPlacePersonText = GetHTMLElement('#SearchPlacePersonText');
let currentSelectedSearchButton: HTMLElement;
let currentFloor: () => string = () =>
    (document.getElementById('floor-selector') as HTMLSelectElement).value;

input_searcher.addEventListener('input', () => {
    const searchTerm = normalizeString(input_searcher.value.toLowerCase());
    filterPlaceSearchItem(searchTerm);
});

GetHTMLElement('#deleteSearch').onclick = () => {
    if (input_searcher.value === '') {
        searchPanel.style.display = 'none';
        return;
    }

    input_searcher.value = '';
    const event = new Event('input', { bubbles: true });
    input_searcher.dispatchEvent(event);
};

GetHTMLElement('#searchPlace3D').onclick = () => {
    searchPanel.style.display = 'block';
    containerSearch.style.display = 'none';
    closeSeachIcon.style.display = 'flex';
    ClosePlaceCard();
};

searchBar?.addEventListener('input', () => {
    const searchTerm = normalizeString(searchBar.value.toLowerCase());
    filterPlaceSearchItem(searchTerm);
});

GetHTMLElement('#icon-close').onclick = () => {
    CloseSearchPlace();
};
GetHTMLElement('#closePlaceCard').onclick = () => {
    ClosePlaceCard();
};

export function ClosePlaceCard() {
    divCardPlace.classList.remove('showTop');
    divCardPlace.classList.add('hideTop');
    if (currentController) {
        currentController.abort();
        currentController = null;
    }
}

export function CloseSearchPlace() {
    searchPanel.style.display = 'none';
    containerSearch.style.display = 'block';
    closeSeachIcon.style.display = 'none';
}


function DisplayChatAI(idPlace: number) {
    //use idPlace to know what aget chat to activate, for now activate GetHTMLElement('.msger')
    setCurrentAgent(idPlace.toString());
    GetHTMLElement('.msger').style.display = 'flex';
}

GetHTMLElement('#CloseChatHeaderButton').onclick = () => {
    GetHTMLElement('.msger').style.display = 'none';
}

// GetHTMLElement('.buttonTogglePlacePerson').onclick = () => {
//     const buttonTogglePlacePerson = GetHTMLElement('.buttonTogglePlacePerson');
//     if (SearchPlacePersonText.innerHTML === 'Buscar lugares') {
//         SearchPlacePersonText.innerHTML = 'Buscar personas';
//         GetHTMLElement('#buttonDestination').style.display = 'none';
//         GetHTMLElement('#buttonPerson').style.display = 'flex';
//         buttonTogglePlacePerson.style.flexDirection = 'row-reverse';
//         buttonTogglePlacePerson.getElementsByTagName('img')[0].src = '/img/BUSCAR_PERSONAS.svg';
//         buttonTogglePlacePerson.style.backgroundColor = 'var(--button-enable-color)';
//     }
//     else {
//         SearchPlacePersonText.innerHTML = 'Buscar lugares';
//         GetHTMLElement('#buttonPerson').style.display = 'none';
//         GetHTMLElement('#buttonDestination').style.display = 'flex';
//         buttonTogglePlacePerson.style.flexDirection = 'row';
//         buttonTogglePlacePerson.getElementsByTagName('img')[0].src = '/img/BUSCAR_LUGARES.svg';
//         buttonTogglePlacePerson.style.backgroundColor = '#ffffff';
//     }
// };

//add onclick event to all elements inside placeSelectors
for (let i = 0; i < placeSelectors.length; i++) {
    const element = placeSelectors[i] as HTMLElement;
    element.querySelector('#container-textSearch')!.addEventListener('click', () => {
        searchPanel.style.display = 'grid'; //active search panel
        if (element.id === 'buttonPerson') { //clicked button for person search
            placesList.style.display = 'none';
            personList.style.display = 'flex';
        } else { //clicked button any place search
            placesList.style.display = 'flex';
            personList.style.display = 'none';
        }
        currentSelectedSearchButton = element;
        SetClearXIcon(currentSelectedSearchButton);
    });
}

function SetClearXIcon(currentSelectedSearchButton: HTMLElement) {
    currentSelectedSearchButton.querySelector('.icon')!.addEventListener('click', () => {
        switch (currentSelectedSearchButton.id) {
            case 'buttonStart':
                currentSelectedSearchButton.querySelector('#name-place')!.innerHTML =
                    'Selecciona tu punto de partida';
                break;
            case 'buttonDestination':
                currentSelectedSearchButton.querySelector('#name-place')!.innerHTML =
                    'Selecciona tu destino';
                break;
            case 'buttonPerson':
                currentSelectedSearchButton.querySelector('#name-place')!.innerHTML =
                    'Escribe un nombre';
                break;
        }
        currentSelectedSearchButton.querySelector('#subname-place')!.innerHTML =
            '';
        currentSelectedSearchButton.querySelector('.icon')!.classList.remove('icon-x');
        DisableTourState();
    });
}

// GetHTMLElement('#back3D').onclick = async () => {
//     document.getElementById('div3DView')!.style.display = 'none';
//     document.getElementById('search-section')!.style.display = 'block';
//     EndCallView();
// };

// GetHTMLElement('#previewButton').onclick = async () => {
//     document.getElementById('div3DView')!.style.display = 'block';
//     document.getElementById('search-section')!.style.display = 'none';
//     updateLabelPositions();
//     if (!startPlaceId || !endPlaceId) return;
//     getPathAndDisplay(startPlaceId, endPlaceId);
// };

GetHTMLElement('#fullviewButton').onclick = async () => {
    if (!startPlaceId || !endPlaceId) return;
    if (startPlaceId === endPlaceId) return;
    window.open(ConstructUnityVirtualTourURL(COMPANY_ID, startPlaceId, endPlaceId, PROJECT.toLowerCase()),
        '_blank'); //CHANGE BOT TEST 3/7/2025
};

GetHTMLElement('#ExitQR').onclick = () => {
    if (!startPlaceId || !endPlaceId) return;
    if (startPlaceId === endPlaceId) return;
    window.open(ConstructUnityVirtualTourURL(COMPANY_ID, startPlaceId, endPlaceId, PROJECT.toLowerCase()),
        '_blank');
    GetHTMLElement('#QRDisplay').style.display = 'none';
};

function ConstructUnityVirtualTourURL(companyId: string, startPlaceId: string, endPlaceId: string, project: string): string {
    const baseUrl = `https://strg01tockall.blob.core.windows.net/container-unity/UnityBundles/webgl/3DExperiences/index.html`;
    const urlParams = new URLSearchParams({ BigSurfaceId: companyId, Start: startPlaceId, Place: endPlaceId, ServType: "1", project: project });
    return `${baseUrl}?${urlParams.toString()}`;

    //TODO: Parse in unity the project type
}

// function AddCarouselItem(imageUrl: string, description: string,
//     object: Object3D, floorLevels: Object3D[]) {
//     const carouselContainer = document.querySelector('.carousel-container');
//     const newItem = document.createElement('div');
//     newItem.classList.add('carousel-item');
//     newItem.innerHTML = `
//         <img src="${imageUrl}" alt="${description}">
//         <p>${description}</p>
//     `;
//     carouselContainer!.appendChild(newItem);
//     newItem.addEventListener('click', () => {
//         SetupDescriptionCardForPlace(object);
//         RestoreOriginalColors();
//         ChangeColorOfSingleObject(object, COLOR_SELECTED);
//         const floorObj = findFloorObject(object, floorLevels);
//         const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
//         const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
//         floorSelector.value = floorIndex.toString();
//         showFloor(floorIndex, floorLevels, labelsScene);
//     });
// }

// function filterCarouselItems(searchTerm: string) {
//     const carouselItems = document.querySelectorAll('.itemPlaceSearchClass');
//     carouselItems.forEach((item) => {
//         const description = normalizeString(item.getElementsByClassName('name-place')![0].innerHTML.toLowerCase());
//         if (description.includes(searchTerm)) {
//             (item as HTMLElement).style.display = 'flex';
//         } else {
//             (item as HTMLElement).style.display = 'none';
//         }
//     });
// }

function filterPlaceSearchItem(searchTerm: string) {
    const carouselItems = document.querySelectorAll('.place-item');
    carouselItems.forEach((item) => {
        const description = normalizeString(item.getElementsByClassName('name-place')![0].innerHTML.toLowerCase());
        if (description.includes(searchTerm)) {
            (item as HTMLElement).style.display = 'flex';
        } else {
            (item as HTMLElement).style.display = 'none';
        }
    });
}

function SetupPlacesForSearchVirtualTour(places: Place[]) {
    places.forEach((_, index) => {
        placesList.appendChild(CreateOptionItemSearchPanel(places[index]));
    });
    //setup personlist aswell for testing purpouse
    // personList.appendChild(CreateOptionItemSearchPanelPerson());
}

function SetupPlacesForSearchMap3D(place: Place, object: Object3D, floorLevels: Object3D[]) {
    let newButton = document.createElement('button');
    newButton.classList.add('place-item');
    newButton.type = 'button';
    // newButton.classList.add('itemPlaceSearchClass');
    newButton.onclick = () => { ButtonActionItemSearchPanelMap3D(object, floorLevels) };

    const html = `
            <img alt="" class="image-place" src="${place.companysubsidiary_image_url}">
            <div class="info">
                <span class="name-place">${place.companysubsidiary_name}</span>
                <span class="subname-place">${place.place_area_name}</span>
            </div>`;

    newButton.innerHTML = html;
    placesList.appendChild(newButton);
}

async function checkAndDownloadJSON() {
    if (!startPlaceId || !endPlaceId) {
        // document.getElementById("fullviewButton")!.style.display = "none";
        return;
    }

    if (startPlaceId === endPlaceId) {
        // document.getElementById("fullviewButton")!.style.display = "none";
        return;
    }

    const url = BASE_URL_PATH_DESCRIPTION + `${COMPANY_ID}-${new URLSearchParams(window.location.search).get('project')?.toUpperCase()}` + "/resumen-" + startPlaceId + "_" + endPlaceId + ".json";

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        EnableTourState(data.description);
    } catch (error) {
        DisableTourState();
    }
}

function formatDescription(description: string): string {
    return description.replace(/Paso (\d+):/g, '<b>Paso $1:</b>');
}

function EnableTourState(description: string) {
    GetHTMLElement('#previewButton').style.color = 'var(--button-enable-color)';
    GetHTMLElement('#previewButton').style.borderColor = 'var(--button-enable-color)';
    GetHTMLElement('#fullviewButton').style.backgroundColor = 'var(--button-enable-color)';
    GetHTMLElement('#fullviewButton').style.borderColor = 'var(--button-enable-color)';
    descriptionPathPanel!.querySelector('span')!.innerHTML = formatDescription(description);
    descriptionPathPanel!.style.visibility = 'visible';
    // document.getElementById("fullviewButton")!.style.display = "inline-block";
    document.getElementById("fullviewButton")!.removeAttribute('disabled');
    // descriptionPathPanel!.querySelector('span')!.style.width = '0vw';
    // descriptionPathPanel!.querySelector('span')!.style.padding = '0px';

}

function DisableTourState() {
    GetHTMLElement('#previewButton').style.color = 'var(--button-disable-color)';
    GetHTMLElement('#previewButton').style.borderColor = 'var(--button-disable-color)';
    GetHTMLElement('#fullviewButton').style.backgroundColor = 'var(--button-disable-color)';
    GetHTMLElement('#fullviewButton').style.borderColor = 'var(--button-disable-color)';
    // document.getElementById("fullviewButton")!.style.display = "none";
    descriptionPathPanel!.style.visibility = 'hidden';
    document.getElementById("fullviewButton")!.setAttribute('disabled', '');
    descriptionPathPanel!.querySelector('span')!.style.left = '-100%';

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

    floorLevels.forEach((floor, index) => {
        const option = document.createElement('option');
        const displayName = floor.userData.displayName || `Piso ${index + 1}`;
        option.value = index.toString();
        option.text = displayName;
        floorSelector.appendChild(option);
    });

    floorSelector.addEventListener('change', (event) => {
        const selectedIndex = parseInt((event.target as HTMLSelectElement).value, 10);
        showFloor(selectedIndex, floorLevels, labelsScene);
        removeCurrentMarker(); // Remove any current marker when changing floors

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
            if (i === index) {
                console.log("Centering model on floor: ", floor.userData.displayName || `Piso ${i + 1}`);
                focusCameraOnFloor(floor, controls);
            }
        });
    }
    labelsScene.forEach((elem) => {
        const labelFloorIndex = parseInt(elem.dataset.floorIndex || '-1', 10);
        let line;
        if (
            // index === -1 || 
            index === labelFloorIndex) {
            elem.style.display = 'block';
            line = labelsLine.get(elem);
            if(line)
                line.visible = true;
            elem.classList.remove('HideFromFloor');
        } else {
            elem.style.display = 'none';
            line = labelsLine.get(elem);
            if(line)
                line.visible = false;
            elem.classList.add('HideFromFloor');
        }
    });
    updateLabelPositions();
    updateLabelVisibility();
}

function initCategorySelector() {
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
        let line;
        if (category === '-1' || elem.dataset.category === category) {
            elem.style.display = 'block';
            line = labelsLine.get(elem);
            if(line)
                line.visible = true;
            elem.classList.remove('HideFromCategory');
        } else {
            elem.style.display = 'none';
            line = labelsLine.get(elem);
            if(line)
                line.visible = false;
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

function updateLabelPositions() {
    if (currentFloor() == "-1") return; //no position update when all floor selected

    labelsScene.forEach((elem, position) => {
        if (elem.style.display == 'none' || currentFloor() == "-1") return;
        tempV.copy(position);
        tempV.project(camera);

        // convert the normalized position to CSS coordinates
        const x = (tempV.x * .5 + .5) * canvas.clientWidth;
        const y = (tempV.y * - .5 + .5) * canvas.clientHeight;

        elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    });
}

function updateLabelVisibility() {
    if (currentFloor() == "-1") return; //no visibility update when all floor selected

    const labelData: LabelData[] = [];
    let line;

    labelsScene.forEach((elem, position) => {
        if (elem.classList.contains('HideFromFloor')
            || elem.classList.contains('HideFromCategory')) {
            elem.style.display = 'none';
            line = labelsLine.get(elem);
            if(line)
                line.visible = false;
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
        // line = labelsLine.get(elem);
        // if(line)
        //     line.visible = true;
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

        if (overlap || (i > 0 && labelData[i - 1].zIndex === zIndex) || zIndex < 0) {
            elem.style.display = 'none';
            line = labelsLine.get(elem);
            if(line)
                line.visible = false;
        } else {
            elem.style.display = 'block';
            line = labelsLine.get(elem);
            if(line)
                line.visible = true;
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
    textName: Place, placeObject: Object3D, floorLevels: Object3D[], arrowLenght: number, arrowColor: string, fontSize = 1.1) {
    if (textName.bigcompany_id.toString() !== COMPANY_ID)
        return;
    const elem = document.createElement('div');
    const formattedKey = textName.companysubsidiary_name.split(' - ')[0].replace(/ /g, '\n');
    elem.textContent = formattedKey;
    elem.style.fontSize = fontSize + 'em';
    elem.style.fontWeight = 'bold';
    elem.style.display = 'none';
    elem.onclick = () => { SetupDescriptionCardForPlace(placeObject); };
    labelContainerElem!.appendChild(elem);
    const { center, size } = GetBoundingBoxSizeAndCenterOfObject(placeObject);
    let topCenterPosition: Vector3 = new Vector3();
    // if (floorLevels.length === 0) {
    //     topCenterPosition = new Vector3(center.x, center.y + lineHeigh, center.z);
    // }
    // else {
    //     topCenterPosition = new Vector3(center.x, center.y, center.z);
    // }
    topCenterPosition = new Vector3(center.x, (center.y + (size.y / 2 )) + arrowLenght, center.z);
    const initPosition: Vector3 = new Vector3(center.x, center.y + (size.y / 2 ), center.z);
    labelsLine.set(elem, CreateArrowRender(topCenterPosition, initPosition, topCenterPosition, arrowLenght, arrowColor));
    labelsScene.set(topCenterPosition, elem);
    const floorObj = findFloorObject(placeObject, floorLevels);
    const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
    elem.dataset.floorIndex = floorIndex.toString();
    elem.dataset.category = textName.place_category_name;
}

async function SetupDescriptionCardForPlace(object: Object3D) {
    const placeData: Place = object.userData.place;
    const description = divCardPlace.querySelector('#placeCardDescription')! as HTMLElement;
    currentController = UpdateDescription(placeData.bigcompany_id, placeData.companysubsidiary_id, description);

    // SearchPlacesByDistanceCategoryArea(object, "Restaurantes");
    /*focusCameraOnObject(object);
    spawnMarkerAboveObject(object);*/
    WaitForFocusAnimation(object, placeData);
    RestoreOriginalColors();
    ChangeColorOfSingleObject(object, COLOR_SELECTED);
    await new Promise(f => setTimeout(f, 2000));
    divCardPlace.classList.remove('hideTop');
    divCardPlace.classList.add('showTop');
    searchPanel.style.display = 'none';
    containerSearch.style.display = 'block';
    closeSeachIcon.style.display = 'none';
    (divCardPlace.querySelector('#logo_place_card') as HTMLImageElement).src = placeData.companysubsidiary_image_url;
    divCardPlace.querySelector('#placeCardName')!.innerHTML = `<b>Lugar</b>: ${placeData.companysubsidiary_name}`;
    divCardPlace.querySelector('#placeCardCategory')!.innerHTML = `<b>Categoria</b>: ${placeData.place_category_name}`;
    divCardPlace.querySelector('#placeCardArea')!.innerHTML = `<b>Ubicación</b>: ${placeData.place_area_name}`;
    (divCardPlace.querySelector('#ecommerce-redirect') as HTMLButtonElement).onclick = () => {
        EndCallView();
        DisplayChatAI(placeData.place_id);
        ClosePlaceCard();
    };
}

function SetupDescriptionCardForPlaceByID(placeID: string): { piso: string, success: boolean } {
    const object = scene.getObjectByName(placeID);
    if (!object) return { piso: "Piso no encontrado", success: false };

    const placeData: Place = object.userData.place;
    const description = divCardPlace.querySelector('#placeCardDescription')! as HTMLElement;
    currentController = UpdateDescription(placeData.bigcompany_id, placeData.companysubsidiary_id, description);
    SetupCardDescriptionCardPlace(placeData);
    const floorObj = findFloorObject(object, floorLevels);
    console.table("floorObj=" + floorObj);
    const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
    const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
    floorSelector.value = floorIndex.toString();
    showFloor(floorIndex, floorLevels, labelsScene);
    RestoreOriginalColors();
    WaitForFocusAnimation(object, placeData);
    ChangeColorOfSingleObject(object, COLOR_SELECTED);
    return { piso: `Piso ${placeData.place_area_name}`, success: true };
}

async function WaitForFocusAnimation(object: Object3D, placeData: Place) {
    console.log('Waiting for focus animation on object:', object.name);
    focusCameraOnObject(object);
    spawnMarkerAboveObject(object);
    await new Promise(f => setTimeout(f, 2000));
    SetupCardDescriptionCardPlace(placeData);
    if (placeData.bigcompany_id.toString() === COMPANY_ID) return; //dont show webview on same bigsurface

    webviewContainer.classList.add('showTop');
    webviewContainer.classList.remove('hideTop');
    const webView = document.getElementById('3DVisualizer') as HTMLIFrameElement;
    if (!webView) {
        console.error('WebView element not found');
    }
    webView.src = "https://strg01tockall.blob.core.windows.net/container-unity/Maps3D-chatbot/Visualizer3D/index.html?placeId=" + placeData.place_id + "&companyId=" + placeData.company_id + "&userId=0";
    console.log('WebView src set to:', webView.src);
}

function SetupCardDescriptionCardPlace(placeData: Place) {
    divCardPlace.classList.remove('hideTop');
    divCardPlace.classList.add('showTop');
    (divCardPlace.querySelector('#logo_place_card') as HTMLImageElement).src = placeData.companysubsidiary_image_url;
    divCardPlace.querySelector('#placeCardName')!.innerHTML = `<b>Lugar</b>: ${placeData.companysubsidiary_name}`;
    divCardPlace.querySelector('#placeCardCategory')!.innerHTML = `<b>Categoria</b>: ${placeData.place_category_name}`;
    divCardPlace.querySelector('#placeCardArea')!.innerHTML = `<b>Ubicación</b>: ${placeData.place_area_name}`;

}

/*const inputSearch = document.getElementById('threeLoad') as HTMLInputElement;
inputSearch.onclick = () => {
console.log('inputSearch clicked');
}*/
// function CreateOptionItemSearchPanelPerson() {
//     let newButton = document.createElement('button');
//     newButton.classList.add('place-item');
//     newButton.type = 'button';
//     let place: Place = {
//         place_id: 15387,
//         companysubsidiary_id: 12345,
//         companysubsidiary_name: 'Jesus Marsel Garcia Blanco',
//         place_area_name: 'Ingenieria de sistemas',
//         companysubsidiary_image_url: 'https://sasiteit.blob.core.windows.net/zion/multimedia/companies/2025-01/139_companyImage_1737038911430.jpeg',
//         company_id: 1,
//         company_name: 'Sample Company',
//         company_picture_url: 'https://sasiteit.blob.core.windows.net/zion/multimedia/companies/2025-01/139_companyImage_1737038911430.jpeg',
//         place_category_name: 'Edificio Mario Laserna, Piso 2',
//         place_area_id: 1
//     };

//     newButton.onclick = () => { ButtonActionItemSearchPanel(place) };

//     const html = `
//             <img alt="" class="image-place" src="${place.companysubsidiary_image_url}">
//             <div class="info">
//                 <span class="name-place">${place.companysubsidiary_name}</span>
//                 <span class="subname-place">${place.place_area_name}</span>
//                 <span class="building-place">${place.place_category_name}</span>
//             </div>
// `;

//     newButton.innerHTML = html;
//     return newButton; // Return the HTML string for use elsewhere if needed
// }
const closeWebView = document.getElementById('closeWebView') as HTMLInputElement;
closeWebView.onclick = () => {
    //SetupDescriptionCardForPlaceByID('1173'); // 
    webviewContainer.classList.remove('showTop');
    webviewContainer.classList.add('hideTop');
}
// const testbutton=document.getElementById('searchPlace3D') as HTMLInputElement;
// testbutton.onclick = () => {
//     SetupDescriptionCardForPlaceByID('15959'); 
// }

function CreateOptionItemSearchPanel(place: Place) {
    let newButton = document.createElement('button');
    newButton.classList.add('place-item');
    newButton.type = 'button';
    newButton.onclick = () => { ButtonActionItemSearchPanel(place) };

    const html = `
            <img alt="" class="image-place" src="${place.companysubsidiary_image_url}">
            <div class="info">
                <span class="name-place">${place.companysubsidiary_name}</span>
                <span class="subname-place">${place.place_area_name}</span>
            </div>`;

    newButton.innerHTML = html;
    return newButton; // Return the HTML string for use elsewhere if needed
}

function ButtonActionItemSearchPanel(place: Place) {
    personList.style.display = 'none';
    placesList.style.display = 'flex';
    (searchPanel as HTMLElement).style.display = 'none';

    //clear previous search
    input_searcher.value = '';
    const event = new Event('input', { bubbles: true });
    input_searcher.dispatchEvent(event);

    currentSelectedSearchButton.querySelector('.icon')!.classList.add('icon-x');
    currentSelectedSearchButton.querySelector('#name-place')!.innerHTML = place.companysubsidiary_name;
    if (currentSelectedSearchButton.id === 'buttonPerson')
        currentSelectedSearchButton.querySelector('#subname-place')!.innerHTML = place.place_category_name;
    else
        currentSelectedSearchButton.querySelector('#subname-place')!.innerHTML = place.place_area_name;

    switch (currentSelectedSearchButton.id) {
        case 'buttonStart':
            startPlaceId = place.place_id.toString();
            break;
        case 'buttonDestination':
        case 'buttonPerson':
            endPlaceId = place.place_id.toString();
            break;
    }
    checkAndDownloadJSON();
}

function ButtonActionItemSearchPanelMap3D(object: Object3D, floorLevels: Object3D[]) {
    SetupDescriptionCardForPlace(object);
    RestoreOriginalColors();
    ChangeColorOfSingleObject(object, COLOR_SELECTED);
    const floorObj = findFloorObject(object, floorLevels);
    const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
    const floorSelector = document.getElementById('floor-selector') as HTMLSelectElement;
    floorSelector.value = floorIndex.toString();
    showFloor(floorIndex, floorLevels, labelsScene);
    searchPanel.style.display = 'none';
    searchBar.value = '';
    const event = new Event('input', { bubbles: true });
    searchBar.dispatchEvent(event);
}

interface LabelData {
    elem: HTMLDivElement;
    x: number;
    y: number;
    zIndex: number;
}

export {
    initFloorSelector, initCategorySelector, CreateOptionItemSearchPanel,
    updateLabelPositions, updateLabelVisibility,
    MapObjectsListByCategoryName, labelsScene, labelContainerElem,
    SetupPlacesForSearchVirtualTour, SetupPlacesForSearchMap3D,
    CreateTextForPlace, SetupDescriptionCardForPlace, SetupDescriptionCardForPlaceByID
};
