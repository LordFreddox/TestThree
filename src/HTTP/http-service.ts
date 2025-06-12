import { COMPANY_ID } from "../Utils/constants.ts";
import { AvatarResponse, ResponsePlaces, Service, DataService, ProjectBaseURL } from "../Utils/Types.ts";

const urlParams = new URLSearchParams(window.location.search);
const PROJECT = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const base_url = ProjectBaseURL[PROJECT];

function getPlaces(url: string) {
  return fetch(`${base_url}${url}`, {
    method: "GET",
    headers: {
      'cli': 'PUnity',
      'companyId': COMPANY_ID
    }
  });
}

function GetPlaces(): Promise<ResponsePlaces> {
  return new Promise((result, reject) => {
    getPlaces('/places/unitypublic')
      .then(response => response.json())
      .then(json => result(json.response))
      .catch(error => reject(error));
  });
}

export async function GetAvatarURL(companyId: string): Promise<AvatarResponse | undefined> {
  try {
    const response = await fetch(`https://as-ws-zyon-pru.azurewebsites.net/api/v1/three/avatar`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cli': 'PUnity',
        'placeid': companyId,
        'placetype': 'company'
      }
    });
    const data = await response.json() as AvatarResponse;
    return data;
  } catch (error) {
    return;
  }
}

export async function GetServiceList(companyId: string): Promise<Service[] | undefined> {
  try {
    const response = await fetch(`https://as-ws-zyon-pru.azurewebsites.net/api/v1/three/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cli': 'PUnity',
        'placeid': companyId,
        'placetype': 'company'
      }
    });
    const parsedResponse = await response.json() as DataService;
    return parsedResponse.data.services;
  } catch (error) {
    console.error('error getting services', error);
    return;
  }
}

export { GetPlaces, PROJECT }