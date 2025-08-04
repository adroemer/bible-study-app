import type { BibleChapter } from '../types';

// Define the structure of our offline Bible data
interface OfflineBibleBook {
    abbrev: string;
    chapters: string[][];
}

// Bible book name mappings
const BOOK_MAPPINGS: Record<string, string[]> = {
    'genesis': ['gn', 'gen', 'genesis'],
    'exodus': ['ex', 'exo', 'exodus'],
    'leviticus': ['lv', 'lev', 'leviticus'],
    'numbers': ['nu', 'num', 'numbers'],
    'deuteronomy': ['dt', 'deu', 'deuteronomy'],
    'joshua': ['jos', 'josh', 'joshua'],
    'judges': ['jdg', 'judg', 'judges'],
    'ruth': ['ru', 'ruth'],
    '1samuel': ['1sa', '1sam', '1samuel'],
    '2samuel': ['2sa', '2sam', '2samuel'],
    '1kings': ['1ki', '1kgs', '1kings'],
    '2kings': ['2ki', '2kgs', '2kings'],
    '1chronicles': ['1ch', '1chr', '1chronicles'],
    '2chronicles': ['2ch', '2chr', '2chronicles'],
    'ezra': ['ezr', 'ezra'],
    'nehemiah': ['ne', 'neh', 'nehemiah'],
    'esther': ['es', 'est', 'esther'],
    'job': ['job'],
    'psalms': ['ps', 'psa', 'psalms'],
    'proverbs': ['pr', 'pro', 'proverbs'],
    'ecclesiastes': ['ec', 'ecc', 'ecclesiastes'],
    'songofsolomon': ['ss', 'song', 'songofsolomon'],
    'isaiah': ['is', 'isa', 'isaiah'],
    'jeremiah': ['je', 'jer', 'jeremiah'],
    'lamentations': ['la', 'lam', 'lamentations'],
    'ezekiel': ['eze', 'ezek', 'ezekiel'],
    'daniel': ['da', 'dan', 'daniel'],
    'hosea': ['ho', 'hos', 'hosea'],
    'joel': ['joe', 'joel'],
    'amos': ['am', 'amos'],
    'obadiah': ['ob', 'oba', 'obadiah'],
    'jonah': ['jon', 'jonah'],
    'micah': ['mic', 'micah'],
    'nahum': ['na', 'nah', 'nahum'],
    'habakkuk': ['hab', 'habakkuk'],
    'zephaniah': ['zep', 'zephaniah'],
    'haggai': ['hag', 'haggai'],
    'zechariah': ['zec', 'zech', 'zechariah'],
    'malachi': ['mal', 'malachi'],
    'matthew': ['mt', 'mat', 'matthew'],
    'mark': ['mr', 'mrk', 'mark'],
    'luke': ['lu', 'luk', 'luke'],
    'john': ['jn', 'joh', 'john'],
    'acts': ['ac', 'act', 'acts'],
    'romans': ['ro', 'rom', 'romans'],
    '1corinthians': ['1co', '1cor', '1corinthians'],
    '2corinthians': ['2co', '2cor', '2corinthians'],
    'galatians': ['ga', 'gal', 'galatians'],
    'ephesians': ['ep', 'eph', 'ephesians'],
    'philippians': ['ph', 'php', 'philippians'],
    'colossians': ['col', 'colossians'],
    '1thessalonians': ['1th', '1thes', '1thessalonians'],
    '2thessalonians': ['2th', '2thes', '2thessalonians'],
    '1timothy': ['1ti', '1tim', '1timothy'],
    '2timothy': ['2ti', '2tim', '2timothy'],
    'titus': ['tit', 'titus'],
    'philemon': ['phm', 'phlm', 'philemon'],
    'hebrews': ['he', 'heb', 'hebrews'],
    'james': ['jas', 'james'],
    '1peter': ['1pe', '1pet', '1peter'],
    '2peter': ['2pe', '2pet', '2peter'],
    '1john': ['1jn', '1john'],
    '2john': ['2jn', '2john'],
    '3john': ['3jn', '3john'],
    'jude': ['jud', 'jude'],
    'revelation': ['re', 'rev', 'revelation']
};

// Reverse mapping for quick lookups
const ABBREV_TO_BOOK: Record<string, string> = {};
Object.entries(BOOK_MAPPINGS).forEach(([book, abbrevs]) => {
    abbrevs.forEach(abbrev => {
        ABBREV_TO_BOOK[abbrev.toLowerCase()] = book;
    });
});

