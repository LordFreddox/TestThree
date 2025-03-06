enum ProjectBaseURL {
  TRIPTRAPP = 'https://apiapp.tockall-triptrapp.com/api',
  CAFAM = 'https://apiapp.cafammelgar.tockall.com/api',
  ZYON_PRU = 'https://as-ws-siteit-test.azurewebsites.net/api',
  ZYON = 'https://apiapp.zyon.tockall.com/api'
}

const urlParams = new URLSearchParams(window.location.search);
const PROJECT = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const base_url = ProjectBaseURL[PROJECT];

function get(url: string, companyId: string) {
  return fetch(`${base_url}${url}`, {
    method: "GET",
    headers: {
      'cli': 'PUnity',
      'companyId': companyId
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

export { GetPlaces, PROJECT }