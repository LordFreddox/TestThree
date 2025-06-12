import { GetHTMLElement } from './Utils/Utils.ts';
import { ChatRequest } from './AI.ts';

const PERSON_NAME = "Marsel";
let currentAgentID: string;
let waitForBotResponse: boolean;
let lasChatID: number = 0;

// Function to get the chatbot element based on agent ID
// function getChatbotElement(agentId: string): HTMLElement {
//   return GetHTMLElement(`.msger[data-agent="${agentId}"]`);
// }

export function setCurrentAgent(agentId: string) {
  currentAgentID = agentId;
}

// Function to send a message to a specific chatbot
async function sendMessage(agentId: string, message: string) {
  appendMessage(agentId, PERSON_NAME, "right", message, -1);
  ChatRequest(message, "Guía Zyon", "user", agentId);
  waitForBotResponse = true;
}

// Function to create a message element
function createMessageElement(name: string, side: string, text: string, id: number): string {
  let msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
        </div>
        <div class="msg-text" id="chat${id}">${text}</div>
      </div>
    </div>
  `;
  return msgHTML;
}

// Function to append a message to the correct chatbot
export function appendMessage(agentId: string, name: string, side: string, text: string, id: number) {
  // const msgerChat = getChatbotElement(agentId).querySelector(".msger-chat")!;
  const msgerChat = GetHTMLElement(".msger-chat")!;
  console.log(agentId);
  if (id !== -1) {
    if (lasChatID !== id) { //create new chatID
      const messageElement = createMessageElement(name, side, text, id);
      msgerChat.insertAdjacentHTML("beforeend", messageElement);
      lasChatID = id;
    } else {
      // Update existing chat with the new message
      const currentMessages = msgerChat.querySelector(`#chat${id}`)!;
      currentMessages.innerHTML += text;
    }
  } else {
    // Create a new chat with the new message
    const messageElement = createMessageElement(name, side, text, id);
    msgerChat.insertAdjacentHTML("beforeend", messageElement);
  }

  msgerChat.scrollTop += 500;
  waitForBotResponse = false;
}

// Function to reset a specific chatbot
// export function ResetChatBot(agentId: string) {
//   const msgerChat = getChatbotElement(agentId).querySelector(".msger-chat")!;
//   while (msgerChat.firstChild) {
//     if(msgerChat.childElementCount === 1) return;
//     msgerChat.removeChild(msgerChat.lastChild!);
//   }
// }

document.querySelectorAll('.msger-send-btn').forEach((button) => {
  button.addEventListener('click', () => {
    if (waitForBotResponse) return;

    // const agentId = (button.closest('.msger') as HTMLElement).dataset.agent!;
    const msgText = (button.previousElementSibling as HTMLInputElement);
    if (msgText.value === '') return;

    sendMessage(currentAgentID, msgText.value);
    msgText.value = '';
    const event = new Event('input', { bubbles: true });
    msgText.dispatchEvent(event);
  });
});