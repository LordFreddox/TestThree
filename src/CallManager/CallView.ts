import { GetHTMLElement } from '../Utils.ts';
import { CreateCall, EndCall } from './CallController.ts';

const EndCallButton = GetHTMLElement('.EndCallButton');
const AICallCard = GetHTMLElement('#AICallCard');
const StartCallButton = GetHTMLElement('.BotButton3D');
const footerButton = GetHTMLElement('#footer-button');
let isOnCall: boolean = false;

export async function loadAvatar() {
    try {
        const response = await fetch('public/avatars/139.json');
        const data = await response.json();
        const avatarUrl = data.data.avatar.picture_url;
        
        const avatarElements = Array.from(document.getElementsByClassName('avatarImgScript')) as HTMLImageElement[];
        for (let i = 0; i < avatarElements.length; i++) {
            avatarElements[i].src = avatarUrl;
        }

    } catch (error) {
        console.error('Error loading avatar:', error);
    }
}

StartCallButton.onclick = () => {
    StartCallView();
};

EndCallButton.onclick = () => {
    EndCallView();
};

function StartCallView(){
    CreateCall();
    isOnCall = true;
    AICallCard.style.visibility = 'visible';
    StartCallButton.style.display = 'none';
    footerButton.style.display = 'none';
}

export function EndCallView(){
    if(isOnCall){
        EndCall();
        AICallCard.style.visibility = 'hidden';
        StartCallButton.style.display = 'block';
        footerButton.style.display = 'block';
        isOnCall = false;
    }
}