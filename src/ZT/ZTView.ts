import { GetHTMLElement, IsLocalHost } from "../Utils.ts";
import { GetServiceList, Service } from '../HTTP/http-service.ts';
import * as QRCode from 'qrcode';

const containerZTList = GetHTMLElement('#containerZTList');
const ZTDescriptionTitle = GetHTMLElement('#ZTDescriptionTitle');
const ZTDescriptionArea = GetHTMLElement('#ZTDescriptionArea');
const ZTQR = GetHTMLElement('#ZTQR') as HTMLImageElement;
let isZTOpen: boolean = false;
let currentSelectService: number = 0;

export async function FillZTArea(companyId: string) {
    try {
        let serviceList: Service[];
        if (IsLocalHost()) {
            let response = await fetch('src/testJsons/service_list.json');
            const parsedResponse = await response.json();
            serviceList = parsedResponse.data.services;
        } else {
            serviceList = await GetServiceList(companyId);
        }

        const container = GetHTMLElement('#ZTArea');

        serviceList.forEach((service, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'ZTAction';
            itemDiv.id = `ZTBlock${index + 1}`;

            const img = document.createElement('img');
            let originalSrc = service.icon;
            if (originalSrc && originalSrc.trim() !== '') {
                img.src = originalSrc;
                img.onerror = () => {
                    img.src = './img/ZT_icon_compass.svg';
                };
            } 
            else {
                img.src = './img/ZT_icon_compass.svg';
            }

            img.alt = service.name;

            const span = document.createElement('span');
            span.textContent = service.name;

            itemDiv.appendChild(img);
            itemDiv.appendChild(span);

            itemDiv.onclick = () => {
                handleBlockClick(service);
            };

            container.appendChild(itemDiv);
        });

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
    } catch (error) {
        GetHTMLElement('#containerZTList').style.display = 'none';
        console.error('Error loading services:', error);
    }
}

function handleBlockClick(serviceData: Service) {
    if (ZTDescriptionArea.computedStyleMap().get('visibility') == 'visible' &&
        currentSelectService == serviceData.id) {
        currentSelectService = 0;
        ZTDescriptionArea.style.visibility = 'hidden';
    } else {
        currentSelectService = serviceData.id;
        ZTDescriptionArea.style.visibility = 'visible';
        ZTDescriptionTitle.innerText = serviceData.description;
    }

    QRCode.toDataURL(serviceData.url).then((dataUrl) => {
        ZTQR.src = dataUrl;
        ZTQR.style.height = window.getComputedStyle(ZTQR).width;
    });
}