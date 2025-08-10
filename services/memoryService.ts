// Memory service for persisting application state across sessions

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
}