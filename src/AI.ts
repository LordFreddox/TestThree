import { appendMessage } from "./chat.ts";

let fullConversation: string = '';
let messageAmount: number = 1;
// const URL_MCPCLIENT = 'http://localhost:3000';
const URL_MCPCLIENT = 'https://f4d9-181-59-2-70.ngrok-free.app';
let controller = new AbortController();
let DescriptionsMap: Map<string, string> = new Map();

function InitContextWithSystemPrompt(sysPromt: string) {
    AppendJsonToContext(sysPromt, "system");
}

export function UpdateDescription(placeId: string, description: HTMLElement): AbortController {
    if(DescriptionsMap.has(placeId)){
        description.innerHTML = DescriptionsMap.get(placeId)!;
        return controller;
    }
    const body = {
        placeId: placeId
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
        .then(response => handleStreamResponse(response, description, placeId))
        .catch(handleStreamError);
    return controller; // Return the controller for external abort access
}

function handleStreamResponse(response: Response, description: HTMLElement, placeId: string) {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    processStream(reader, decoder, fullText, description, placeId);
}

function handleStreamError(err: any) {
    if (err.name === 'AbortError') {
        console.log('Fetch aborted');
        controller = new AbortController();
    } else {
        console.error('Fetch error:', err);
    }
}

function processStream(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>,
    decoder: TextDecoder, fullText: string, description: HTMLElement, placeId: string) {
    reader.read().then(({ done, value }) => {
        if (done) {
            console.log('Stream complete');
            controller = new AbortController();
            return;
        }

        const chunk = decoder.decode(value);
        fullText += chunk;
        description.innerHTML = fullText; // Function to update your UI with the text
        DescriptionsMap.set(placeId, fullText);
        processStream(reader, decoder, fullText, description, placeId); // Continue reading
    }).catch(err => {
        if (err.name === 'AbortError') {
            console.log('Stream aborted');
            controller = new AbortController();
        } else {
            console.error('Stream error:', err);
        }
    });
}

async function ChatRequest(message: string, botName: string, role: string, agentId: string) {
    AppendJsonToContext(message, role);
    try {
        const body = {
            messages: JSON.parse(`[${fullConversation.slice(0, -1)}]`)
        };
        const response = await fetch(`${URL_MCPCLIENT}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            appendMessage(agentId, botName, "left", 'Lo siento, ocurrió un error.', -1);
        }

        if (!response.body) {
            appendMessage(agentId, botName, "left", 'Lo siento, ocurrió un error.', -1);
            return 'Lo siento, ocurrió un error';
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break; //exit condition of while loop

            const chunk = decoder.decode(value, { stream: true });
            const messages = chunk.trim().split('\n');
            messages.forEach(message => {
                if (message) {
                    const data = JSON.parse(message);
                    appendMessage(agentId, botName, "left",
                        data.message, messageAmount);
                    AppendJsonToContext(data.message, 'assistant');
                }
            });
        }
        messageAmount++;
        // const botResponseMessage = await response.json();
        // appendMessage(agentId, botName, "left",
        //     botResponseMessage.response.message, botResponseMessage.response.id);
        // AppendJsonToContext(botResponseMessage.response.message, botResponseMessage.response.role);

    } catch (error) {
        console.error('Error fetching bot response:', error);
        appendMessage(agentId, botName, "left", 'Lo siento, ocurrió un error.', -1);
    }
}

function AppendJsonToContext(message: string, role: string) {
    const messageToSent = JSON.stringify({
        role: role,
        content: message
    });
    fullConversation += `${messageToSent},`;
}

function ResetContext() {
    fullConversation = '';
}

export { InitContextWithSystemPrompt, ChatRequest, ResetContext };