import { GetHTMLElement } from "../Utils.ts";
import * as QRCode from 'qrcode';

interface Service {
    id: number;
    name: string;
    description: string;
    type: string;
    url: string;
    icon: string;
}

interface DataService {
    data: {
        services: Service[];
        total: number;
    };
    prev_page: null | any;
    next_page: null | any;
}

const containerZTList = GetHTMLElement('#containerZTList');
const ZTDescriptionTitle = GetHTMLElement('#ZTDescriptionTitle');
const ZTDescriptionArea = GetHTMLElement('#ZTDescriptionArea');
const ZTQR = GetHTMLElement('#ZTQR') as HTMLImageElement;
let isZTOpen: boolean = false;
let currentSelectService: number = 0;

GetHTMLElement('#btnZTList').onclick = () => {
    if (isZTOpen) {
        isZTOpen = false;
        containerZTList.classList.add('hideLeft');
        containerZTList.classList.remove('showLeft');
    } else {
        isZTOpen = true;
        containerZTList.classList.add('showLeft');
        containerZTList.classList.remove('hideLeft');
    }
};

async function FillZTArea() {
    try {
        const response = await fetch('src/testJsons/service_list.json');
        const data: DataService = await response.json();

        const container = GetHTMLElement('#ZTArea');

        data.data.services.forEach((service, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'ZTAction';
            itemDiv.id = `ZTBlock${index + 1}`;

            const img = document.createElement('img');
            img.src = service.icon;
            img.alt = service.name;
            // img.style.transform = `rotate(${(index) * 45}deg)`; 

            const span = document.createElement('span');
            span.textContent = service.name;

            itemDiv.appendChild(img);
            itemDiv.appendChild(span);

            itemDiv.onclick = () => {
                handleBlockClick(service);
            };

            container.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

function handleBlockClick(serviceData: Service) {
    if(ZTDescriptionArea.computedStyleMap().get('visibility') == 'visible' && 
        currentSelectService == serviceData.id){
        currentSelectService = 0;
        ZTDescriptionArea.style.visibility = 'hidden';
    }else{
        currentSelectService = serviceData.id;
        ZTDescriptionArea.style.visibility = 'visible';
        ZTDescriptionTitle.innerText = serviceData.description;    
    }

    QRCode.toDataURL(serviceData.url).then((dataUrl) => {
        ZTQR.src = dataUrl;
        ZTQR.style.height = window.getComputedStyle(ZTQR).width;
    });
}

FillZTArea();
