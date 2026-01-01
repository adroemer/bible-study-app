// Memory service for persisting application state across sessions

import type { Bookmark, ScrollPosition } from '../types';

export interface BibleMemoryState {
  lastBook?: string;
  lastChapter?: number;
  lastTranslation?: string;
  chapterAnalysis?: {
    type: 'summary' | 'commentary';
    text: string;
    perspective?: string;
    bookName: string;
    chapter: number;
    translation: string;
  } | null;
  selectionAnalysis?: {
    text: string;
    perspective: string;
    selectedText: string;
    bookName: string;
    chapter: number;
  } | null;
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  bookmarks?: Bookmark[];
  scrollPositions?: ScrollPosition[];
  darkMode?: boolean;
  readChapters?: string[]; // Format: "BookName:Chapter"
}

export interface StudyMemoryState {
  lastQuery?: string;
  lastResponse?: {
    response: string;
    sources?: string[];
    timestamp: string;
  } | null;
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

const BIBLE_MEMORY_KEY = 'f3-bible-study-memory';
const STUDY_MEMORY_KEY = 'f3-study-memory';

export class MemoryService {
  // Bible Explorer Memory
  static saveBibleState(state: BibleMemoryState): void {
    try {
      localStorage.setItem(BIBLE_MEMORY_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save Bible state to localStorage:', error);
    }
  }

  static loadBibleState(): BibleMemoryState {
    try {
      const saved = localStorage.getItem(BIBLE_MEMORY_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load Bible state from localStorage:', error);
      return {};
    }
  }

  static clearBibleState(): void {
    try {
      localStorage.removeItem(BIBLE_MEMORY_KEY);
    } catch (error) {
      console.warn('Failed to clear Bible state:', error);
    }
  }

  // Study Memory
  static saveStudyState(state: StudyMemoryState): void {
    try {
      localStorage.setItem(STUDY_MEMORY_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save study state to localStorage:', error);
    }
  }

  static loadStudyState(): StudyMemoryState {
    try {
      const saved = localStorage.getItem(STUDY_MEMORY_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load study state from localStorage:', error);
      return {};
    }
  }

  static clearStudyState(): void {
    try {
      localStorage.removeItem(STUDY_MEMORY_KEY);
    } catch (error) {
      console.warn('Failed to clear study state:', error);
    }
  }

  // Utility methods
  static addBibleChatMessage(role: 'user' | 'assistant', content: string): void {
    const currentState = this.loadBibleState();
    const chatHistory = currentState.chatHistory || [];
    
    chatHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages to prevent localStorage bloat
    if (chatHistory.length > 50) {
      chatHistory.splice(0, chatHistory.length - 50);
    }

    this.saveBibleState({
      ...currentState,
      chatHistory
    });
  }

  static addStudyChatMessage(role: 'user' | 'assistant', content: string): void {
    const currentState = this.loadStudyState();
    const chatHistory = currentState.chatHistory || [];

    chatHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages
    if (chatHistory.length > 50) {
      chatHistory.splice(0, chatHistory.length - 50);
    }

    this.saveStudyState({
      ...currentState,
      chatHistory
    });
  }

  // Bookmark methods
  static getBookmarks(): Bookmark[] {
    return this.loadBibleState().bookmarks || [];
  }

  static addBookmark(bookmark: Bookmark): void {
    const currentState = this.loadBibleState();
    const bookmarks = currentState.bookmarks || [];
    bookmarks.push(bookmark);
    this.saveBibleState({ ...currentState, bookmarks });
  }

  static removeBookmark(id: string): void {
    const currentState = this.loadBibleState();
    const bookmarks = (currentState.bookmarks || []).filter(b => b.id !== id);
    this.saveBibleState({ ...currentState, bookmarks });
  }

  static isVerseBookmarked(bookName: string, chapter: number, verse: number): Bookmark | undefined {
    const bookmarks = this.getBookmarks();
    return bookmarks.find(b => b.bookName === bookName && b.chapter === chapter && b.verse === verse);
  }

  // Scroll position methods
  static saveScrollPosition(bookName: string, chapter: number, scrollTop: number): void {
    const currentState = this.loadBibleState();
    const scrollPositions = currentState.scrollPositions || [];
    const existingIndex = scrollPositions.findIndex(sp => sp.bookName === bookName && sp.chapter === chapter);

    if (existingIndex >= 0) {
      scrollPositions[existingIndex].scrollTop = scrollTop;
    } else {
      scrollPositions.push({ bookName, chapter, scrollTop });
    }

    // Keep only last 100 positions
    if (scrollPositions.length > 100) {
      scrollPositions.splice(0, scrollPositions.length - 100);
    }

    this.saveBibleState({ ...currentState, scrollPositions });
  }

  static getScrollPosition(bookName: string, chapter: number): number {
    const scrollPositions = this.loadBibleState().scrollPositions || [];
    const position = scrollPositions.find(sp => sp.bookName === bookName && sp.chapter === chapter);
    return position?.scrollTop || 0;
  }

  // Dark mode methods
  static getDarkMode(): boolean {
    const state = this.loadBibleState();
    if (state.darkMode !== undefined) return state.darkMode;
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  static setDarkMode(enabled: boolean): void {
    const currentState = this.loadBibleState();
    this.saveBibleState({ ...currentState, darkMode: enabled });
  }

  // Reading progress methods
  static markChapterRead(bookName: string, chapter: number): void {
    const currentState = this.loadBibleState();
    const readChapters = currentState.readChapters || [];
    const key = `${bookName}:${chapter}`;
    if (!readChapters.includes(key)) {
      readChapters.push(key);
      this.saveBibleState({ ...currentState, readChapters });
    }
  }

  static isChapterRead(bookName: string, chapter: number): boolean {
    const readChapters = this.loadBibleState().readChapters || [];
    return readChapters.includes(`${bookName}:${chapter}`);
  }

  static getReadChaptersCount(bookName: string): number {
    const readChapters = this.loadBibleState().readChapters || [];
    return readChapters.filter(rc => rc.startsWith(`${bookName}:`)).length;
  }
}