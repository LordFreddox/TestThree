export enum ProjectBaseURL {
  TRIPTRAPP = 'https://apiapp.tockall-triptrapp.com/api',
  CAFAM = 'https://apiapp.cafammelgar.tockall.com/api',
  ZYON_PRU = 'https://as-ws-siteit-test.azurewebsites.net/api',
  ZYON = 'https://apiapp.zyon.tockall.com/api'
}

const urlParams = new URLSearchParams(window.location.search);
const PROJECT = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const base_url = ProjectBaseURL[PROJECT];
const companyId = localStorage.getItem("companyId")!;

function getPlaces(url: string) {
  return fetch(`${base_url}${url}`, {
    method: "GET",
    headers: {
      'cli': 'PUnity',
      'companyId': companyId
    }
  });
}

function GetPlaces(): Promise<response> {
  return new Promise((result, reject) => {
    getPlaces('/places/unitypublic')
      .then(response => response.json())
      .then(json => result(json.response))
      .catch(error => reject(error));
  });
}

export async function GetAvatarURL(companyId: string): Promise<string | undefined> {
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
    const data = await response.json();
    return data.data.avatar.picture_url;
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

export interface Place {
  bigcompany_id: number,
  bigcompany_name_short: string,
  bigcompany_level: number,
  place_id: number,
  place_category_name: string,
  place_area_name: string,
  place_area_id: number,
  companysubsidiary_id: number,
  companysubsidiary_name: string,
  companysubsidiary_image_url: string,
  company_id: number,
  company_name: string,
  company_picture_url: string
}

interface response {
  data_place: places
}

interface places {
  places: Place[],
}

export interface Service {
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

export { GetPlaces, PROJECT }