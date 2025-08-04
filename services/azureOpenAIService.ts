import OpenAI from 'openai';
import type { Source, GeminiResponse, ChatMessage, CommentaryPerspective } from '../types';

// Get environment variables with fallbacks
const getEnvVar = (name: string, fallback: string = '') => {
    if (typeof process !== 'undefined' && process.env) {
        return process.env[name] || fallback;
    }
    return fallback;
};

const endpoint = getEnvVar('AZURE_OPENAI_ENDPOINT', 'https://biblestudyopenai.openai.azure.com/');
const deployment = getEnvVar('DEPLOYMENT_NAME', 'gpt-4o-mini');
const apiKey = getEnvVar('AZURE_OPENAI_API_KEY');

// Initialize OpenAI client lazily
let openaiInstance: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
    if (!apiKey) {
        throw new Error("Azure OpenAI API key is not configured. Please check your environment variables.");
    }
    
    if (!openaiInstance) {
        openaiInstance = new OpenAI({
            apiKey: apiKey,
            baseURL: `${endpoint}openai/deployments/${deployment}`,
            defaultQuery: { 'api-version': '2025-01-01-preview' },
            defaultHeaders: {
                'api-key': apiKey,
            },
        });
    }
    
    return openaiInstance;
};

export const fetchGroundedResponse = async (userQuery: string): Promise<GeminiResponse> => {
    const fullPrompt = `Considering the perspectives of prominent Christian theologians and voices from the 19th, 20th, and 21st centuries (such as C.S. Lewis, Karl Barth, Dietrich Bonhoeffer, Tim Keller, John Stott, etc.), please provide a comprehensive and well-reasoned response to the following topic. 

When possible, cite specific sources or references to support your points. Topic: "${userQuery}"

Please format your response in a clear, structured manner with theological insights and practical applications.`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: deployment,
            messages: [
                {
                    role: 'system',
                    content: 'You are a knowledgeable Christian theologian and Bible scholar. Provide thoughtful, well-researched responses about biblical and theological topics, drawing from various Christian traditions and scholarly sources.'
                },
                {
                    role: 'user',
                    content: fullPrompt
                }
            ],
            max_tokens: 2778,
            temperature: 0.7,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
            stream: false
        });

        const responseText = completion.choices[0]?.message?.content || "No response generated.";
        
        // For now, we'll return empty sources since Azure OpenAI doesn't provide grounding like Gemini
        // In a production app, you could integrate with Azure Cognitive Search for grounded responses
        const sources: Source[] = [
            {
                uri: "https://www.esv.org/",
                title: "ESV Bible Online"
            },
            {
                uri: "https://www.biblegateway.com/",
                title: "Bible Gateway"
            }
        ];

        return {
            text: responseText,
            sources: sources,
        };
    } catch (error) {
        console.error("Error fetching from Azure OpenAI:", error);
        if (error instanceof Error) {
            throw new Error(`Azure OpenAI API Error: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while fetching data from Azure OpenAI.");
    }
};

export const summarizeChapter = async (chapterText: string, reference: string): Promise<string> => {
    const prompt = `Please provide a concise summary of the following biblical passage: ${reference}. Do not add any conversational fluff before or after the summary. Just provide the summary.\n\n${chapterText}`;
    
    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: deployment,
            messages: [
                {
                    role: 'system',
                    content: 'You are a Bible scholar. Provide clear, concise summaries of biblical passages.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.3,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
            stream: false
        });

        return completion.choices[0]?.message?.content || "Unable to generate summary.";
    } catch (error) {
        console.error("Error summarizing chapter:", error);
        throw new Error("Failed to summarize chapter with Azure OpenAI.");
    }
};

const perspectivePrompts: Record<CommentaryPerspective, string> = {
    catholic: "Drawing from Catholic tradition, saints, and Church Fathers, provide a theological commentary on the passage. Focus on sacramental, covenantal, and Christological themes.",
    enduring_word: "In the style of a clear, verse-by-verse evangelical commentary like David Guzik's Enduring Word, explain the meaning and application of the passage.",
    historical: "Provide a theological commentary on the passage from the perspective of a key historical theologian (like Augustine, Aquinas, Luther, Calvin, or Wesley). Name the theologian and explain their likely interpretation based on their known theological commitments."
};

export const generateChapterCommentary = async (chapterText: string, reference: string, perspective: CommentaryPerspective): Promise<string> => {
    const basePrompt = perspectivePrompts[perspective];
    const fullPrompt = `${basePrompt}\n\nHere is the full chapter of ${reference} for context:\n\n${chapterText}`;
    
    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: deployment,
            messages: [
                {
                    role: 'system',
                    content: 'You are a skilled biblical commentator with deep knowledge of various Christian theological traditions.'
                },
                {
                    role: 'user',
                    content: fullPrompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.6,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
            stream: false
        });

        return completion.choices[0]?.message?.content || "Unable to generate commentary.";
    } catch (error) {
        console.error("Error generating chapter commentary:", error);
        throw new Error("Failed to generate commentary with Azure OpenAI.");
    }
};

export const generateSelectionCommentary = async (selection: string, reference: string, perspective: CommentaryPerspective): Promise<string> => {
    const basePrompt = perspectivePrompts[perspective];
    const fullPrompt = `${basePrompt}\n\nHere is the selected text from ${reference}:\n\n"${selection}"`;
    
    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: deployment,
            messages: [
                {
                    role: 'system',
                    content: 'You are a skilled biblical commentator with deep knowledge of various Christian theological traditions.'
                },
                {
                    role: 'user',
                    content: fullPrompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.6,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
            stream: false
        });

        return completion.choices[0]?.message?.content || "Unable to generate commentary.";
    } catch (error) {
        console.error("Error generating selection commentary:", error);
        throw new Error("Failed to generate commentary with Azure OpenAI.");
    }
};

// Chat functionality for interactive Bible study
export const createScriptureChat = (reference: string, chapterText: string) => {
    return {
        async sendMessage(message: string): Promise<string> {
            try {
                const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
                    model: deployment,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a helpful and knowledgeable Bible assistant. The user is currently studying ${reference}. Be helpful and informative. The full text of the chapter is provided here for your context:\n\n${chapterText}`
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.7,
                    top_p: 0.95,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                    stop: null,
                    stream: false
                });

                return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
            } catch (error) {
                console.error("Error in chat:", error);
                throw new Error("Failed to process chat message with Azure OpenAI.");
            }
        }
    };
};