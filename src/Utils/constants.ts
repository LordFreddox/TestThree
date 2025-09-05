import { ProjectBaseURL } from "./Types.ts";
const urlParams = new URLSearchParams(window.location.search);

// export const URL_MCPCLIENT = 'http://localhost:3000';
export const URL_MCPCLIENT = 'https://as-ws-asistente-3d.azurewebsites.net';
// export const URL_MCPCLIENT = 'https://d723-181-59-2-144.ngrok-free.app';

export const THREEJS_PROD_URL = 'https://as-ws-zyon.azurewebsites.net';
export const THREEJS_PRU_URL = 'https://as-ws-zyon-pru.azurewebsites.net';
export const THREEJS_TRIPTRAPP = 'https://api.tockall-triptrapp.com';
export const THREEJS_CAFAM = '';

export let COMPANY_ID = urlParams.get('fakeId') || urlParams.get('placeId') || "0";
export const FAKE_ID = urlParams.get('fakeId');
export const SERV_TYPE = urlParams.get('ServType')!;
export const START_POINT = urlParams.get('startPoint');
export let COMPANY_NAME: string = '';
export let BOT_NAME: string = 'Guía Zyon';
export const PROJECT_ENVIROMENT: string = 
    (urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL);

export function ChangeCompanyId(newCompanyId: string){
    COMPANY_ID = newCompanyId;
}

export function ChangeCompanyName(newCompanyName: string){
    COMPANY_NAME = newCompanyName;
}

export function ChangeBotName(newBotName: string){
    BOT_NAME = newBotName;
}