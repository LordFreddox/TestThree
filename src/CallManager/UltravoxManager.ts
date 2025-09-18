import { BOT_NAME, COMPANY_ID, COMPANY_NAME, PROJECT_ENVIROMENT, START_POINT, URL_MCPCLIENT } from "../Utils/constants.ts";
import { EndCallView, HideCallViewTranscript, UpdateIsOnCallStatus, botGenre } from './CallView.ts';
import { handleBlockClick, serviceList } from '../ZT/ZTView.ts';

import { UltravoxSession, UltravoxSessionStatus } from 'ultravox-client';
import { RestartScene, SearchPlacesByDistanceCategoryArea } from "../main.ts";
import { scene } from "../Renderer.ts";
import { SetupDescriptionCardForPlaceByID } from "../view.ts";
const CallSession = new UltravoxSession();
let firstSpeak = true;
let transcriptTimeout: number | ReturnType<typeof setTimeout> | undefined;

SetupListeners();

async function CreateCallUltravox(): Promise<boolean> {
    try {
        const body = {
            companyId: COMPANY_ID,
            companyName: COMPANY_NAME,
            botName: BOT_NAME,
            botGenre: botGenre,
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

function SetupListeners() {
    CallSession.addEventListener('status', () => {
        console.log(`Session status changed: ${CallSession.status}`);
        switch (CallSession.status) {
            case UltravoxSessionStatus.SPEAKING:
                if (firstSpeak) {
                    firstSpeak = false;
                    HideCallViewTranscript();
                }

                if (transcriptTimeout !== undefined) {
                    clearTimeout(transcriptTimeout);
                }
                break;
            case UltravoxSessionStatus.LISTENING:
                transcriptTimeout = setTimeout(() => {
                    console.log('No new transcript in 15s - closing call.');
                    EndCallView();
                    EndCall();
                    RestartScene();
                    firstSpeak = true;
                }, 15000);
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

CallSession.registerToolImplementations({
    "FocusOnPlace": EnfocarCamaraEnLugarPorID,
    "OpenServices": OpenServices,
    "GetPlacesRecomendationByCategory": ObtenerLugaresRecomendadosPorCategoria
});

function EnfocarCamaraEnLugarPorID(params: any) {
    console.log(`sending place ID for focus ${params.placeId as string}`);
    const FocusResponse = SetupDescriptionCardForPlaceByID(params.placeId as string);
    //EndCallView();
    if (FocusResponse.success)
        return `Lugar enfocado exitosamente en ${JSON.stringify(FocusResponse)}`;
    else
        return "No se pudo encontrar el lugar en el mapa.";
}

function OpenServices(params: any) {
    if (!serviceList) return `Hubo un error al mostrar el QR.`;
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
}

function ObtenerLugaresRecomendadosPorCategoria(params: any) {
    if (!START_POINT) return `No se puede recomendar lugares en este momento.`;

    const startObject = scene.getObjectByName(START_POINT);
    const categoryToSearch = params.category as string;
    console.log(`entering GetPlacesRecomendationByCategory with category: ${categoryToSearch}`);
    if (!startObject) return `Lugar inicial no encontrado en escena`;
    if (!categoryToSearch) return `Categoría no enviada`;

    return SearchPlacesByDistanceCategoryArea(startObject, categoryToSearch);
}

function EndCall() {
    UpdateIsOnCallStatus(false);
    CallSession?.leaveCall();
    firstSpeak = true;
}

interface Transcript {
    isFinal: boolean,
    medium: string,
    speaker: string,
    text: string
}

export { EndCall, CreateCallUltravox };