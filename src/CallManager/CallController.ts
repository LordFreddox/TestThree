import { UltravoxSession, UltravoxSessionStatus } from 'ultravox-client';
import { URL_MCPCLIENT } from "../constants/constants.ts";
import { handleBlockClick, serviceList } from '../ZT/ZTView.ts';
import { SetupDescriptionCardForPlaceByID } from '../view.ts';
import { EndCallView } from './CallView.ts';
// import { GetHTMLElement } from '../Utils.ts';

const CallSession = new UltravoxSession();
let firstSpeak = true;
// let timeOutCancelation: string | number | NodeJS.Timeout | undefined;
SetupListeners();

export async function CreateCall(): Promise<boolean> {
    try {
        const body = {
            companyId: localStorage.getItem("companyId")!,
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
                if(firstSpeak){
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

// async function TimeOutUser(timeToOut: number = 10000) {
//     timeOutCancelation = setTimeout(() => {
//         EndCallView();
//         EndCall();
//         GetHTMLElement('.BotButton3D').style.borderStyle = 'none';
//     }, timeToOut);
// }

const FocusOnPlace = (params: any) => {
    SetupDescriptionCardForPlaceByID(params.placeId as string);
    EndCallView();
    return `successfully focused the place `;
};

const OpenServices = (params: any) => {
    if(!serviceList) return `Hubo un error al mostrar la url.`;

    console.log(`executing tool OpenServices`, params.serviceId);
    const service =
        serviceList.find(service => service.id === Number.parseInt(params.serviceId));
    if(!service) return `Hubo un error al mostrar la url.`;
    handleBlockClick(
        service?.description,
        service?.url,
        service?.id
    );
    EndCallView();
    return `Mostrando url, por favor, escanee el QR en pantalla.`;
};

// CallSession.registerToolImplementation(
//     "FocusOnPlace",
//     FocusOnPlace
// );

CallSession.registerToolImplementations({
    "FocusOnPlace": FocusOnPlace,
    "OpenServices": OpenServices
})

export function EndCall() {
    CallSession.leaveCall();
}

interface Transcript {
    isFinal: boolean,
    medium: string,
    speaker: string,
    text: string
}