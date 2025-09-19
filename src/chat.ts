import { GetHTMLElement } from './Utils/Utils.ts';
import { ChatRequest } from './AI.ts';
import { BOT_NAME } from './Utils/constants.ts';

let waitForBotResponse: boolean;
let lasChatID: number = 0;

// Function to send a message to a specific chatbot
async function sendMessage(message: string) {
  appendMessage("right", message, -1);
  ChatRequest(message, "user");
  waitForBotResponse = true;
}

GetHTMLElement(".msger-input")!.addEventListener("pointerdown", (_event) => {
  GetHTMLElement('.chatInputOverlay').style.display = 'flex';
});

GetHTMLElement(".chatInputOverlay > button")!.addEventListener("pointerdown", (_event) => {
  GetHTMLElement('.chatInputOverlay').style.display = 'none';
});

// Function to create a message element
function createMessageElement(side: string, text: string, id: number): string {
  let msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-bubble">
        <span class="msg-text" id="chat${id}">${text}</span>
      </div>
    </div>
  `;
  return msgHTML;
}

export function appendMessage(side: string, text: string, id: number) {
  const msgerChat = GetHTMLElement(".msger-chat")!;
  if (id !== -1) {
    if (lasChatID !== id) { //create new chatID
      const messageElement = createMessageElement(side, text, id);
      msgerChat.insertAdjacentHTML("beforeend", messageElement);
      lasChatID = id;
    } else {
      // Update existing chat with the new message
      const currentMessages = msgerChat.querySelector(`#chat${id}`)!;
      currentMessages.innerHTML += text;
    }
  } else {
    // Create a new chat with the new message
    const messageElement = createMessageElement(side, text, id);
    msgerChat.insertAdjacentHTML("beforeend", messageElement);
  }

  msgerChat.scrollTop += 500;
  waitForBotResponse = false;
}

document.querySelectorAll('.msger-send-btn').forEach((button) => {
  button.addEventListener('click', () => {
    if (waitForBotResponse) return;
    GetHTMLElement('.chatInputOverlay').style.display = 'none';
    const msgText = (button.previousElementSibling as HTMLInputElement);
    if (msgText.value === '') return;

    sendMessage(msgText.value);
    msgText.value = '';
    const event = new Event('input', { bubbles: true });
    msgText.dispatchEvent(event);
  });
});

export function InitChat() {
  GetHTMLElement('#chatBotName').innerText = BOT_NAME;
  waitForBotResponse = false;
  appendMessage("left", `¡Hola! ¿Cómo puedo ayudarte hoy? 😊`, -1);
}

export function DisplayChatAI() {
    GetHTMLElement('.msger').style.display = 'flex';
    GetHTMLElement('#tutorial').style.display = 'none';
}