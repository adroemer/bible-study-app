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
    'numbers': ['nm', 'nu', 'num', 'numbers'],
    'deuteronomy': ['dt', 'deu', 'deuteronomy'],
    'joshua': ['js', 'jos', 'josh', 'joshua'],
    'judges': ['jud', 'jdg', 'judg', 'judges'],
    'ruth': ['rt', 'ru', 'ruth'],
    '1samuel': ['1sm', '1sa', '1sam', '1samuel'],
    '2samuel': ['2sm', '2sa', '2sam', '2samuel'],
    '1kings': ['1kgs', '1ki', '1kings'],
    '2kings': ['2kgs', '2ki', '2kings'],
    '1chronicles': ['1ch', '1chr', '1chronicles'],
    '2chronicles': ['2ch', '2chr', '2chronicles'],
    'ezra': ['ezr', 'ezra'],
    'nehemiah': ['ne', 'neh', 'nehemiah'],
    'esther': ['et', 'es', 'est', 'esther'],
    'job': ['job', 'jb'],
    'psalms': ['ps', 'psa', 'psm', 'psalms', 'psalm'],
    'proverbs': ['prv', 'pr', 'pro', 'proverbs'],
    'ecclesiastes': ['ec', 'ecc', 'ecclesiastes'],
    'songofsolomon': ['so', 'ss', 'song', 'songofsolomon'],
    'isaiah': ['is', 'isa', 'isaiah'],
    'jeremiah': ['jr', 'jer', 'jeremiah'],
    'lamentations': ['lm', 'la', 'lam', 'lamentations'],
    'ezekiel': ['ez', 'eze', 'ezek', 'ezekiel'],
    'daniel': ['dn', 'da', 'dan', 'daniel'],
    'hosea': ['ho', 'hs', 'hos', 'hosea'],
    'joel': ['jl', 'joe', 'joel'],
    'amos': ['am', 'amos'],
    'obadiah': ['ob', 'oba', 'obadiah'],
    'jonah': ['jo', 'jh', 'jon', 'jonah'],
    'micah': ['mi', 'mc', 'mic', 'micah'],
    'nahum': ['na', 'nah', 'nahum'],
    'habakkuk': ['hk', 'hab', 'habakkuk'],
    'zephaniah': ['zp', 'zep', 'zephaniah'],
    'haggai': ['hg', 'hag', 'haggai'],
    'zechariah': ['zc', 'zec', 'zech', 'zechariah'],
    'malachi': ['ml', 'mal', 'malachi'],
    'matthew': ['mt', 'mat', 'matthew'],
    'mark': ['mk', 'mr', 'mrk', 'mark'],
    'luke': ['lk', 'lu', 'luk', 'luke'],
    'john': ['jn', 'joh', 'john'],
    'acts': ['act', 'ac', 'acts'],
    'romans': ['rm', 'ro', 'rom', 'romans'],
    '1corinthians': ['1co', '1cor', '1corinthians'],
    '2corinthians': ['2co', '2cor', '2corinthians'],
    'galatians': ['gl', 'ga', 'gal', 'galatians'],
    'ephesians': ['eph', 'ep', 'ephesians'],
    'philippians': ['ph', 'php', 'philippians'],
    'colossians': ['cl', 'col', 'colossians'],
    '1thessalonians': ['1ts', '1th', '1thes', '1thessalonians'],
    '2thessalonians': ['2ts', '2th', '2thes', '2thessalonians'],
    '1timothy': ['1tm', '1ti', '1tim', '1timothy'],
    '2timothy': ['2tm', '2ti', '2tim', '2timothy'],
    'titus': ['tt', 'tit', 'titus'],
    'philemon': ['phm', 'pm', 'phlm', 'philemon'],
    'hebrews': ['hb', 'he', 'heb', 'hebrews'],
    'james': ['jm', 'jas', 'james'],
    '1peter': ['1pe', '1pt', '1pet', '1peter'],
    '2peter': ['2pe', '2pt', '2pet', '2peter'],
    '1john': ['1jo', '1jn', '1john'],
    '2john': ['2jo', '2jn', '2john'],
    '3john': ['3jo', '3jn', '3john'],
    'jude': ['jd', 'jude'],
    'revelation': ['re', 'rv', 'rev', 'revelation']
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
        let filename = 'web.json';
        if (translation === 'kjv') {
            filename = 'kjv.json';
        } else if (translation === 'niv') {
            filename = 'niv.json';
        } else if (translation === 'nabre') {
            filename = 'nabre.json';
        } else if (translation === 'esv') {
            filename = 'esv.json';
        }
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
    return ['kjv', 'web', 'niv', 'nabre', 'esv'].includes(translation.toLowerCase());
};

/**
 * Get list of available offline translations
 */
export const getAvailableOfflineTranslations = (): string[] => {
    return ['kjv', 'web', 'niv', 'nabre', 'esv'];
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