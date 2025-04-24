import { UltravoxSession } from 'ultravox-client';
const CallSession = new UltravoxSession();
const URL_MCPCLIENT = 'http://localhost:3000';

export async function CreateCall() {
    try{
        const response = await fetch(`${URL_MCPCLIENT}/ultravox`,{
            method: 'GET',
            headers:{
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`error creating call`);
        }
        const callResponse = await response.json();
        CallSession.joinCall(callResponse.joinUrl);
    }catch(error){
        console.error(`error creating call ${error}`);
    }
}

export function EndCall() {
    CallSession.leaveCall();
}