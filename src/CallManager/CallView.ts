import { GetHTMLElement, IsLocalHost } from '../Utils/Utils.ts';
import { 
    // CreateCall, 
    CreateCallLiveKit, 
    EndCall 
} from './CallController.ts';
import { GetAvatarURL } from '../HTTP/http-service.ts';
import { AvatarResponse } from '../Utils/Types.ts';
// import { handleBlockClick } from '../ZT/ZTView.ts';

const EndCallButton = GetHTMLElement('.EndCallButton');
const AICallCard = GetHTMLElement('#AICallCard');
const StartCallButton = GetHTMLElement('.BotButton3D');
let isOnCall: boolean = false;
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
    if (isOnCall) return;
    // isOnCall = await CreateCall();
    isOnCall = await CreateCallLiveKit();

    // await setTimeout(() => {
    //     isOnCall = true;
    //     const testString = ` ¡Claro! El código de la red WiFi es: https://portalcautivo.zyon.tockall.com/estadio-el-campin-front-html/code.php# ¿Quieres saber algo mas?`;
    //     const urlMatch = testString.match(/https?:\/\/(?:\w+\-?\.)+\w+\/(?:[^/]+\/)*[\w-]+\.php/);
    //     if (urlMatch) {
    //         handleBlockClick(
    //             'Código WiFI',
    //             urlMatch[0].replace(/\s/g, '')
    //         );
    //         console.log(urlMatch[0].replace(/\s/g, ''));
    //         EndCallView();
    //     }
    // }, 1000);

};

EndCallButton.onclick = () => {
    if (isOnCall) {
        EndCall();
        isOnCall = false;
    }
    EndCallView();
    StartCallButton.style.borderStyle = 'none';
};

function StartCallView() {
    AICallCard.classList.remove('hideTop');
    AICallCard.classList.add('showTop');

    StartCallButton.style.display = 'none';
    StartCallButton.style.borderStyle = 'none';
}

export function EndCallView() {
    AICallCard.classList.remove('showTop');
    AICallCard.classList.add('hideTop');

    StartCallButton.style.display = 'block';
    StartCallButton.style.borderStyle = 'solid';
}

// const testString = ` ¡Claro! El código de la red WiFi es: https://portalcautivo.zyon.tockall.com/estadio-el-campin-front-html/code.php# ¿Quieres saber algo mas?`;
// const urlMatch = testString.match(/https?:\/\/(?:\w+\-?\.)+\w+\/(?:[^/]+\/)*[\w-]+\.php/);
// if (urlMatch) {
//     handleBlockClick(
//         'Código WiFI',
//         urlMatch[0].replace(/\s/g, '')
//     );
//     console.log(urlMatch[0].replace(/\s/g, ''));
//     EndCallView();
// }