import { UltravoxSession, UltravoxSessionStatus } from 'ultravox-client';
import { COMPANY_ID, COMPANY_NAME, PROJECT_ENVIROMENT, URL_MCPCLIENT } from "../Utils/constants.ts";
import { handleBlockClick, serviceList } from '../ZT/ZTView.ts';
import { SetupDescriptionCardForPlaceByID } from '../view.ts';
import { EndCallView, botName } from './CallView.ts';
import { GetPlacesInfoByName, SearchPlacesByDistanceCategoryArea } from '../main.ts';
import { scene } from '../Renderer.ts';
import {
    Room, RoomEvent, RoomConnectOptions, Track, RpcInvocationData,
    RemoteParticipant, RemoteTrackPublication, RemoteTrack,
    RpcError
} from "livekit-client";
import { GetHTMLElement } from '../Utils/Utils.ts';

const CallSession = new UltravoxSession();
let firstSpeak = true;
let roomSession: Room;
// let timeOutCancelation: string | number | NodeJS.Timeout | undefined;
SetupListeners();

export async function CreateCall(): Promise<boolean> {
    try {
        const body = {
            companyId: COMPANY_ID,
            companyName: COMPANY_NAME,
            botName: botName,
            projectEnviroment: PROJECT_ENVIROMENT
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

export async function CreateCallLiveKit(): Promise<boolean> {
    try {
        const room = await Promise.resolve(connectParticipant());
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.startAudio();
        await RegisterRPCCalls(room);
        if (!room) return false;
        roomSession = room;
        return true;
    } catch (error) {
        console.error(`error creating call ${error}`);
        return false;
    }
}

async function RegisterRPCCalls(room: Room) {
    await room.registerRpcMethod(
        'EnfocarCamaraEnLugarPorID',
        async (data: RpcInvocationData) => {
            try {
                return EnfocarCamaraEnLugarPorID(data);
            } catch (error) {
                throw new RpcError(1, "No se pudo encontrar el lugar en el mapa.");
            }
        }
    );

    await room.registerRpcMethod(
        'AbrirServiciosQR',
        async (data: RpcInvocationData) => {
            try {
                return AbrirServiciosQR(data);
            } catch (error) {
                throw new RpcError(1, "Hubo un error al mostrar la url.");
            }
        }
    );

    await room.registerRpcMethod(
        'ObtenerLugaresRecomendadosPorCategoria',
        async (data: RpcInvocationData) => {
            try {
                return ObtenerLugaresRecomendadosPorCategoria(data);
            } catch (error) {
                throw new RpcError(1, "No se encontraron lugares recomendados.");
            }
        }
    );

    await room.registerRpcMethod(
        'ObtenerInfoDeLugarPorNombre',
        async (data: RpcInvocationData) => {
            try {
                return ObtenerInfoDeLugarPorNombre(data);
            } catch (error) {
                throw new RpcError(1, "No se encontraron lugares con ese nombre.");
            }
        }
    );

    console.log("registered all tools");
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
        // console.log('callTranscript:', lastTranscript.text);

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

const connectParticipant = async (): Promise<Room> => {
    const room = new Room();
    const { token, url, identity, roomName, systPromt } = await fetchToken();

    room.on(RoomEvent.Disconnected, () => {
        console.log(`[${identity}] Disconnected from room ${roomName}`);
    });

    room
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)

    await room.connect(url, token, {
        autoSubscribe: true,
    } as RoomConnectOptions);

    console.log(`${identity} connected on room ${roomName}`);
    console.log(`systPromt: ${systPromt}`);
    return room;
};

const fetchToken = async (): Promise<{
    token: string; url: string, identity: string,
    roomName: string, systPromt: string
}> => {
    const body = {
        companyId: COMPANY_ID,
        companyName: COMPANY_NAME,
        botName: botName,
        projectEnviroment: PROJECT_ENVIROMENT
    };
    const response = await fetch(`${URL_MCPCLIENT}/get-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error('Failed to fetch token');
    }

    const data = await response.json();
    return {
        token: data.token,
        url: data.url,
        identity: data.identity,
        roomName: data.roomName,
        systPromt: data.systPromt
    };
};

// async function TimeOutUser(timeToOut: number = 10000) {
//     timeOutCancelation = setTimeout(() => {
//         EndCallView();
//         EndCall();
//         GetHTMLElement('.BotButton3D').style.borderStyle = 'none';
//     }, timeToOut);
// }

function EnfocarCamaraEnLugarPorID(data: RpcInvocationData) {
    // function EnfocarCamaraEnLugarPorID(params: any) {
    let params = JSON.parse(data.payload);
    console.log(`sending place ID for focus ${params.placeId as string}`);
    const FocusResponse = SetupDescriptionCardForPlaceByID(params.placeId as string);
    EndCallView();
    if (FocusResponse.success)
        return `Lugar enfocado exitosamente en ${JSON.stringify(FocusResponse)}`;
    else
        return "No se pudo encontrar el lugar en el mapa.";
};

function AbrirServiciosQR(data: RpcInvocationData) {
    // function OpenServices(params: any) {
    if (!serviceList) return `Hubo un error al mostrar el QR.`;
    let params = JSON.parse(data.payload);
    console.log(`executing tool OpenServices`, params.serviceId as number);
    const service =
        serviceList.find(service => service.id === Number.parseInt(params.serviceId));
    if (!service) return `Hubo un error al mostrar el QR.`;
    handleBlockClick(
        service?.description,
        service?.url,
        service?.id
    );
    EndCallView();
    return `Mostrando url, por favor, escanee el QR en pantalla.`;
};

function ObtenerLugaresRecomendadosPorCategoria(data: RpcInvocationData) {
    // function GetPlacesRecomendationByCategory(params: any) {
    let params = JSON.parse(data.payload);
    const startObject = scene.getObjectByName(params.placeId as string);
    const categoryToSearch = params.category as string;
    console.log(`entering GetPlacesRecomendationByCategory with placeID: ${params.placeId as string} and category: ${categoryToSearch}`);
    if (!startObject) return `Lugar inicial no encontrado en escena`;
    if (!categoryToSearch) return `Categoría no enviada`;

    const foundPlaces = SearchPlacesByDistanceCategoryArea(startObject, categoryToSearch);
    if (foundPlaces.size === 0) return `No se encontraron lugares con los filtros asignados de categoría`;

    return `Se encontraron los siguientes lugares alrededor de tu ubicación con la categoría de ${categoryToSearch}: ${JSON.stringify(foundPlaces)}`;
};

function ObtenerInfoDeLugarPorNombre(data: RpcInvocationData){
    let params = JSON.parse(data.payload);
    const placesFound = GetPlacesInfoByName(params.place_name);
    if(placesFound.length > 0)
        return JSON.stringify(placesFound);
    else
        return `No se encontraron lugares con ese nombre`;
}

// CallSession.registerToolImplementations({
//     "FocusOnPlace": FocusOnPlace,
//     "OpenServices": OpenServices,
//     "GetPlacesRecomendationByCategory": GetPlacesRecomendationByCategory
// });

export function EndCall() {
    roomSession?.disconnect();
    // CallSession?.leaveCall();
}

function handleTrackSubscribed(
    track: RemoteTrack,
    _publication: RemoteTrackPublication,
    _participant: RemoteParticipant,
) {
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
        // attach it to a new HTMLVideoElement or HTMLAudioElement
        const element = track.attach();
        GetHTMLElement('#AudioParent').appendChild(element);
    }
}

function handleTrackUnsubscribed(
    track: RemoteTrack,
    _publication: RemoteTrackPublication,
    _participant: RemoteParticipant,
) {
    // remove tracks from all attached elements
    track.detach();
}

interface Transcript {
    isFinal: boolean,
    medium: string,
    speaker: string,
    text: string
}