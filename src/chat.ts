import { GetHTMLElement } from './Utils';
import { InitContextWithSystemPrompt, ChatRequest, ResetContext } from './AI';
import { sysPromt } from './AI_Tools';

// const BOT_IMG = "https://image.flaticon.com/icons/svg/327/327779.svg";
// const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
const PERSON_NAME = "Marsel";

const msgerForm = GetHTMLElement(".msger-send-btn");
const msgerInput = GetHTMLElement(".msger-input") as HTMLInputElement;
const msgerChat = GetHTMLElement(".msger-chat");
let isStreamText: boolean = false;

const messagesMap = new Map<string, string>(); // Map to store messages for each chat ID
ResetChatBot(sysPromt);

async function sendMessage(message: string) {
  appendMessage(PERSON_NAME, "right", message, '');
  ChatRequest(message, "Guía Zyon", "user", isStreamText);
}

msgerForm.onclick = () => {
  const msgText = msgerInput.value;
  if (!msgText) return;

  sendMessage(msgText);
};

function createMessageElement(name: string, side: string, text: string, id: string): string {
  let msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
        </div>
        <div class="msg-text" id="${id}">${text}</div>
      </div>
    </div>
  `;
  return msgHTML;
}

function appendMessage(name: string, side: string, text: string, id: string) {
  if (messagesMap.has(id) && id !== '') {
    // Update existing chat with the new message
    const currentMessages = messagesMap.get(id);
    const updatedMessages = `${currentMessages}${text}`;
    messagesMap.set(id, updatedMessages);
    msgerChat.querySelector(`#${id}`)!.innerHTML = updatedMessages; // Update the inner HTML of the message element with the new text
  } else {
    // Create a new chat with the new message
    const messageElement = createMessageElement(name, side, text, id);
    messagesMap.set(id, text); // Store the message in the map
    msgerChat.insertAdjacentHTML("beforeend", messageElement);
  }
  msgerChat.scrollTop += 500;
  msgerInput.value = '';
}

function ResetChatBot(sysPromt: string){
  ResetContext();
  InitContextWithSystemPrompt(sysPromt);
  while (msgerChat.firstChild) {
    if(msgerChat.childElementCount === 1) return;
    msgerChat.removeChild(msgerChat.lastChild!);
  }
}

export { appendMessage, ResetChatBot };