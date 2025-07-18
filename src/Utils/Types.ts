export enum ProjectBaseURL {
    TRIPTRAPP = 'https://apiapp.tockall-triptrapp.com/api',
    CAFAM = 'https://apiapp.cafammelgar.tockall.com/api',
    ZYON_PRU = 'https://as-ws-siteit-test.azurewebsites.net/api',
    ZYON = 'https://apiapp.zyon.tockall.com/api'
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

export interface PlaceShort{
    place_id: number,
    place_category_name: string,
    place_area_name: string,
    companysubsidiary_name: string,
}

export interface ResponsePlaces {
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

export interface DataService {
    data: {
        services: Service[];
        total: number;
    };
    prev_page: null | any;
    next_page: null | any;
}

export interface AvatarResponse {
    data: {
        avatar: {
            "picture_url": string,
            "audio_url": string,
            "name": string
        }
    }
}