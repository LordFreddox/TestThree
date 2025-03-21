import { appendMessage } from "./chat";

let fullConversation: string = '';
let lastStreamedResponse: string = '';
let lastRole: string = '';

function InitContextWithSystemPrompt(sysPromt: string) {
    AppendJsonToContext(sysPromt, "system");
}

async function ChatRequest(message: string, botName: string, role: string, isStreamText: boolean) {
    AppendJsonToContext(message, role);
    const requestBody = {
        model: "llama-3.2-3b-instruct",
        messages: JSON.parse(`[${fullConversation.slice(0, -1)}]`), // Remove the last comma and parse as array
        temperature: 0.4,
        max_tokens: -1,
        stream: isStreamText
    };

    try {
        const response = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if(!response.body) return;

        for await (const data of splitStream(response.body)) {
            // let data = new TextDecoder().decode(chunk);
            if (data.startsWith("data:")) {
                const json = data.substring("data:".length).trimStart();
                if (json.startsWith("[DONE]")) {
                    return;
                }
                const parseData = JSON.parse(json);
                if (parseData.choices[0].finish_reason === 'stop') {
                    AppendJsonToContext(lastStreamedResponse, lastRole);
                    lastStreamedResponse = '';
                    return;
                }

                const botResponseMessage = parseData.choices[0].delta.content;
                const role = parseData.choices[0].delta.role;
                lastStreamedResponse += botResponseMessage;
                lastRole = role;
                appendMessage(botName, "left", botResponseMessage, parseData.id);

            }
        }

    } catch (error) {
        console.error('Error fetching bot response:', error);
        //TODO: delete last message if error ocurrs
        appendMessage(botName, "left", 'Lo siento, ocurrió un error.', '');
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

function ResetContext(){
    fullConversation = '';
    lastStreamedResponse = '';
    lastRole = '';
}

interface DataStreamResponse {
    "id": string,
    "object": string,
    "created": number,
    "model": string,
    "system_fingerprint": string,
    "choices": [
        {
            "index": number,
            "delta": {
                "role": string,
                "content": string
            },
            "logprobs": null,
            "finish_reason": string
        }
    ]
}

export { InitContextWithSystemPrompt, ChatRequest, ResetContext };