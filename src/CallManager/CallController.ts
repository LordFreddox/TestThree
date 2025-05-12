import { UltravoxSession } from 'ultravox-client';
import { URL_MCPCLIENT } from "../constants/constants.ts";

const CallSession = new UltravoxSession();

SetupListeners();

export async function CreateCall() {
    try {
        const response = await fetch(`${URL_MCPCLIENT}/ultravox`, {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`error creating call`);
        }
        const callResponse = await response.json();
        console.log("joining call");
        CallSession.joinCall(callResponse.joinUrl);
    } catch (error) {
        console.error(`error creating call ${error}`);
    }
}

function SetupListeners() {
    CallSession.addEventListener('status', () => {
        console.log(`Session status changed: ${CallSession.status}`);
    });

    CallSession.addEventListener('transcripts', () => {
        console.log('callTranscript: ', CallSession.transcripts);
    });
}

export function EndCall() {
    CallSession.leaveCall();
}