import { GetHTMLElement, IsLocalHost } from '../Utils/Utils.ts';
import { 
    CreateCallUltravox, 
    // CreateCallLiveKit, 
    EndCall 
} from './CallController.ts';
import { GetAvatarURL } from '../HTTP/http-service.ts';
import { AvatarResponse } from '../Utils/Types.ts';
import { HideZT, SetCloseZTState } from '../ZT/ZTView.ts';

const EndCallButton = GetHTMLElement('.EndCallButton');
const AICallCard = GetHTMLElement('#AICallCard');
const StartCallButton = GetHTMLElement('.avatarImgScript');
export let isOnCall: boolean = false;
export let botName: string = 'Guía Zyon';

export async function loadAvatar(companyId: string) {
    try {
        let avatarResponse: AvatarResponse | undefined;

        if (IsLocalHost()) 
        {
            const response = await fetch(`https://strg01tockall.blob.core.windows.net/container-unity/Maps3D/avatars/${companyId}.json`);
            const data = await response.json() as AvatarResponse;
            avatarResponse = data;
        } else {
            avatarResponse = await GetAvatarURL(companyId);
        }

        if (!avatarResponse) return;

        const avatarElements = Array.from(document.getElementsByClassName('avatarImgScript')) as HTMLImageElement[];
        for (let i = 0; i < avatarElements.length; i++) {
            avatarElements[i].src = avatarResponse.data.avatar.picture_url;
        }
        botName = avatarResponse.data.avatar.name;

    } catch (error) {
        console.error('Error loading avatar:', error);
    }
}

StartCallButton.onclick = async () => {
    StartCallView();
    SetCloseZTState();
    HideZT();
    if (isOnCall) return;
    
    //create livekit call
    // isOnCall = await CreateCallLiveKit();

    if(!isOnCall) //if livekit call fails, then create ultravox call as fallback
    {
        isOnCall = await CreateCallUltravox();
    }

    // isOnCall = true;
    // await new Promise(f => setTimeout(f, 1 * 1000));
    // HideCallViewTranscript();

    if(isOnCall) //if call created, stop avatar vibrate animation
    {
        StartCallButton.classList.remove('vibrate');
    }
};

EndCallButton.onclick = () => {
    if (isOnCall) {
        EndCall();
        isOnCall = false;
    }
    EndCallView();
};

function StartCallView() {
    AICallCard.classList.remove('hideTop');
    AICallCard.classList.add('showTop');

    StartCallButton.style.borderStyle = 'solid';
}

export function EndCallView() {
    HideAvatarButtonForNSeconds(0);
}

export function HideCallViewTranscript(){
    AICallCard.classList.remove('showTop');
    AICallCard.classList.add('hideTop');
    StartCallButton.style.borderStyle = 'solid';
}

async function HideAvatarButtonForNSeconds(n_seconds: number = 1){
    await new Promise(f => setTimeout(f, n_seconds * 1000));
    AICallCard.classList.remove('showTop');
    AICallCard.classList.add('hideTop');
    StartCallButton.classList.add('vibrate');

    StartCallButton.style.borderStyle = 'none';
}

export function UpdateIsOnCallStatus(newStatus: boolean){
    isOnCall = newStatus;
}