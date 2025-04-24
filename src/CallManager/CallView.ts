import { GetHTMLElement } from '../Utils.ts';
import { CreateCall, EndCall } from './CallController.ts';

const EndCallButton = GetHTMLElement('.EndCallButton');
const AICallCard = GetHTMLElement('#AICallCard');
const StartCallButton = GetHTMLElement('.BotButton3D');
const footerButton = GetHTMLElement('#footer-button');
let isOnCall: boolean = false;

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