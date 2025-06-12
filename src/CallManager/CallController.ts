import { UltravoxSession, UltravoxSessionStatus } from 'ultravox-client';
import { COMPANY_ID, IS_PRODUCTION_ENVIROMENT, URL_MCPCLIENT } from "../Utils/constants.ts";
import { handleBlockClick, serviceList } from '../ZT/ZTView.ts';
import { SetupDescriptionCardForPlaceByID } from '../view.ts';
import { EndCallView, botName } from './CallView.ts';
import { SearchPlacesByDistanceCategoryArea } from '../main.ts';
import { scene } from '../Renderer.ts';
// import { generateUUID } from 'three/src/math/MathUtils.js';
// import { GetHTMLElement } from '../Utils.ts';

const CallSession = new UltravoxSession();
let firstSpeak = true;
// let timeOutCancelation: string | number | NodeJS.Timeout | undefined;
SetupListeners();

export async function CreateCall(): Promise<boolean> {
    try {
        // const roomName = `room-${localStorage.getItem("companyId")!}-${generateUUID()}`;
        // const participantName = `participant-${localStorage.getItem("companyId")!}-${generateUUID()}`;
        // const session = await Promise.resolve(connectParticipant(participantName, roomName));
        
        const body = {
            companyId: COMPANY_ID,
            companyName: localStorage.getItem('companyName')!,
            botName: botName,
            isProductionEnviroment: IS_PRODUCTION_ENVIROMENT
        };
        const response = await fetch(`${URL_MCPCLIENT}/ultravox`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error(`error creating call in threejs`);
            return false;
        }
        const callResponse = await response.json();
        if (callResponse.error) {
            console.error(callResponse.error);
            return false;
        }

        console.log("joining call with prompt", callResponse.sysPrompt);
        CallSession.joinCall(callResponse.joinUrl);
        return true;
    } catch (error) {
        console.error(`error creating call ${error}`);
        return false;
    }
}

function SetupListeners() {
    CallSession.addEventListener('status', () => {
        console.log(`Session status changed: ${CallSession.status}`);
        switch (CallSession.status) {
            case UltravoxSessionStatus.SPEAKING:
                if (firstSpeak) {
                    firstSpeak = false;
                    EndCallView();
                }
                // clearTimeout(timeOutCancelation);
                break;
            case UltravoxSessionStatus.LISTENING:
                break;
            default:
                break;
        }
    });

    CallSession.addEventListener('transcripts', () => {
        const lastTranscript = CallSession.transcripts[CallSession.transcripts.length - 1] as Transcript;

        if (lastTranscript.speaker != 'agent') return;
        console.log('callTranscript:', lastTranscript.text);

        // const urlMatch = lastTranscript.text.match(/https?:\/\/(?:\w+\-?\.)+\w+\/(?:[^/]+\/)*[\w-]+\.php/);
        // if (urlMatch && alreadyShowWifi) {
        //     alreadyShowWifi = false;
        //     handleBlockClick(
        //         'Código WiFI',
        //         urlMatch[0].replace(/\s/g, '')
        //     );
        //     EndCallView();
        //     TimeOutUser();
        //     return;
        // }
    });
}

// const connectParticipant = async (identity: string, roomName: string): Promise<Room> => {
//     const room = new Room();
//     const { token, url } = await fetchToken(identity, roomName);

//     room.on(RoomEvent.Disconnected, () => {
//         console.log(`[${identity}] Disconnected from room`);
//     });

//     await room.connect(url, token, {
//         autoSubscribe: true,
//     } as RoomConnectOptions);

//     await new Promise<void>((resolve) => {
//         if (room.state === 'connected') {
//             resolve();
//         } else {
//             room.once(RoomEvent.Connected, () => resolve());
//         }
//     });

//     console.log(`${identity} connected.`);

//     return room;
// };

// const fetchToken = async (
//     identity: string,
//     roomName: string,
// ): Promise<{ token: string; url: string }> => {
//     const response = await fetch(`http://localhost:3000/get-token`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ identity, roomName }),
//     });

//     if (!response.ok) {
//         throw new Error('Failed to fetch token');
//     }

//     const data = await response.json();
//     return { token: data.token, url: data.url };
// };

// async function TimeOutUser(timeToOut: number = 10000) {
//     timeOutCancelation = setTimeout(() => {
//         EndCallView();
//         EndCall();
//         GetHTMLElement('.BotButton3D').style.borderStyle = 'none';
//     }, timeToOut);
// }

const FocusOnPlace = (params: any) => {
    console.log(`sending place ID for focus ${params.placeId as string}`);
    const FocusResponse = SetupDescriptionCardForPlaceByID(params.placeId as string);
    EndCallView();
    return `Lugar enfocado exitosamente en ${JSON.stringify(FocusResponse)}`;
};

const OpenServices = (params: any) => {
    if (!serviceList) return `Hubo un error al mostrar la url.`;

    console.log(`executing tool OpenServices`, params.serviceId);
    const service =
        serviceList.find(service => service.id === Number.parseInt(params.serviceId));
    if (!service) return `Hubo un error al mostrar la url.`;
    handleBlockClick(
        service?.description,
        service?.url,
        service?.id
    );
    EndCallView();
    return `Mostrando url, por favor, escanee el QR en pantalla.`;
};

const GetPlacesRecomendationByCategory = (params: any) => {
    const startObject = scene.getObjectByName(params.placeId as string);
    const categoryToSearch = params.category as string;
    console.log(`entering GetPlacesRecomendationByCategory with placeID: ${params.placeId as string} and category: ${categoryToSearch}`);
    if(!startObject) return `Lugar inicial no encontrado en escena`;
    if(!categoryToSearch) return `Categoría no enviada`;

    const foundPlaces = SearchPlacesByDistanceCategoryArea(startObject, categoryToSearch);
    if(foundPlaces.size === 0) return `No se encontraron lugares con los filtros asignados de categoría`;

    return `Se encontraron los siguientes lugares alrededor de tu ubicación con la categoría de ${categoryToSearch}: ${JSON.stringify(foundPlaces)}`;
};

CallSession.registerToolImplementations({
    "FocusOnPlace": FocusOnPlace,
    "OpenServices": OpenServices,
    "GetPlacesRecomendationByCategory": GetPlacesRecomendationByCategory
});

export function EndCall() {
    CallSession.leaveCall();
}

interface Transcript {
    isFinal: boolean,
    medium: string,
    speaker: string,
    text: string
}