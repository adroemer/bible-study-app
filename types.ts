
export interface Source {
  uri: string;
  title: string;
}

export interface GeminiResponse {
  text: string;
  sources: Source[];
}

export interface BibleBook {
    name: string;
    testament: 'OT' | 'NT';
}

export interface BibleVerse {
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface BibleChapter {
    reference: string;
    verses: BibleVerse[];
    text: string;
    translation_name: string;
    translation_id: string;
}

export type MessageAuthor = 'user' | 'ai';

export interface ChatMessage {
    author: MessageAuthor;
    text: string;
    isLoading?: boolean;
}

export type CommentaryPerspective = 'catholic' | 'enduring_word' | 'historical';

export type BibleTranslation = 'web' | 'kjv' | 'bbe' | 'asv';