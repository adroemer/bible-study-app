
import type { BibleChapter } from '../types';

const API_BASE_URL = 'https://bible-api.com';

/**
 * Fetches a specific chapter of the Bible in a given translation.
 * @param book The name of the book (e.g., "John")
 * @param chapter The chapter number
 * @param translation The translation to use (e.g., "web", "kjv")
 * @returns A promise that resolves to the BibleChapter data.
 */
export const fetchChapter = async (book: string, chapter: number, translation: string): Promise<BibleChapter> => {
    const url = `${API_BASE_URL}/${encodeURIComponent(book)}+${chapter}?translation=${encodeURIComponent(translation)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Try to parse the error message from the API if possible
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
            throw new Error(`Failed to fetch chapter: ${errorMessage}`);
        }
        const data: BibleChapter = await response.json();
        return data;
    } catch (error) {
        console.error("Error in fetchChapter:", error);
        if (error instanceof Error) {
            throw new Error(`Could not load chapter. ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching Bible data.");
    }
};
