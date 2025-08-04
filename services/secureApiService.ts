import type { Source, GeminiResponse, ChatMessage, CommentaryPerspective } from '../types';

const API_BASE_URL = '/api';

interface ApiResponse {
    success: boolean;
    response?: string;
    error?: string;
    details?: string;
    usage?: any;
}

const callSecureApi = async (prompt: string, type: string, maxTokens: number = 2000): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                type,
                maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'API request failed');
        }

        return data.response || 'No response generated.';
    } catch (error) {
        console.error('Secure API call failed:', error);
        throw error;
    }
};

export const fetchGroundedResponse = async (userQuery: string): Promise<GeminiResponse> => {
    const fullPrompt = `Considering the perspectives of prominent Christian theologians and voices from the 19th, 20th, and 21st centuries (such as C.S. Lewis, Karl Barth, Dietrich Bonhoeffer, Tim Keller, John Stott, etc.), please provide a comprehensive and well-reasoned response to the following topic. 

When possible, cite specific sources or references to support your points. Topic: "${userQuery}"

Please format your response in a clear, structured manner with theological insights and practical applications.`;

    try {
        const responseText = await callSecureApi(fullPrompt, 'theological_insight', 2778);
        
        // Return mock sources for now - could be enhanced with actual source integration
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
        console.error("Error fetching theological insight:", error);
        if (error instanceof Error) {
            throw new Error(`Theological Insight Error: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while fetching theological insights.");
    }
};

export const summarizeChapter = async (chapterText: string, reference: string): Promise<string> => {
    const prompt = `Please provide a concise summary of the following biblical passage: ${reference}. Do not add any conversational fluff before or after the summary. Just provide the summary.\n\n${chapterText}`;
    
    try {
        return await callSecureApi(prompt, 'chapter_summary', 1000);
    } catch (error) {
        console.error("Error summarizing chapter:", error);
        throw new Error("Failed to summarize chapter.");
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
        return await callSecureApi(fullPrompt, 'commentary', 2000);
    } catch (error) {
        console.error("Error generating chapter commentary:", error);
        throw new Error("Failed to generate commentary.");
    }
};

export const generateSelectionCommentary = async (selection: string, reference: string, perspective: CommentaryPerspective): Promise<string> => {
    const basePrompt = perspectivePrompts[perspective];
    const fullPrompt = `${basePrompt}\n\nHere is the selected text from ${reference}:\n\n"${selection}"`;
    
    try {
        return await callSecureApi(fullPrompt, 'commentary', 1500);
    } catch (error) {
        console.error("Error generating selection commentary:", error);
        throw new Error("Failed to generate commentary.");
    }
};

// Chat functionality for interactive Bible study
export const createScriptureChat = (reference: string, chapterText: string) => {
    return {
        async sendMessage(message: string): Promise<string> {
            const prompt = `The user is currently studying ${reference}. The full text of the chapter is provided here for your context:\n\n${chapterText}\n\nUser question: ${message}`;
            
            try {
                return await callSecureApi(prompt, 'chat', 1500);
            } catch (error) {
                console.error("Error in chat:", error);
                throw new Error("Failed to process chat message.");
            }
        }
    };
};