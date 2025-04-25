import { UltravoxSession } from 'ultravox-client';
const CallSession = new UltravoxSession();
// const URL_MCPCLIENT = 'http://localhost:3000';
const URL_MCPCLIENT = 'https://f4d9-181-59-2-70.ngrok-free.app';

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