enum ProjectBaseURL {
  TRIPTRAPP = 'https://apiapp.tockall-triptrapp.com/api',
  CAFAM = 'https://apiapp.cafammelgar.tockall.com/api',
  ZYON_PRU = 'https://as-ws-siteit-test.azurewebsites.net/api',
  ZYON = 'https://apiapp.zyon.tockall.com/api'
}

//https://api.zyon.tockall.com/api/v1/posts/list?page=1&cant=12 

const urlParams = new URLSearchParams(window.location.search);
const PROJECT = urlParams.get('project')?.toUpperCase() as keyof typeof ProjectBaseURL;
const base_url = ProjectBaseURL[PROJECT];
const companyId = urlParams.get('fakeId') || urlParams.get('placeId') || "0";

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

// interface PostResponse {
//   "data": {
//     "posts": [
//       {
//         "post_info": {
//           "text": string,
//           "url": string,
//           "post_type": string
//         },
//         "created_date": number,
//         "attributes": [
//           {
//             "type": string
//             "interactions": number
//           },
//           {
//             "type": string
//             "interactions": number
//           }
//         ]
//       }
//     ]
//   }
// }

interface places {
  places: Place[],
}

export { GetPlaces, PROJECT, GetPost }