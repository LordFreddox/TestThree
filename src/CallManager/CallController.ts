import { UltravoxSession, UltravoxSessionStatus } from 'ultravox-client';
import { COMPANY_ID, COMPANY_NAME, PROJECT_ENVIROMENT, START_POINT, URL_MCPCLIENT } from "../Utils/constants.ts";
import { handleBlockClick, serviceList } from '../ZT/ZTView.ts';
import { SetupDescriptionCardForPlaceByID } from '../view.ts';
import { EndCallView, HideCallViewTranscript, UpdateIsOnCallStatus, botName } from './CallView.ts';
import { GetAllCategories, GetPlacesInfoByName, SearchPlacesByDistanceCategoryArea } from '../main.ts';
import {
    Room, RoomEvent, RoomConnectOptions, Track, RpcInvocationData,
    RemoteParticipant, RemoteTrackPublication, RemoteTrack,
    RpcError, TranscriptionSegment, Participant, TrackPublication,
    DisconnectReason
} from "livekit-client";
import { GetHTMLElement } from '../Utils/Utils.ts';
import { scene } from '../Renderer.ts';

const CallSession = new UltravoxSession();
let firstSpeak = true;
let roomSession: Room;
let transcriptTimeout: number | ReturnType<typeof setTimeout> | undefined;
SetupListeners();

export async function CreateCallUltravox(): Promise<boolean> {
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

        await room.registerRpcMethod(
        'ObtenerListadoDeCategorias',
        async (_data: RpcInvocationData) => {
            try {
                return ObtenerListadoDeCategorias();
            } catch (error) {
                throw new RpcError(1, "No se pudo obtener las categorias en este momento.");
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
        .on(RoomEvent.TranscriptionReceived, handleTranscriptionReceived)
        .on(RoomEvent.Disconnected, handleRoomDisconnect)

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

function EnfocarCamaraEnLugarPorID(data: RpcInvocationData) {
    // function EnfocarCamaraEnLugarPorID(params: any) {
    let params = JSON.parse(data.payload);
    console.log(`sending place ID for focus ${params.placeId as string}`);
    const FocusResponse = SetupDescriptionCardForPlaceByID(params.placeId as string);
    //EndCallView();
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
    //EndCallView();
    return `Mostrando url, por favor, escanee el QR en pantalla.`;
};

function ObtenerLugaresRecomendadosPorCategoria(data: RpcInvocationData) {
    let params = JSON.parse(data.payload);
    if(!START_POINT) return `No se puede recomendar lugares en este momento.`;

    const startObject = scene.getObjectByName(START_POINT);
    const categoryToSearch = params.category as string;
    console.log(`entering GetPlacesRecomendationByCategory with category: ${categoryToSearch}`);
    if (!startObject) return `Lugar inicial no encontrado en escena`;
    if (!categoryToSearch) return `Categoría no enviada`;

    return SearchPlacesByDistanceCategoryArea(startObject, categoryToSearch);
};

function ObtenerInfoDeLugarPorNombre(data: RpcInvocationData) {
    let params = JSON.parse(data.payload);
    console.log(`sending place_name for info ${params.placeName as string}`);
    const placesFound = GetPlacesInfoByName(params.placeName);
    if (placesFound.length > 0) {
        console.log(`se encontraron ${placesFound.length} lugares con ese nombre`);
        console.log(JSON.stringify(placesFound));
        return JSON.stringify(placesFound);
    }
    else {
        console.log(`No se encontraron lugares con ese nombre`);
        return `No se encontraron lugares con ese nombre`;
    }
}

function ObtenerListadoDeCategorias() {
    const categoriesFound = GetAllCategories();
    if (categoriesFound.length > 0) {
        console.log(`se encontraron ${categoriesFound.length} categorias.`);
        console.log(JSON.stringify(categoriesFound));
        return JSON.stringify(categoriesFound);
    }
    else {
        console.log(`No se encontraron categorias`);
        return `No se encontraron categorias`;
    }
}

// CallSession.registerToolImplementations({
//     "FocusOnPlace": FocusOnPlace,
//     "OpenServices": OpenServices,
//     "GetPlacesRecomendationByCategory": GetPlacesRecomendationByCategory
// });

export function EndCall() {
    UpdateIsOnCallStatus(false);
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

function handleTranscriptionReceived(
    transcription: TranscriptionSegment[],
    _participant?: Participant | undefined,
    _publication?: TrackPublication | undefined
) {
    if (transcription.length === 0) return;

    console.log(transcription[transcription.length - 1].text)

    if (firstSpeak) {
        firstSpeak = false;
        HideCallViewTranscript();
    }

    if (transcriptTimeout !== undefined) {
        clearTimeout(transcriptTimeout);
    }

    if (transcription[transcription.length - 1].final) {
        transcriptTimeout = setTimeout(() => {
            console.log('No new transcript in 10s - closing call.');
            EndCallView();
            EndCall();
            firstSpeak = true;
        }, 10000);
    }
}

function handleRoomDisconnect(reason?: DisconnectReason | undefined){
    if(reason)
        console.log(`disconecction due to ${DisconnectReason[reason.valueOf()]}`)

    EndCall();
    EndCallView();

    if (transcriptTimeout !== undefined) {
        clearTimeout(transcriptTimeout);
        transcriptTimeout = undefined;
    }
    firstSpeak = true;
}

interface Transcript {
    isFinal: boolean,
    medium: string,
    speaker: string,
    text: string
}