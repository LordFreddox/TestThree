const base_url = 'https://as-ws-triptrapp-prod.azurewebsites.net/api'

function get(url: string, companyId: string) {
  return fetch(`${base_url}${url}`, {
    method: "GET",
    headers: {
    "cli": "PUnity",
    "Content-Type": "application/json",
    "companyId": companyId,
    }
  })
}

function GetPlaces(companyId: string): Promise<response> {
  return new Promise((result, reject) => {
      get('/places/unitypublic', companyId)
        .then(response => response.json())
        .then(json => result(json.data))
        .catch(error => reject(error))
  })
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
  data_place: Place[],
}

export { GetPlaces }