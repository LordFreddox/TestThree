import { appendMessage } from "./chat.ts";
import { PROJECT_ENVIROMENT, URL_MCPCLIENT, COMPANY_NAME, COMPANY_ID } from "./Utils/constants.ts";

let fullConversation: {role: string, content: string}[] = [];
ResetContext();

let messageAmount: number = 1;
let controller = new AbortController();
let DescriptionsMap: Map<number, string> = new Map();

function InitContextWithSystemPrompt(sysPromt: string) {
    AppendJsonToContext(sysPromt, "system");
}

export function UpdateDescription(placeId: number, companysubsidiaryId: number, description: HTMLElement): AbortController {
    if (DescriptionsMap.has(companysubsidiaryId)) {
        description.innerHTML = DescriptionsMap.get(companysubsidiaryId)!;
        return controller;
    }
    const body = {
        placeId: placeId,
        companysubsidiaryId: companysubsidiaryId,
        projectEnviroment: PROJECT_ENVIROMENT
    };
    description.innerHTML = 'Cargando informacion...';
    // controller = new AbortController();
    fetch(`${URL_MCPCLIENT}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
    })
        .then(response => handleStreamResponse(response, description, companysubsidiaryId))
        .catch(() => {
            console.log('Fetch aborted or error');
            controller = new AbortController();
            description.innerHTML = 'No se pudo actualizar en estos momentos, intente mas tarde.';
        });
    return controller; // Return the controller for external abort access
}

function handleStreamResponse(response: Response, description: HTMLElement, companysubsidiaryId: number) {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    processStream(reader, decoder, fullText, description, companysubsidiaryId);
}

function processStream(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>,
    decoder: TextDecoder, fullText: string, description: HTMLElement, companysubsidiaryId: number) {
    reader.read().then(({ done, value }) => {
        if (done) {
            console.log('Stream complete');
            controller = new AbortController();
            return;
        }

        const chunk = decoder.decode(value);
        fullText += chunk;
        description.innerHTML = fullText; // Function to update your UI with the text
        DescriptionsMap.set(companysubsidiaryId, fullText);
        processStream(reader, decoder, fullText, description, companysubsidiaryId); // Continue reading
    }).catch(err => {
        if (err.name === 'AbortError') {
            console.log('Stream aborted');
            controller = new AbortController();
        } else {
            console.error('Stream error:', err);
        }
    });
}

async function ChatRequest(message: string, role: string) {
    AppendJsonToContext(message, role);
    try {
        const body = {
            messages: fullConversation,
            companyName: COMPANY_NAME,
            placeId: COMPANY_ID,
            projectEnviroment: PROJECT_ENVIROMENT
        };
        const response = await fetch(`${URL_MCPCLIENT}/chat/groq`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            appendMessage("left", 'Chat no disponible en estos momentos.', -1);
        }

        if (!response.body) {
            appendMessage("left", 'Chat no disponible en estos momentos.', -1);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const messages = chunk.trim().split('\n');
            messages.forEach(message => {
                if (message) {
                    const data = JSON.parse(message);
                    if (data.fullConversation){
                        fullConversation = data.fullConversation;
                    }
                    if (data.message) {
                        appendMessage("left",
                            data.message, messageAmount);
                    }
                }
            });
        }
        messageAmount++;
        // AppendJsonToContext(fullMessage, 'assistant');
        // const botResponseMessage = await response.json();
        // appendMessage(agentId, botName, "left",
        //     botResponseMessage.response.message, botResponseMessage.response.id);
        // AppendJsonToContext(botResponseMessage.response.message, botResponseMessage.response.role);

    } catch (error) {
        console.error('Error fetching bot response:', error);
        appendMessage("left", 'Chat no disponible en estos momentos.', -1);
    }
}

function AppendJsonToContext(message: string, role: string) {
    const messageToSent: MessageLLM = { role: role, content: message };
    fullConversation.push(messageToSent);
}

function ResetContext() {
    fullConversation = [];
    fullConversation.push({role:'assistant', content:'¡Hola! ¿Cómo puedo ayudarte hoy?'});
}

interface MessageLLM {
    role: string,
    content: string
}

export { InitContextWithSystemPrompt, ChatRequest, ResetContext };