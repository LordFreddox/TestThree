import { appendMessage } from "./chat.ts";
const URL_MCPCLIENT = 'http://localhost:3000';
let fullConversation: string = '';

function InitContextWithSystemPrompt(sysPromt: string) {
    AppendJsonToContext(sysPromt, "system");
}

export async function UpdateDescription(placeId: string): Promise<string> {
    try {
        const body = {
            placeId: placeId
        };
        const response = await fetch(`${URL_MCPCLIENT}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error(`error updating description`);
            return 'No se pudo actualizar los eventos recientes';
        }

        const postResponse = await response.json();
        return postResponse.postResponse.message.content
    } catch (error) {
        console.error(`error updating description ${error}`);
        return 'No se pudo actualizar los eventos recientes';
    }
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
            appendMessage(agentId, botName, "left", 'Lo siento, ocurrió un error.', '');
        }
        const botResponseMessage = await response.json();
        appendMessage(agentId, botName, "left",
            botResponseMessage.response.message, botResponseMessage.response.id);
        AppendJsonToContext(botResponseMessage.response.message, botResponseMessage.response.role);

    } catch (error) {
        console.error('Error fetching bot response:', error);
        appendMessage(agentId, botName, "left", 'Lo siento, ocurrió un error.', '');
    }
}

async function* splitStream(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader();
    let lastFragment = "";
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                // Flush the last fragment now that we're done
                if (lastFragment !== "") {
                    yield lastFragment;
                }
                break;
            }
            const data = new TextDecoder().decode(value);
            lastFragment += data;
            const parts = lastFragment.split("\n\n");
            // Yield all except for the last part
            for (let i = 0; i < parts.length - 1; i += 1) {
                yield parts[i];
            }
            // Save the last part as the new last fragment
            lastFragment = parts[parts.length - 1];
        }
    } finally {
        reader.releaseLock();
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