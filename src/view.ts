import { Object3D, Color, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { camera, canvas } from './Renderer.ts';
import { Place, PROJECT } from './http-service.js';
import { companyId } from './main.ts';
import { getPathAndDisplay } from './Navigator.ts';
import { GetBoundingBoxSizeAndCenterOfObject, GetHTMLElement } from './Utils.ts';
import { setCurrentAgent } from './chat.ts';
import { UpdateDescription } from './AI.ts';
// import * as QRCode from 'qrcode';

const COLOR_SELECTED = new Color(0x733D96);
let MapObjectsListByCategoryName = {} as { [key: string]: Object3D[] };
let MapObjectPlacesText = {} as { [key: string]: Object3D[] };
const originalColors = new Map<Object3D, Color>();
const tempV = new Vector3();
const paddingBetweenText = 30;
const BASE_URL_PATH_DESCRIPTION = 'https://strg01tockall.blob.core.windows.net/container-unity/ResumenRecorridos/';
const searchBar = document.getElementById('search-bar') as HTMLInputElement;
const input_searcher = document.getElementById('input_searcher') as HTMLInputElement;
const placeSelectors = document.getElementsByClassName('container-input');
let labelsScene = new Map<Vector3, HTMLDivElement>();
const labelContainerElem = document.querySelector('#labelsScene');
let startPlaceId: string | undefined;
let endPlaceId: string | undefined
const searchPanel = GetHTMLElement('.container-select-place');
const descriptionPathPanel = document.getElementById('description-path');
const placesList = GetHTMLElement('#placesList');
const personList = GetHTMLElement('#personList');
const divCardPlace = GetHTMLElement('#divCardPlace');
let isPlaceCardShowing: boolean = false;

// const SearchPlacePersonText = GetHTMLElement('#SearchPlacePersonText');
let currentSelectedSearchButton: HTMLElement;

function normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove all diacritical marks
}

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

searchBar?.addEventListener('input', () => {
    const searchTerm = searchBar.value.toLowerCase();
    filterCarouselItems(searchTerm);
});

GetHTMLElement('#closePlaceCard').onclick = () => {
    ClosePlaceCard();
};

function ClosePlaceCard(){
    divCardPlace.style.visibility = 'hidden';
    isPlaceCardShowing = false;
}

function DisplayChatAI(idPlace: string){
    //use idPlace to know what aget chat to activate, for now activate GetHTMLElement('.msger')
    setCurrentAgent(idPlace);
    GetHTMLElement('.msger').style.display = 'flex';
    GetHTMLElement('#footer-button').style.display = 'none';
}

