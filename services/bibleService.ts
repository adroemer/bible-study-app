
import type { BibleChapter } from '../types';
import { fetchOfflineChapter, isTranslationAvailableOffline } from './offlineBibleService';

const API_BASE_URL = 'https://bible-api.com';

// Cache configuration
const CACHE_EXPIRY_HOURS = 24 * 7; // 1 week
const MEMORY_CACHE_SIZE = 50; // Keep last 50 chapters in memory

// Memory cache for current session
const memoryCache = new Map<string, { data: BibleChapter; timestamp: number }>();

// Helper to generate cache key
const getCacheKey = (book: string, chapter: number, translation: string): string => {
    return `${book.toLowerCase()}-${chapter}-${translation.toLowerCase()}`;
};

// Helper to check if cache entry is expired
const isCacheExpired = (timestamp: number): boolean => {
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert to milliseconds
    return Date.now() - timestamp > expiryTime;
};

// Get from localStorage with expiration check
const getFromLocalStorage = (key: string): BibleChapter | null => {
    try {
        const stored = localStorage.getItem(`bible-cache-${key}`);
        if (!stored) return null;
        
        const { data, timestamp } = JSON.parse(stored);
        if (isCacheExpired(timestamp)) {
            localStorage.removeItem(`bible-cache-${key}`);
            return null;
        }
        
        return data;
    } catch (error) {
        console.warn('Error reading from localStorage cache:', error);
        return null;
    }
};

// Save to localStorage
const saveToLocalStorage = (key: string, data: BibleChapter): void => {
    try {
        const cacheEntry = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(`bible-cache-${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
        console.warn('Error saving to localStorage cache:', error);
    }
};

// Manage memory cache size
const manageMemoryCacheSize = (): void => {
    if (memoryCache.size >= MEMORY_CACHE_SIZE) {
        // Remove oldest entry
        const oldestKey = memoryCache.keys().next().value;
        if (oldestKey) {
            memoryCache.delete(oldestKey);
        }
    }
};

/**
 * Fetches a specific chapter of the Bible in a given translation with caching.
 * @param book The name of the book (e.g., "John")
 * @param chapter The chapter number
 * @param translation The translation to use (e.g., "web", "kjv")
 * @returns A promise that resolves to the BibleChapter data.
 */
export const fetchChapter = async (book: string, chapter: number, translation: string): Promise<BibleChapter> => {
    const cacheKey = getCacheKey(book, chapter, translation);
    
    // Check memory cache first
    const memoryEntry = memoryCache.get(cacheKey);
    if (memoryEntry && !isCacheExpired(memoryEntry.timestamp)) {
        console.log(`Bible chapter loaded from memory cache: ${book} ${chapter}`);
        return memoryEntry.data;
    }
    
    // Check localStorage cache
    const localStorageData = getFromLocalStorage(cacheKey);
    if (localStorageData) {
        console.log(`Bible chapter loaded from localStorage cache: ${book} ${chapter}`);
        // Also add to memory cache for faster future access
        memoryCache.set(cacheKey, { data: localStorageData, timestamp: Date.now() });
        return localStorageData;
    }
    
    // Try offline Bible data first (if available for this translation)
    if (isTranslationAvailableOffline(translation)) {
        try {
            console.log(`Loading Bible chapter from offline data: ${book} ${chapter} (${translation})`);
            const offlineData = await fetchOfflineChapter(book, chapter, translation);
            
            // Cache the offline result
            manageMemoryCacheSize();
            memoryCache.set(cacheKey, { data: offlineData, timestamp: Date.now() });
            saveToLocalStorage(cacheKey, offlineData);
            
            return offlineData;
        } catch (offlineError) {
            console.warn(`Failed to load from offline data, falling back to API:`, offlineError);
        }
    }
    
    // Fetch from API as final fallback
    console.log(`Fetching Bible chapter from API: ${book} ${chapter}`);
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
        
        // Cache the result
        manageMemoryCacheSize();
        memoryCache.set(cacheKey, { data, timestamp: Date.now() });
        saveToLocalStorage(cacheKey, data);
        
        return data;
    } catch (error) {
        console.error("Error in fetchChapter:", error);
        if (error instanceof Error) {
            throw new Error(`Could not load chapter. ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching Bible data.");
    }
};

/**
 * Clears all Bible data from cache (both memory and localStorage)
 */
export const clearBibleCache = (): void => {
    // Clear memory cache
    memoryCache.clear();
    
    // Clear localStorage cache
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('bible-cache-')) {
                localStorage.removeItem(key);
            }
        });
        console.log('Bible cache cleared successfully');
    } catch (error) {
        console.warn('Error clearing localStorage cache:', error);
    }
};

/**
 * Gets cache statistics for debugging
 */
export const getCacheStats = (): { memoryEntries: number; localStorageEntries: number } => {
    let localStorageEntries = 0;
    try {
        const keys = Object.keys(localStorage);
        localStorageEntries = keys.filter(key => key.startsWith('bible-cache-')).length;
    } catch (error) {
        console.warn('Error counting localStorage entries:', error);
    }
    
    return {
        memoryEntries: memoryCache.size,
        localStorageEntries
    };
};
