import { ProjectBaseURL } from "./Types.ts";
const urlParams = new URLSearchParams(window.location.search);

export const URL_MCPCLIENT = 'http://localhost:3000';
// export const URL_MCPCLIENT = 'https://as-ws-asistente-3d.azurewebsites.net';
// export const URL_MCPCLIENT = 'https://ea7f-181-59-3-140.ngrok-free.app';

export let COMPANY_ID = urlParams.get('fakeId') || urlParams.get('placeId') || "0";
export const SERV_TYPE = urlParams.get('ServType')!;
export const IS_PRODUCTION_ENVIROMENT: boolean = 
    (urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL) === 'ZYON' ? true : false;

export function ChangeCompanyId(newCompanyId: string){
    COMPANY_ID = newCompanyId;
}