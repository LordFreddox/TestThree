import { GetHTMLElement, IsLocalHost } from "../Utils.ts";
import { GetServiceList, Service } from '../HTTP/http-service.ts';
import * as QRCode from 'qrcode';

export let serviceList: Service[] | undefined;

const containerZTList = GetHTMLElement('#containerZTList');
const ZTDescriptionTitle = GetHTMLElement('#ZTDescriptionTitle');
const ZTDescriptionArea = GetHTMLElement('#ZTDescriptionArea');
const btnZTList = GetHTMLElement('#btnZTList');
const ZTQR = GetHTMLElement('#ZTQR') as HTMLImageElement;
let isZTOpen: boolean = false;
let currentSelectService: number = 0;

export async function FillZTArea(companyId: string) {
    try {
        if (IsLocalHost()) 
        {
            let response = await fetch('https://strg01tockall.blob.core.windows.net/container-unity/Maps3D-chatbot/testJSON/service_list.json');
            const parsedResponse = await response.json();
            serviceList = parsedResponse.data.services;
        } else {
            serviceList = await GetServiceList(companyId);
        }
        if(!serviceList){
            btnZTList.style.visibility = 'hidden';
            return;
        }

        const container = GetHTMLElement('#ZTArea');

        serviceList.forEach((service, index) => {
            if(!service.url) return;
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
                handleBlockClick(service.description, service.url, service.id);
            };

            container.appendChild(itemDiv);
        });

        btnZTList.onclick = () => {
            if (isZTOpen) {
                SetCloseZTState();
            } else {
                SetOpenZTState();
            }
        };

    } catch (error) {
        GetHTMLElement('#containerZTList').style.display = 'none';
        console.error('Error loading services:', error);
    }
}
export function HideZT() {
    ZTDescriptionArea.style.visibility = 'hidden';
}

function SetOpenZTState() {
    isZTOpen = true;
    containerZTList.classList.add('showLeft');
    containerZTList.classList.remove('hideLeft');
    btnZTList.style.transform = 'scaleX(-1)';
}

function SetCloseZTState() {
    isZTOpen = false;
    containerZTList.classList.add('hideLeft');
    containerZTList.classList.remove('showLeft');
    btnZTList.style.transform = 'scaleX(1)';
}

export function handleBlockClick(description: string, url: string, id: number = 0,) {
    SetOpenZTState();
    if (ZTDescriptionArea.computedStyleMap().get('visibility') == 'visible' &&
        currentSelectService == id) {
        currentSelectService = 0;
        ZTDescriptionArea.style.visibility = 'hidden';

    } else {
        currentSelectService = id;
        ZTDescriptionArea.style.visibility = 'visible';
        ZTDescriptionTitle.innerText = description;
    }

    QRCode.toDataURL(url).then((dataUrl) => {
        ZTQR.src = dataUrl;
        ZTQR.style.height = window.getComputedStyle(ZTQR).width;
    });
}