import { GetHTMLElement, IsLocalHost } from '../Utils.ts';
import { CreateCall, EndCall } from './CallController.ts';
import { GetAvatarURL } from '../HTTP/http-service.ts';
// import { handleBlockClick } from '../ZT/ZTView.ts';

const EndCallButton = GetHTMLElement('.EndCallButton');
const AICallCard = GetHTMLElement('#AICallCard');
const StartCallButton = GetHTMLElement('.BotButton3D');
let isOnCall: boolean = false;

export async function loadAvatar(companyId: string) {
    try {
        let avatarUrl: string | undefined;

        if (IsLocalHost()) 
        {
            const response = await fetch(`https://strg01tockall.blob.core.windows.net/container-unity/Maps3D/avatars/${companyId}.json`);
            const data = await response.json();
            avatarUrl = data.data.avatar.picture_url;
        } else {
            avatarUrl = await GetAvatarURL(companyId);
        }

        if (!avatarUrl) return;

        const avatarElements = Array.from(document.getElementsByClassName('avatarImgScript')) as HTMLImageElement[];
        for (let i = 0; i < avatarElements.length; i++) {
            avatarElements[i].src = avatarUrl;
        }

    } catch (error) {
        console.error('Error loading avatar:', error);
    }
}

StartCallButton.onclick = async () => {
    StartCallView();
    if (isOnCall) return;
    isOnCall = await CreateCall();

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