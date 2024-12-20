enum ProjectBaseURL {
  TRIPTRAPP = 'https://as-ws-triptrapp-prod.azurewebsites.net/api',
  CAFAM = 'https://as-ws-cafammelgar-pru.azurewebsites.net/api',
  SITEIT = 'https://as-siteit-pru.azurewebsites.net/api',
  ZYON = 'https://as-ws-zion-prod.azurewebsites.net/api',
}

const urlParams = new URLSearchParams(window.location.search);
const project = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const base_url = ProjectBaseURL[project];

function get(url: string, companyId: string) {
  return fetch(`${base_url}${url}`, {
    method: "GET",
    headers: {
      "cli": "PUnity",
      "Content-Type": "application/json",
      "companyId": companyId,
    }
  });
}

function GetPlaces(companyId: string): Promise<response> {
  return new Promise((result, reject) => {
    get('/places/unitypublic', companyId)
      .then(response => response.json())
      .then(json => result(json.response))
      .catch(error => reject(error));
  });
}

export interface Place {  
  place_id: number,
  place_type_id: number,
  place_category_name: string,
  place_area_name: string,
  place_area_id: number,
  companysubsidiary_name: string,
  companysubsidiary_image_url: string,
  company_id: number,
  company_name: string,
  company_level: 1,
}

interface response {
  data_place: places,
}
interface places {
  places: Place[],
}

export { GetPlaces }