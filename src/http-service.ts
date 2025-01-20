enum ProjectBaseURL {
  TRIPTRAPP = 'https://as-ws-triptrapp-prod.azurewebsites.net/api',
  CAFAM = 'https://as-ws-cafammelgar-pru.azurewebsites.net/api',
  SITEIT = 'https://as-siteit-pru.azurewebsites.net/api',
  ZYON = 'https://as-ws-zion-prod.azurewebsites.net/api',
  BOT = 'https://as-ws-tour.azurewebsites.net/api',
}

const urlParams = new URLSearchParams(window.location.search);
const PROJECT = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const base_url = ProjectBaseURL[PROJECT];

function get(url: string, companyId: string) {
  return fetch(`${base_url}${url}?cli=PUnity&companyId=${companyId}`, {
    method: "GET",
    headers: {
      'cli': 'PUnity',
      'companyId': companyId
    }
  });
}

function getBot(url: string, companyId: string) {
  return fetch(`${ProjectBaseURL.BOT}${url}?cli=PUnity&companyId=${companyId}`, {
    method: "GET"
  });
}

function GetPlaces(companyId: string): Promise<response> {
  return new Promise((result, reject) => {
    if(PROJECT === 'BOT') {
      getBot('/place/listall', companyId)
      .then(response => response.json())
      .then(json => result(json))
      .catch(error => reject(error));
    } else {
      get('/places/unitypublic', companyId)
        .then(response => response.json())
        .then(json => result(json.response))
        .catch(error => reject(error));
    }
  });
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
}
export interface PlaceBot {
  id: number,
  reference: string,
  name: string,
  image: string,
  category: string,
  area: {
    id: number,
    name: string,
  },
  floor: {
    id: number,
    name: string,
  },
  company: {
    id: number,
    name: string,
    logo: string,
    primary_color: string,
  }
}

interface response {
  data_place: places,
  data: placesBot,
}

/*interface data{
  places: placesBot
}*/

interface places {
  places: Place[],
}
interface placesBot {
  places: PlaceBot[],
}

export { GetPlaces, PROJECT }