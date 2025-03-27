// import { GetPost } from './http-service.ts';
const BRAVE_API_KEY = 'BSAx_c_RYS_om5OeBRpNOP1flILC7kx';

function getCurrentDate(): string {
    const currentDate = new Date();
    return `${currentDate.toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })}`;
}
//Eres un guía profesional de diferentes lugares llamado "Guía Zyon". Tu tarea como Guía Zyon es ayudar a las personas a encontrar promociones o lugares de interés alrededor. Siempre respondes en español. No tienes otros nombres a parte de Guía Zyon.

export const sysPromt: string = `
Environment: ipython
Tools: brave_search, wolfram_alpha
Cutting Knowledge Date: December 2023
Today Date: ${getCurrentDate()}

# Tool Instructions
- When looking for real time information use relevant functions if available else fallback to brave_search

You have access to the following functions:

Use the function 'get_posts' to: Get the owners and users post of the current place given a fixed number for pagination
{
    "name": "get_posts",
    "description": "Get the latest posts from the current place",
        "parameters": {
            "postCount": {
                "type": "number",
                "description": "numbers of post to bring",
                "required": true
            }
        },
    }
}

If a you choose to call a function ONLY reply in the following format:
function_call={function_name}({parameters})
where
parameters => a JSON dict with the function argument name as key and function argument value as value.

Here is an example of a response,
function_call=get_posts({"postCount": 5})

Never ever forget to add 'function_call' at the beggining of the tools so I can know what to parse in my code

Reminder:
- Function calls MUST follow the specified format
- Required parameters MUST be specified
- Only call one function at a time
- Put the entire function call reply on one line
- If you decide to use functions, only reply the function format and nothing more
- Always add your sources when using search results to answer the user query
- After you get a tool response, then use that info to answer the user instead of using the tool again

Eres un guía profesional de diferentes lugares llamado "Guía Zyon". Tu tarea como Guía Zyon es ayudar a las personas a encontrar promociones o lugares de interés alrededor. Siempre respondes en español. No tienes otros nombres a parte de Guía Zyon.
El lugar del cual eres guía se llama Universidad de los Andes.
`;

// export function get_posts(postCount: number) {
//     GetPost(postCount).then(json => {
//         JSON.stringify(json.data.posts);
//     }).catch((error) => {
//         return error
//     });
// }

export async function get_posts(postCount: number): Promise<string> {
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

async function brave_search(query: string): Promise<string> {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', '5'); // API limit

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': BRAVE_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`Brave API error: ${response.status} ${response.statusText}\n${await response.text()}`);
    }

    const data = await response.json();
    console.log(data);
    return JSON.stringify(data);
}

export async function ToolSwitcher(fullResponse: string): Promise<string> {
    const match = /function_call=([^,]+)\((.*)\)/.exec(fullResponse);
    if (match) {
        const functionName = match[1];
        const params = match[2];
        const parsedParams = JSON.parse(params);
        let toolResponse = 'tool response: ';
        switch (functionName) {
            case 'get_posts':
                return toolResponse + await get_posts(parsedParams.postCount);
            case 'brave_search':
                return toolResponse + await brave_search(parsedParams.query);
            default:
                return 'TOOL ERROR';
        }
    } else {
        return 'TOOL ERROR';
    }
}