GetHTMLElement('#CloseChatHeaderButton').onclick = (event) => {
    GetHTMLElement('.msger').style.display = 'none';
    GetHTMLElement('#footer-button').style.display = 'block';
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

GetHTMLElement('#back3D').onclick = async () => {
    document.getElementById('div3DView')!.style.display = 'none';
    document.getElementById('search-section')!.style.display = 'block';
};

GetHTMLElement('#previewButton').onclick = async () => {
    document.getElementById('div3DView')!.style.display = 'block';
    document.getElementById('search-section')!.style.display = 'none';
    updateLabelPositions();
    if (!startPlaceId || !endPlaceId) return;
    getPathAndDisplay(startPlaceId, endPlaceId);
};

GetHTMLElement('#fullviewButton').onclick = async () => {
    if (!startPlaceId || !endPlaceId) return;
    if (startPlaceId === endPlaceId) return;
    window.open(ConstructUnityVirtualTourURL(companyId, startPlaceId, endPlaceId, PROJECT.toLowerCase()),
    '_blank'); //CHANGE BOT TEST 3/7/2025

    // const QRElement = GetHTMLElementByID('QRDisplay');
    // QRElement.style.display = 'block';
    // const urlQR = ConstructUnityVirtualTourURL(companyId, startPlaceId, endPlaceId, PROJECT.toLowerCase());
    // QRCode.toDataURL(urlQR).then((dataUrl) => {
    //     const qrCodeImage = document.getElementById('qrcode') as HTMLImageElement;
    //     qrCodeImage.src = dataUrl;
    //     qrCodeImage.style.height = window.getComputedStyle(qrCodeImage).width;
    // });
};

GetHTMLElement('#ExitQR').onclick = () => {
    if (!startPlaceId || !endPlaceId) return;
    if (startPlaceId === endPlaceId) return;
    window.open(ConstructUnityVirtualTourURL(companyId, startPlaceId, endPlaceId, PROJECT.toLowerCase()),
        '_blank');
    GetHTMLElement('#QRDisplay').style.display = 'none';
};

function ConstructUnityVirtualTourURL(companyId: string, startPlaceId: string, endPlaceId: string, project: string): string {
    const baseUrl = `https://strg01tockall.blob.core.windows.net/container-unity/UnityBundles/webgl/3DExperiences/index.html`;
    const urlParams = new URLSearchParams({ BigSurfaceId: companyId, Start: startPlaceId, Place: endPlaceId, ServType: "1", project: project });
    return `${baseUrl}?${urlParams.toString()}`;

    //TODO: Parse in unity the project type
}

function AddCarouselItem(imageUrl: string, description: string,
    object: Object3D, floorLevels: Object3D[]) {
    const carouselContainer = document.querySelector('.carousel-container');
    const newItem = document.createElement('div');
    newItem.classList.add('carousel-item');
    newItem.innerHTML = `
        <img src="${imageUrl}" alt="${description}">
        <p>${description}</p>
    `;
    carouselContainer!.appendChild(newItem);
    newItem.addEventListener('click', () => {
        SetupDescriptionCardForPlace(object);
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

function SetupPlacesForSearch(places: Place[]) {
    // const panelListSearch = document.getElementById('placesList') as HTMLElement;
    // const panelListSearchPerson = document.get
    places.forEach((_, index) => {
        placesList.appendChild(CreateOptionItemSearchPanel(places[index]));
    });
    //setup personlist aswell for testing purpouse
    personList.appendChild(CreateOptionItemSearchPanelPerson());

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

    const url = BASE_URL_PATH_DESCRIPTION + `${companyId}-${new URLSearchParams(window.location.search).get('project')?.toUpperCase()}` + "/resumen-" + startPlaceId + "_" + endPlaceId + ".json";

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
    // const defaultOption = document.createElement('option');
    // defaultOption.value = '-1';
    // defaultOption.text = 'Todos los Pisos';
    // floorSelector.appendChild(defaultOption);

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

function updateLabelPositions() {
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

function updateLabelVisibility() {
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

        if (overlap || (i > 0 && labelData[i - 1].zIndex === zIndex) || zIndex < 0) {
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
    textName: Place, placeObject: Object3D, floorLevels: Object3D[], fontSize = 1.1,) {
    const elem = document.createElement('div');
    const formattedKey = textName.companysubsidiary_name.split(' - ')[0].replace(/ /g, '\n');
    elem.textContent = formattedKey;
    elem.style.fontSize = fontSize + 'em';
    elem.style.fontWeight = 'bold';
    labelContainerElem!.appendChild(elem);
    const { size, center } = GetBoundingBoxSizeAndCenterOfObject(placeObject);
    const topCenterPosition = new Vector3(center.x, 1, center.z);
    labelsScene.set(topCenterPosition, elem);
    const floorObj = findFloorObject(placeObject, floorLevels);
    const floorIndex = floorObj ? floorLevels.indexOf(floorObj) : -1;
    elem.dataset.floorIndex = floorIndex.toString();
    elem.dataset.category = textName.place_category_name;
}

async function SetupDescriptionCardForPlace(object: Object3D){
    isPlaceCardShowing = true;
    RestoreOriginalColors();
    ChangeColorOfSingleObject(object, COLOR_SELECTED);
    divCardPlace.style.visibility = 'visible';
    (divCardPlace.querySelector('#logo_place_card') as HTMLImageElement).src = object.userData.place.companysubsidiary_image_url;
    divCardPlace.querySelector('#placeCardName')!.innerHTML = `<b>Lugar</b>: ${object.userData.place.companysubsidiary_name}`;
    divCardPlace.querySelector('#placeCardCategory')!.innerHTML = `<b>Categoria</b>: ${object.userData.place.place_category_name}`;
    divCardPlace.querySelector('#placeCardArea')!.innerHTML = `<b>Ubicación</b>: ${object.userData.place.place_area_name}`;
    (divCardPlace.querySelector('#ecommerce-redirect') as HTMLButtonElement).onclick = () => {
        DisplayChatAI(object.userData.place.id);
        ClosePlaceCard();
    };
    divCardPlace.querySelector('#placeCardDescription')!.innerHTML = 'Cargando informacion...';
    const descriptionUpdate = await UpdateDescription(object.userData.place.company_id)
    divCardPlace.querySelector('#placeCardDescription')!.innerHTML = descriptionUpdate;
}

function CreateOptionItemSearchPanelPerson() {
    let newButton = document.createElement('button');
    newButton.classList.add('place-item');
    newButton.type = 'button';
    let place: Place = {
        place_id: 15387,
        companysubsidiary_name: 'Jesus Marsel Garcia Blanco',
        place_area_name: 'Ingenieria de sistemas',
        companysubsidiary_image_url: 'https://sasiteit.blob.core.windows.net/zion/multimedia/companies/2025-01/139_companyImage_1737038911430.jpeg',
        company_id: 1,
        company_name: 'Sample Company',
        company_picture_url: 'https://sasiteit.blob.core.windows.net/zion/multimedia/companies/2025-01/139_companyImage_1737038911430.jpeg',
        place_category_name: 'Edificio Mario Laserna, Piso 2',
        place_area_id: 1
    };

    newButton.onclick = () => { ButtonActionItemSearchPanel(place) };

    const html = `
            <img alt="" class="image-place" src="${place.companysubsidiary_image_url}">
            <div class="info">
                <span class="name-place">${place.companysubsidiary_name}</span>
                <span class="subname-place">${place.place_area_name}</span>
                <span class="building-place">${place.place_category_name}</span>
            </div>
            <img src="/img/icon-arrow-right.svg" alt="" class="icon-right">`;

    newButton.innerHTML = html;
    return newButton; // Return the HTML string for use elsewhere if needed
}

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
            </div>
            <img src="/img/icon-arrow-right.svg" alt="" class="icon-right">`;

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

interface LabelData {
    elem: HTMLDivElement;
    x: number;
    y: number;
    zIndex: number;
}

export {
    initFloorSelector, initCategorySelector, AddCarouselItem,
    updateLabelPositions, updateLabelVisibility, isPlaceCardShowing,
    MapObjectsListByCategoryName, labelsScene, labelContainerElem,
    SetupPlacesForSearch, CreateTextForPlace, SetupDescriptionCardForPlace
};
