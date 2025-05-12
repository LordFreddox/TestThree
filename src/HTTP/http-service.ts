export enum ProjectBaseURL {
  TRIPTRAPP = 'https://apiapp.tockall-triptrapp.com/api',
  CAFAM = 'https://apiapp.cafammelgar.tockall.com/api',
  ZYON_PRU = 'https://as-ws-siteit-test.azurewebsites.net/api',
  ZYON = 'https://apiapp.zyon.tockall.com/api'
}

// https://api-dev.zyon.tockall.com/api este es servicios de la app pruebas pero esta
// https://as-ws-siteit-test.azurewebsites.net/api es la de pruebas para 3D, toca actualizar

const urlParams = new URLSearchParams(window.location.search);
const PROJECT = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const base_url = ProjectBaseURL[PROJECT];
const companyId = localStorage.getItem("companyId")!;
const DEV_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdBanhpN1EwWExnMHFRbTQ5MGtDMSJ9.eyJpc3MiOiJodHRwczovL2Rldi16aW9uLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2NjliZjc5Y2QwYjAzYTE1YTk4NmJkZmYiLCJhdWQiOlsiaHR0cHM6Ly9hcy13cy16aW9uLXBydS5henVyZXdlYnNpdGVzLm5ldC8iLCJodHRwczovL2Rldi16aW9uLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NDY3NDU5MzMsImV4cCI6MTc0NjgzMjMzMywic2NvcGUiOiJvcGVuaWQgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJndHkiOiJwYXNzd29yZCIsImF6cCI6ImtIaXZMZWVwTmoyRDN0WU5vbFZEVnBtaFVnelNsWXcwIiwicGVybWlzc2lvbnMiOltdfQ.FNDprLwveo1BXEp9jHQx2mq4Krjhvv1mVJnqnkUKedSWUr-20YYg7Sp07fXn1xb-jyA_Jl94cgrkktMC7kh9fhcdb-C6Q5mVoMK-5Wm3ETAhRnSIYD7wq51XTaDJEv-FcQAjhE4AO33WzUfBzyUakJZOau4JYS2TDRupaXjc84dAyz_HriduJQ6_zisn6kb5efie6Slp5a-lTXT1AxLbcP5TRT_tgqpMdyWlEFRvCrDifPjV0Kss1aPUzKVf5-MOukzGT9s5TQBVZiphQk5HViH-q5u_WM39akzNtwJmjC4tGxU5jV9ONnHPmk2svk36k2RsEff_y4g_MXJBqIF4dQ';
let currentToken: string = '';

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

function getPost(url: string, postCount: number) {
  return fetch(`${base_url}${url}?cant=${postCount}`, {
    method: "GET",
    headers: {
      'cli': 'PUnity',
      'placeid': companyId,
      'placetype': 'company',
      'poststype': 'place',
      'infolevel': '2',
      'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdBanhpN1EwWExnMHFRbTQ5MGtDMSJ9.eyJpc3MiOiJodHRwczovL2Rldi16aW9uLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2NjliZjc5Y2QwYjAzYTE1YTk4NmJkZmYiLCJhdWQiOlsiaHR0cHM6Ly9hcy13cy16aW9uLXBydS5henVyZXdlYnNpdGVzLm5ldC8iLCJodHRwczovL2Rldi16aW9uLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NDMwMjI5OTMsImV4cCI6MTc0MzEwOTM5Mywic2NvcGUiOiJvcGVuaWQgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJndHkiOiJwYXNzd29yZCIsImF6cCI6ImtIaXZMZWVwTmoyRDN0WU5vbFZEVnBtaFVnelNsWXcwIiwicGVybWlzc2lvbnMiOltdfQ.em0KH34bB4kyg_GThsJ7KfKUCQNWzAhfnu4jT2SPzR_XmWN-Wz6BMvQcPGsm_W-UUaa7Jm0pVw5ISKfPRn2mYToRI-JvxZavXPoGYoCwwd_4fCxsOu7RtUO5cK9AU3bp6bBiT1HxbfXBJSDSiXIIRtRvr888bkKk_kGTKq7P6iM9IJ_t5wzyF4AKQ4acTM_YPGkeMEXxAnFm7f-SLXtbxbEgDukBJxN8pj1JmNmO8KsP4DASJZ4g_9ZCoevix8tHdzAkbWjowlegLe1d5zle7bK9IUK2Swsx_jh6wq_--vq9riy9-9uUR5glbLHoOXPSpTYI77HsSu9rtMbloRDYyw'
    }
  });
}

function GetPost(postCount: number): Promise<any> {
  return new Promise((result, reject) => {
    getPost('/v1/posts/list', postCount)
      .then(response => response.json())
      .then(json => result(json))
      .catch(error => reject(error));
  });
}

async function GenerateGuessTokenProd(): Promise<string> {
  try {
    if (currentToken != '') {
      return currentToken;
    }
    const response = await fetch('', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cli': 'PUnity'
      }
    });
    const data = await response.json();
    currentToken = data.data.token;
    return data.data.token;
  } catch (error) {
    return '';
  }
}

async function GetToken(): Promise<string> {
  switch (PROJECT) {
    case 'ZYON_PRU':
      return `Bearer ${DEV_TOKEN}`;

    case 'ZYON':
      const prodToken = await GenerateGuessTokenProd();
      if (prodToken == '')
        return '';
      else
        return `Bearer ${prodToken}`;

    default:
      return '';
  }
}

export async function GetAvatarURL(companyId: string): Promise<string> {
  try {
    const token = await GetToken();
    const response = await fetch(`${base_url}/v1/places/avatar`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cli': 'PUnity',
        'placeid': companyId,
        'placetype': 'company',
        'authorization': token
      }
    });
    const data = await response.json();
    return data.data.avatar.picture_url;
  } catch (error) {
    return '';
  }
}

export async function GetServiceList(companyId: string): Promise<Service[]> {
  const token = await GetToken();
  const response = await fetch(`${base_url}/v1/services/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'cli': 'PUnity',
      'placeid': companyId,
      'placetype': 'company',
      'authorization': token
    }
  });
  const parsedResponse = await response.json() as DataService;
  return parsedResponse.data.services;
}

export interface Place {
  place_id: number,
  place_category_name: string,
  place_area_name: string,
  place_area_id: number,
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

export { GetPlaces, PROJECT, GetPost }