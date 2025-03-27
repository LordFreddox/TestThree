import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

// Define TypeScript interfaces for clarity
interface ChatRequest {
    prompt: string;
}

interface ToolCall {
    name: string;
    arguments: { [key: string]: string };
}

// interface VLLMResponse {
//     text: string;
//     tool_call?: ToolCall;
// }

interface ChatResponse {
    response: string;
}

// A dummy function acting as a weather tool.
// Replace this with real API integration if needed.
function getWeather(location: string): string {
    return `The current weather in ${location} is sunny with a temperature of 25°C.`;
}

function ToolSwitcher(fullResponse: string): string {
    const match = /function_call=([^,]+)\((.*)\)/.exec(fullResponse);
    if (match) {
        const functionName = match[1];
        const params = match[2];
        const parsedParams = JSON.parse(params);
        let toolResponse = 'tool response: ';
        switch (functionName) {
            case 'get_posts':
                return toolResponse + get_posts(parsedParams.postCount);
            case 'brave_search':
                return toolResponse + brave_search(parsedParams.query);
            default:
                return 'TOOL ERROR';
        }
    } else {
        return 'TOOL ERROR';
    }
}

function get_posts(postCount: number): Promise<string> {
    console.log(postCount);
    return fetch(`src/testJsons/response.json`)
        .then(json => {
            if (!json.ok) {
                return 'TOOL ERROR';
            }
            return json.json();
        })
        .then(json => {
            if (json && json.data && json.data.posts) {
                return JSON.stringify(json.data.posts);
            } else {
                return 'TOOL ERROR';
            }
        })
        .catch(() => 'TOOL ERROR'); // Handle any network or other errors
}

// Function to process the vLLM response and handle any tool calls.
function preprocessToolOutput(llmResponse: VLLMResponse): VLLMResponse {
    if (llmResponse.tool_call) {
        const { name, arguments: args } = llmResponse.tool_call;
        if (name === 'get_weather') {
            const weatherInfo = getWeather(args.location || 'unknown');
            // Append the tool call result to the response text.
            llmResponse.text += `\n[Weather Info]: ${weatherInfo}`;
        }
    }
    return llmResponse;
}

const app = express();
const port = 8000;

// Middleware to parse JSON bodies.
app.use(bodyParser.json());

// POST /chat endpoint: receives a prompt, forwards it to vLLM, processes tool calls, and returns the result.
app.post('/chat', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body as ChatRequest;

        // Forward the prompt to the locally running vLLM server.
        // Adjust the URL if your vLLM service is hosted elsewhere.
        const vllmUrl = 'http://localhost:1234/v1/chat/completions';
        const vllmResponse = await axios.post<string>(vllmUrl, { prompt });

        // Process the response to handle any tool calls.
        const processedOutput = preprocessToolOutput(vllmResponse.data);

        // Build our response payload.
        const responsePayload: ChatResponse = {
            response: processedOutput.text || 'No response generated.'
        };

        // Send the JSON response back to the client.
        res.json(responsePayload);
    } catch (error) {
        console.error('Error processing /chat request:', error);
        res.status(500).json({ error: 'Error processing the request.' });
    }
});

app.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
});