// Cache for loaded Bible data
const bibleDataCache: Record<string, OfflineBibleBook[]> = {};

/**
 * Load Bible data from JSON file
 */
const loadBibleData = async (translation: string): Promise<OfflineBibleBook[]> => {
    if (bibleDataCache[translation]) {
        return bibleDataCache[translation];
    }

    try {
        // Map translation to filename
        const filename = translation === 'kjv' ? 'kjv.json' : 'web.json';
        const response = await fetch(`/data/bible/${filename}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load ${translation} Bible data`);
        }
        
        const data: OfflineBibleBook[] = await response.json();
        bibleDataCache[translation] = data;
        console.log(`Loaded offline Bible data: ${translation.toUpperCase()}`);
        return data;
    } catch (error) {
        console.error(`Error loading offline Bible data for ${translation}:`, error);
        throw error;
    }
};

/**
 * Find book in Bible data by name or abbreviation
 */
const findBookByName = (bibleData: OfflineBibleBook[], bookName: string): OfflineBibleBook | null => {
    const normalizedName = bookName.toLowerCase().replace(/\s+/g, '');
    
    // First try direct abbreviation match
    const book = bibleData.find(b => b.abbrev === normalizedName);
    if (book) return book;
    
    // Try mapping lookup
    const mappedBook = ABBREV_TO_BOOK[normalizedName];
    if (mappedBook) {
        const abbrevs = BOOK_MAPPINGS[mappedBook];
        return bibleData.find(b => abbrevs.includes(b.abbrev)) || null;
    }
    
    return null;
};

/**
 * Convert offline Bible data to BibleChapter format
 */
const convertToChapterFormat = (book: OfflineBibleBook, chapterIndex: number, bookName: string, chapterNumber: number, translation: string): BibleChapter => {
    const verses = book.chapters[chapterIndex];
    if (!verses) {
        throw new Error(`Chapter ${chapterNumber} not found in ${bookName}`);
    }

    return {
        reference: `${bookName} ${chapterNumber}`,
        verses: verses.map((text, index) => ({
            book_id: book.abbrev,
            book_name: bookName,
            chapter: chapterNumber,
            verse: index + 1,
            text: text
        })),
        text: verses.join(' '),
        translation_id: translation,
        translation_name: translation.toUpperCase(),
        translation_note: `${translation.toUpperCase()} - Offline Version`
    };
};

/**
 * Fetch chapter from offline Bible data
 */
export const fetchOfflineChapter = async (book: string, chapter: number, translation: string): Promise<BibleChapter> => {
    try {
        const bibleData = await loadBibleData(translation);
        const bookData = findBookByName(bibleData, book);
        
        if (!bookData) {
            throw new Error(`Book "${book}" not found in offline ${translation.toUpperCase()} Bible`);
        }
        
        const chapterIndex = chapter - 1; // Convert to 0-based index
        if (chapterIndex < 0 || chapterIndex >= bookData.chapters.length) {
            throw new Error(`Chapter ${chapter} not found in ${book}. Available chapters: 1-${bookData.chapters.length}`);
        }
        
        console.log(`Loaded offline Bible chapter: ${book} ${chapter} (${translation.toUpperCase()})`);
        return convertToChapterFormat(bookData, chapterIndex, book, chapter, translation);
        
    } catch (error) {
        console.error(`Error fetching offline chapter: ${book} ${chapter} (${translation})`, error);
        throw error;
    }
};

/**
 * Check if translation is available offline
 */
export const isTranslationAvailableOffline = (translation: string): boolean => {
    return ['kjv', 'web'].includes(translation.toLowerCase());
};

/**
 * Get list of available offline translations
 */
export const getAvailableOfflineTranslations = (): string[] => {
    return ['kjv', 'web'];
};

/**
 * Get Bible book list for a translation
 */
export const getOfflineBibleBooks = async (translation: string): Promise<{ abbrev: string; name: string; chapters: number }[]> => {
    try {
        const bibleData = await loadBibleData(translation);
        return bibleData.map(book => ({
            abbrev: book.abbrev,
            name: book.abbrev.toUpperCase(), // Could be enhanced with full names
            chapters: book.chapters.length
        }));
    } catch (error) {
        console.error(`Error getting Bible books for ${translation}:`, error);
        return [];
    }
};