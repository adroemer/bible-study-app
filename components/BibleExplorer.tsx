
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { BibleBook, BibleChapter, CommentaryPerspective, BibleTranslation, BibleVerse, Bookmark } from '../types';
import { chronologicalBooks, alphabeticalBooks } from '../util/bibleBooks';
import { fetchChapter } from '../services/bibleService';
import { summarizeChapter, generateChapterCommentary, createScriptureChat, generateSelectionCommentary } from '../services/secureApiService';
import { ErrorAlert } from './ErrorAlert';
import { LoadingSpinner } from './LoadingSpinner';
import {
    ArrowsRightLeftIcon, BookOpenIcon, ChatBubbleLeftRightIcon, ChevronLeftIcon,
    ChevronRightIcon, ChevronDownIcon, BookmarkIcon, BookmarkSolidIcon,
    MagnifyingGlassIcon, SunIcon, MoonIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
    ClipboardDocumentIcon, CheckIcon, ChevronUpDownIcon, XMarkIcon
} from './Icons';
import { ChatInterface } from './ChatInterface';
import { MemoryService, type BibleMemoryState } from '../services/memoryService';

type SortOrder = 'chrono' | 'alpha';

const chapterCounts: { [key: string]: number } = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
    "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
    "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150,
    "Proverbs": 31, "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66,
    "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14,
    "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3,
    "Habakkuk": 3, "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
    "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
    "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
    "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
    "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
    "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
    "Jude": 1, "Revelation": 22
};

const BookList: React.FC<{
    books: BibleBook[];
    selectedBook: BibleBook | null;
    onSelectBook: (book: BibleBook) => void;
}> = ({ books, selectedBook, onSelectBook }) => {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Old Testament</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2">
                    {books.filter(b => b.testament === 'OT').map(book => (
                        <button key={book.name} onClick={() => onSelectBook(book)} className={`p-2 text-sm text-left rounded-md transition-colors ${selectedBook?.name === book.name ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/50'}`}>
                            {book.name}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">New Testament</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2">
                    {books.filter(b => b.testament === 'NT').map(book => (
                        <button key={book.name} onClick={() => onSelectBook(book)} className={`p-2 text-sm text-left rounded-md transition-colors ${selectedBook?.name === book.name ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/50'}`}>
                            {book.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

const ChapterGrid: React.FC<{
    bookName: string;
    onSelectChapter: (chapter: number) => void;
}> = ({ bookName, onSelectChapter }) => {
    const [columns, setColumns] = useState(5);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1024) setColumns(12);
            else if (width >= 768) setColumns(10);
            else if (width >= 640) setColumns(8);
            else setColumns(5);
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const count = chapterCounts[bookName] || 0;

    return (
        <div 
            className="grid gap-2 w-full"
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
            }}
        >
            {Array.from({ length: count }, (_, i) => i + 1).map(chapter => (
                <button 
                    key={chapter} 
                    onClick={() => onSelectChapter(chapter)} 
                    className="w-full h-10 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors text-sm font-medium border border-slate-200 dark:border-slate-600"
                >
                    {chapter}
                </button>
            ))}
        </div>
    );
};

const commentaryPerspectiveLabels: Record<CommentaryPerspective, string> = {
    catholic: 'Catholic Perspective',
    enduring_word: 'Enduring Word Style',
    historical: 'Historical Theologian',
    nt_wright: 'N.T. Wright',
    james_dunn: 'James Dunn',
    ep_sanders: 'E.P. Sanders',
    bart_ehrman: 'Bart Ehrman',
    jd_crossan: 'J.D. Crossan',
    richard_bauckham: 'Richard Bauckham',
    da_carson: 'D.A. Carson',
    walter_brueggemann: 'Walter Brueggemann',
    john_bright: 'John Bright'
};


export const BibleExplorer: React.FC = () => {
    // Initialize state from memory
    const memoryState = useMemo(() => MemoryService.loadBibleState(), []);
    
    const [sortOrder, setSortOrder] = useState<SortOrder>('chrono');
    const [selectedBook, setSelectedBook] = useState<BibleBook | null>(() => {
        if (memoryState.lastBook) {
            const books = [...chronologicalBooks, ...alphabeticalBooks];
            return books.find(book => book.name === memoryState.lastBook) || null;
        }
        return null;
    });
    const [selectedChapter, setSelectedChapter] = useState<number | null>(memoryState.lastChapter || null);
    const [translation, setTranslation] = useState<BibleTranslation>(memoryState.lastTranslation as BibleTranslation || 'niv');
    const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'>('2xl');

    const [chapterAnalysis, setChapterAnalysis] = useState<{ type: 'summary' | 'commentary', text: string, perspective?: CommentaryPerspective } | null>(() => {
        if (memoryState.chapterAnalysis && 
            memoryState.chapterAnalysis.bookName === memoryState.lastBook && 
            memoryState.chapterAnalysis.chapter === memoryState.lastChapter &&
            memoryState.chapterAnalysis.translation === memoryState.lastTranslation) {
            return {
                type: memoryState.chapterAnalysis.type,
                text: memoryState.chapterAnalysis.text,
                perspective: memoryState.chapterAnalysis.perspective as CommentaryPerspective
            };
        }
        return null;
    });
    const [isChapterAnalysisLoading, setIsChapterAnalysisLoading] = useState(false);
    
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [selectionAnalysis, setSelectionAnalysis] = useState<{ text: string, perspective: CommentaryPerspective } | null>(() => {
        if (memoryState.selectionAnalysis &&
            memoryState.selectionAnalysis.bookName === memoryState.lastBook &&
            memoryState.selectionAnalysis.chapter === memoryState.lastChapter) {
            return {
                text: memoryState.selectionAnalysis.text,
                perspective: memoryState.selectionAnalysis.perspective as CommentaryPerspective
            };
        }
        return null;
    });
    const [isSelectionAnalysisLoading, setIsSelectionAnalysisLoading] = useState(false);

    const [chatInstance, setChatInstance] = useState<{ sendMessage: (message: string) => Promise<string> } |
    null>(null);
    const [isCommentaryExpanded, setIsCommentaryExpanded] = useState(false);

    // New feature states
    const [darkMode, setDarkMode] = useState(() => MemoryService.getDarkMode());
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => MemoryService.getBookmarks());
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ book: string; chapter: number; verse: number; text: string }>>([]);
    const [showChapterPicker, setShowChapterPicker] = useState(false);
    const [parallelTranslation, setParallelTranslation] = useState<BibleTranslation | null>(null);
    const [parallelChapterData, setParallelChapterData] = useState<BibleChapter | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
    const [hoveredVerse, setHoveredVerse] = useState<number | null>(null);
    const [readingProgress, setReadingProgress] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const mainContentRef = useRef<HTMLDivElement>(null);
    const chapterTextRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const books = useMemo(() => (sortOrder === 'chrono' ? chronologicalBooks : alphabeticalBooks), [sortOrder]);

    // Get total chapters for current book
    const totalChapters = selectedBook ? chapterCounts[selectedBook.name] || 0 : 0;
    const hasPrevChapter = selectedChapter !== null && selectedChapter > 1;
    const hasNextChapter = selectedChapter !== null && selectedChapter < totalChapters;

    const handlePrevChapter = () => {
        if (hasPrevChapter && selectedChapter) {
            handleSelectChapter(selectedChapter - 1, translation);
        }
    };

    const handleNextChapter = () => {
        if (hasNextChapter && selectedChapter) {
            handleSelectChapter(selectedChapter + 1, translation);
        }
    };

    // Dark mode effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        MemoryService.setDarkMode(darkMode);
    }, [darkMode]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'ArrowLeft' && hasPrevChapter) {
                handlePrevChapter();
            } else if (e.key === 'ArrowRight' && hasNextChapter) {
                handleNextChapter();
            } else if (e.key === 'Escape') {
                setSelectedText(null);
                setShowSearch(false);
                setShowChapterPicker(false);
                window.getSelection()?.removeAllRanges();
            } else if (e.key === '/' && !showSearch) {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            } else if (/^[1-9]$/.test(e.key) && selectedBook && !selectedChapter) {
                const chapter = parseInt(e.key);
                if (chapter <= totalChapters) {
                    handleSelectChapter(chapter, translation);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasPrevChapter, hasNextChapter, selectedBook, selectedChapter, totalChapters, showSearch]);

    // Scroll position save/restore
    useEffect(() => {
        if (selectedBook && selectedChapter && chapterData && chapterTextRef.current) {
            const savedPosition = MemoryService.getScrollPosition(selectedBook.name, selectedChapter);
            if (savedPosition > 0) {
                setTimeout(() => {
                    chapterTextRef.current?.scrollTo(0, savedPosition);
                }, 100);
            }
        }
    }, [chapterData]);

    const handleScroll = useCallback(() => {
        if (chapterTextRef.current && selectedBook && selectedChapter) {
            const { scrollTop, scrollHeight, clientHeight } = chapterTextRef.current;
            MemoryService.saveScrollPosition(selectedBook.name, selectedChapter, scrollTop);

            // Reading progress
            const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0;
            setReadingProgress(Math.min(100, Math.max(0, progress)));

            // Mark as read when scrolled past 90%
            if (progress >= 90) {
                MemoryService.markChapterRead(selectedBook.name, selectedChapter);
            }
        }
    }, [selectedBook, selectedChapter]);

    // Swipe gesture handling
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (Math.abs(diff) > 75) { // Minimum swipe distance
            if (diff > 0 && hasNextChapter) {
                handleNextChapter();
            } else if (diff < 0 && hasPrevChapter) {
                handlePrevChapter();
            }
        }
        setTouchStart(null);
    };

    // Parallel translation fetch
    useEffect(() => {
        if (parallelTranslation && selectedBook && selectedChapter) {
            fetchChapter(selectedBook.name, selectedChapter, parallelTranslation)
                .then(setParallelChapterData)
                .catch(() => setParallelChapterData(null));
        } else {
            setParallelChapterData(null);
        }
    }, [parallelTranslation, selectedBook, selectedChapter]);

    // Search handler
    const handleSearch = useCallback(() => {
        if (!searchQuery.trim() || !chapterData) return;
        const query = searchQuery.toLowerCase();
        const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];

        chapterData.verses.forEach(verse => {
            if (verse.text.toLowerCase().includes(query)) {
                results.push({
                    book: selectedBook!.name,
                    chapter: selectedChapter!,
                    verse: verse.verse,
                    text: verse.text
                });
            }
        });
        setSearchResults(results);
    }, [searchQuery, chapterData, selectedBook, selectedChapter]);

    // Text-to-speech
    const handleSpeak = () => {
        if (isSpeaking) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        } else if (chapterData) {
            const text = chapterData.verses.map(v => v.text).join(' ');
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setIsSpeaking(false);
            speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    // Copy verse to clipboard
    const handleCopyVerse = async (verse: BibleVerse) => {
        const formattedText = `${chapterData?.reference}:${verse.verse} (${translation.toUpperCase()}) - "${verse.text}"`;
        await navigator.clipboard.writeText(formattedText);
        setCopiedVerse(verse.verse);
        setTimeout(() => setCopiedVerse(null), 2000);
    };

    // Bookmark toggle
    const toggleBookmark = (verse: BibleVerse) => {
        if (!selectedBook || !selectedChapter) return;

        const existing = MemoryService.isVerseBookmarked(selectedBook.name, selectedChapter, verse.verse);
        if (existing) {
            MemoryService.removeBookmark(existing.id);
        } else {
            const bookmark: Bookmark = {
                id: `${selectedBook.name}-${selectedChapter}-${verse.verse}-${Date.now()}`,
                bookName: selectedBook.name,
                chapter: selectedChapter,
                verse: verse.verse,
                text: verse.text,
                color: 'yellow',
                createdAt: new Date().toISOString()
            };
            MemoryService.addBookmark(bookmark);
        }
        setBookmarks(MemoryService.getBookmarks());
    };

    const isVerseBookmarked = (verseNum: number) => {
        if (!selectedBook || !selectedChapter) return false;
        return MemoryService.isVerseBookmarked(selectedBook.name, selectedChapter, verseNum) !== undefined;
    };

    // Restore chapter data on component mount if we have memory state
    useEffect(() => {
        if (selectedBook && selectedChapter && !chapterData) {
            handleSelectChapter(selectedChapter, translation);
        }
    }, []); // Run only once on mount

    // Save memory state when key values change
    useEffect(() => {
        if (selectedBook && selectedChapter) {
            const currentState = MemoryService.loadBibleState();
            MemoryService.saveBibleState({
                ...currentState,
                lastBook: selectedBook.name,
                lastChapter: selectedChapter,
                lastTranslation: translation
            });
        }
    }, [selectedBook, selectedChapter, translation]);

    const handleSelectBook = (book: BibleBook) => {
        setSelectedBook(book);
        setSelectedChapter(null);
        setChapterData(null);
        setChapterAnalysis(null);
        setChatInstance(null);
        setSelectedText(null);
        setSelectionAnalysis(null);
        setSidebarCollapsed(false); // Expand sidebar when selecting a book
    };

    const handleSelectChapter = useCallback(async (chapter: number, version: BibleTranslation) => {
        if (!selectedBook) return;

        mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsLoading(true);
        setError(null);
        setChapterData(null);
        setChapterAnalysis(null);
        setChatInstance(null);
        setSelectedText(null);
        setSelectionAnalysis(null);
        setSelectedChapter(chapter);
        setSidebarCollapsed(true); // Auto-collapse sidebar when chapter is selected

        try {
            const data = await fetchChapter(selectedBook.name, chapter, version);
            setChapterData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedBook]);
    
    const handleTranslationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTranslation = e.target.value as BibleTranslation;
        setTranslation(newTranslation);
        if (selectedBook && selectedChapter) {
            handleSelectChapter(selectedChapter, newTranslation);
        }
    };

    const handleSummarize = async () => {
        if (!chapterData || !selectedBook || !selectedChapter) return;
        setIsChapterAnalysisLoading(true);
        setChapterAnalysis(null);
        setChatInstance(null);
        try {
            const summary = await summarizeChapter(chapterData.text, chapterData.reference);
            const analysisResult = { type: 'summary' as const, text: summary };
            setChapterAnalysis(analysisResult);
            setChatInstance(createScriptureChat(chapterData.reference, chapterData.text));
            
            // Save to memory
            const currentState = MemoryService.loadBibleState();
            MemoryService.saveBibleState({
                ...currentState,
                chapterAnalysis: {
                    ...analysisResult,
                    bookName: selectedBook.name,
                    chapter: selectedChapter,
                    translation: translation
                }
            });
        } catch (err) {
            setError(err instanceof Error ? `Failed to get summary: ${err.message}`: 'Unknown error');
        } finally {
            setIsChapterAnalysisLoading(false);
        }
    }

    const handleChapterCommentary = async (perspective: CommentaryPerspective) => {
        if (!chapterData || !selectedBook || !selectedChapter) return;
        setIsChapterAnalysisLoading(true);
        setChapterAnalysis(null);
        setChatInstance(null);
        try {
            const commentary = await generateChapterCommentary(chapterData.text, chapterData.reference, perspective);
            const analysisResult = { type: 'commentary' as const, text: commentary, perspective };
            setChapterAnalysis(analysisResult);
            setChatInstance(createScriptureChat(chapterData.reference, chapterData.text));
            
            // Save to memory
            const currentState = MemoryService.loadBibleState();
            MemoryService.saveBibleState({
                ...currentState,
                chapterAnalysis: {
                    ...analysisResult,
                    bookName: selectedBook.name,
                    chapter: selectedChapter,
                    translation: translation
                }
            });
        } catch (err) {
             setError(err instanceof Error ? `Failed to get commentary: ${err.message}`: 'Unknown error');
        } finally {
            setIsChapterAnalysisLoading(false);
        }
    }

    const handleTextSelection = () => {
        const text = window.getSelection()?.toString().trim();
        if (text && text.length > 5) { // Basic check for meaningful selection
            setSelectedText(text);
            setSelectionAnalysis(null);
        }
    };

    const handleSelectionCommentary = async (perspective: CommentaryPerspective) => {
        if (!selectedText || !chapterData || !selectedBook || !selectedChapter) return;
        setIsSelectionAnalysisLoading(true);
        setSelectionAnalysis(null);
        try {
            const commentary = await generateSelectionCommentary(selectedText, chapterData.reference, perspective);
            const analysisResult = { text: commentary, perspective };
            setSelectionAnalysis(analysisResult);
            
            // Save to memory
            const currentState = MemoryService.loadBibleState();
            MemoryService.saveBibleState({
                ...currentState,
                selectionAnalysis: {
                    ...analysisResult,
                    selectedText: selectedText,
                    bookName: selectedBook.name,
                    chapter: selectedChapter
                }
            });
        } catch (err) {
            // Display error in the selection box? For now, top-level.
            setError(err instanceof Error ? `Failed to get commentary for selection: ${err.message}` : 'Unknown error');
        } finally {
            setIsSelectionAnalysisLoading(false);
        }
    }

    const verseText = (verse: BibleVerse) => {
        // Remove the "[...]" that the API sometimes adds.
        return verse.text.replace(/\[\d+\]/g, '').trim();
    };

    const getFontSizeClasses = (size: typeof fontSize) => {
        const sizeMap = {
            'sm': 'text-sm',
            'base': 'text-base',
            'lg': 'text-lg',
            'xl': 'text-xl',
            '2xl': 'text-2xl',
            '3xl': 'text-3xl'
        };
        return sizeMap[size];
    };


    return (
        <>
            {/* Top Toolbar */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    {/* Search Toggle */}
                    <button
                        onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Search (press /)"
                    >
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    {/* Bookmarks count */}
                    {bookmarks.length > 0 && (
                        <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                            {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Text-to-Speech */}
                    {chapterData && (
                        <button
                            onClick={handleSpeak}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isSpeaking ? 'Stop reading' : 'Read chapter aloud'}
                        >
                            {isSpeaking ? (
                                <SpeakerXMarkIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            ) : (
                                <SpeakerWaveIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            )}
                        </button>
                    )}
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? (
                            <SunIcon className="h-5 w-5 text-yellow-500" />
                        ) : (
                            <MoonIcon className="h-5 w-5 text-slate-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
                <div className="mb-4 animate-fade-in">
                    <div className="relative">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search in current chapter..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full px-4 py-2 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <button
                            onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <XMarkIcon className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                        </button>
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{searchResults.length} result(s)</p>
                            {searchResults.map((result, i) => (
                                <div key={i} className="text-sm p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                    <span className="font-medium text-primary-600 dark:text-primary-400">v{result.verse}</span>: {result.text.slice(0, 100)}...
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className={`${sidebarCollapsed ? '' : 'lg:grid lg:grid-cols-3 lg:gap-8'}`}>
                {/* Collapsible Sidebar */}
                {!sidebarCollapsed && (
                    <aside className="lg:col-span-1 mb-8 lg:mb-0">
                        <div className="sticky top-8">
                            <header className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Books</h2>
                                <button onClick={() => setSortOrder(s => s === 'chrono' ? 'alpha' : 'chrono')} className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                    <ArrowsRightLeftIcon className="h-4 w-4" />
                                    {sortOrder === 'chrono' ? 'Alphabetical' : 'Chronological'}
                                </button>
                            </header>
                            <div className="max-h-[75vh] overflow-y-auto p-1">
                                <BookList books={books} selectedBook={selectedBook} onSelectBook={handleSelectBook} />
                            </div>
                        </div>
                    </aside>
                )}

                <main ref={mainContentRef} className={sidebarCollapsed ? 'w-full' : 'lg:col-span-2'}>
                {/* Breadcrumb Navigation */}
                {selectedBook && (
                    <nav className="flex items-center justify-between mb-4" aria-label="Breadcrumb">
                        <div className="flex items-center gap-2 text-sm">
                            <button
                                onClick={() => { setSelectedBook(null); setSelectedChapter(null); setChapterData(null); setSidebarCollapsed(false); }}
                                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                            >
                                Books
                            </button>
                            <span className="text-slate-400">/</span>
                            <button
                                onClick={() => { setSelectedChapter(null); setChapterData(null); setSidebarCollapsed(false); }}
                                className={`font-medium ${selectedChapter ? 'text-primary-600 dark:text-primary-400 hover:underline' : 'text-slate-800 dark:text-slate-100'}`}
                                disabled={!selectedChapter}
                            >
                                {selectedBook.name}
                            </button>
                            {selectedChapter && (
                                <>
                                    <span className="text-slate-400">/</span>
                                    <span className="text-slate-800 dark:text-slate-100 font-medium">Chapter {selectedChapter}</span>
                                </>
                            )}
                        </div>
                        {/* Toggle sidebar button - only show when viewing chapter */}
                        {selectedChapter && sidebarCollapsed && (
                            <button
                                onClick={() => setSidebarCollapsed(false)}
                                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <BookOpenIcon className="h-3.5 w-3.5" />
                                Show Books
                            </button>
                        )}
                    </nav>
                )}

                {error && <ErrorAlert message={error} />}

                {!selectedBook && (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg h-full">
                        <BookOpenIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Select a Book</h3>
                        <p className="text-slate-500 dark:text-slate-400">Choose a book from the list to begin exploring.</p>
                    </div>
                )}

                {selectedBook && !selectedChapter && (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">{selectedBook.name}</h2>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                           <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Select a Chapter</h3>
                           <ChapterGrid bookName={selectedBook.name} onSelectChapter={(chapter) => handleSelectChapter(chapter, translation)} />
                        </div>
                    </div>
                )}
                
                {/* Loading Skeleton */}
                {isLoading && (
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    </div>
                )}

                {chapterData && !isLoading && (
                    <div className="animate-fade-in" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                        <article className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            {/* Reading Progress Bar */}
                            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-t-xl overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all duration-300"
                                    style={{ width: `${readingProgress}%` }}
                                />
                            </div>
                            {/* Sticky Header - Compact */}
                            <header className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
                                {/* Chapter Navigation Row */}
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={handlePrevChapter}
                                        disabled={!hasPrevChapter}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        aria-label="Previous chapter"
                                    >
                                        <ChevronLeftIcon className="h-4 w-4" />
                                        <span className="hidden sm:inline">Prev</span>
                                    </button>
                                    {/* Chapter Picker */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowChapterPicker(!showChapterPicker)}
                                            className="flex items-center gap-1 text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400"
                                        >
                                            {chapterData.reference}
                                            <ChevronUpDownIcon className="h-5 w-5" />
                                        </button>
                                        {showChapterPicker && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 max-h-64 overflow-y-auto">
                                                <div className="grid grid-cols-5 gap-1 min-w-[200px]">
                                                    {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => (
                                                        <button
                                                            key={ch}
                                                            onClick={() => { handleSelectChapter(ch, translation); setShowChapterPicker(false); }}
                                                            className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${ch === selectedChapter ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                        >
                                                            {ch}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleNextChapter}
                                        disabled={!hasNextChapter}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        aria-label="Next chapter"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                {/* Controls Row - Compact */}
                                <div className="flex flex-col sm:flex-row gap-1.5">
                                    <div className="flex-1">
                                        <label htmlFor="translation-select" className="sr-only">Translation</label>
                                        <select
                                            id="translation-select"
                                            value={translation}
                                            onChange={handleTranslationChange}
                                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-1.5 pl-2 pr-8 text-xs focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                        >
                                            <option value="web">World English Bible</option>
                                            <option value="kjv">King James Version</option>
                                            <option value="bbe">Bible in Basic English</option>
                                            <option value="asv">American Standard Version</option>
                                            <option value="niv">New International Version</option>
                                            <option value="nabre">New American Bible Revised Edition</option>
                                            <option value="esv">English Standard Version</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="parallel-select" className="sr-only">Parallel Translation</label>
                                        <select
                                            id="parallel-select"
                                            value={parallelTranslation || ''}
                                            onChange={(e) => setParallelTranslation(e.target.value as BibleTranslation || null)}
                                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-1.5 pl-2 pr-8 text-xs focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                        >
                                            <option value="">No parallel</option>
                                            <option value="web" disabled={translation === 'web'}>World English Bible</option>
                                            <option value="kjv" disabled={translation === 'kjv'}>King James Version</option>
                                            <option value="bbe" disabled={translation === 'bbe'}>Bible in Basic English</option>
                                            <option value="asv" disabled={translation === 'asv'}>American Standard Version</option>
                                            <option value="niv" disabled={translation === 'niv'}>New International Version</option>
                                            <option value="nabre" disabled={translation === 'nabre'}>New American Bible Revised Edition</option>
                                            <option value="esv" disabled={translation === 'esv'}>English Standard Version</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="font-size-select" className="sr-only">Font Size</label>
                                        <select
                                            id="font-size-select"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(e.target.value as typeof fontSize)}
                                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-1.5 pl-2 pr-8 text-xs focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                        >
                                            <option value="sm">Small</option>
                                            <option value="base">Normal</option>
                                            <option value="lg">Large</option>
                                            <option value="xl">Extra Large</option>
                                            <option value="2xl">2X Large</option>
                                            <option value="3xl">3X Large</option>
                                        </select>
                                    </div>
                                </div>
                            </header>
                            {/* Chapter Text */}
                            <div
                                ref={chapterTextRef}
                                onScroll={handleScroll}
                                className={`p-4 sm:p-6 max-h-[70vh] overflow-y-auto ${parallelTranslation && parallelChapterData ? 'grid grid-cols-2 gap-4' : ''}`}
                            >
                                {/* Primary Translation */}
                                <div className={`prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-serif leading-relaxed ${getFontSizeClasses(fontSize)}`} onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection}>
                                    {parallelTranslation && <p className="text-xs font-sans text-slate-500 mb-2">{chapterData.translation_name}</p>}
                                    {chapterData.verses.map(verse => (
                                        <span
                                            key={verse.verse}
                                            className={`mr-1 relative group inline ${isVerseBookmarked(verse.verse) ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}
                                            onMouseEnter={() => setHoveredVerse(verse.verse)}
                                            onMouseLeave={() => setHoveredVerse(null)}
                                        >
                                            <sup
                                                className="text-primary-600 dark:text-primary-400 font-sans font-bold text-xs mr-1 cursor-pointer hover:text-primary-800 dark:hover:text-primary-300"
                                                onClick={() => toggleBookmark(verse)}
                                                title={isVerseBookmarked(verse.verse) ? 'Remove bookmark' : 'Add bookmark'}
                                            >
                                                {isVerseBookmarked(verse.verse) ? (
                                                    <BookmarkSolidIcon className="inline h-3 w-3 text-yellow-500" />
                                                ) : null}
                                                {verse.verse}
                                            </sup>
                                            {verseText(verse)}
                                            {/* Verse Actions Tooltip */}
                                            {hoveredVerse === verse.verse && (
                                                <span className="absolute -top-8 left-0 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 flex items-center gap-2">
                                                    <span>{chapterData.reference}:{verse.verse}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCopyVerse(verse); }}
                                                        className="hover:text-primary-300"
                                                        title="Copy verse"
                                                    >
                                                        {copiedVerse === verse.verse ? (
                                                            <CheckIcon className="h-3 w-3 text-green-400" />
                                                        ) : (
                                                            <ClipboardDocumentIcon className="h-3 w-3" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleBookmark(verse); }}
                                                        className="hover:text-yellow-300"
                                                        title={isVerseBookmarked(verse.verse) ? 'Remove bookmark' : 'Add bookmark'}
                                                    >
                                                        {isVerseBookmarked(verse.verse) ? (
                                                            <BookmarkSolidIcon className="h-3 w-3 text-yellow-400" />
                                                        ) : (
                                                            <BookmarkIcon className="h-3 w-3" />
                                                        )}
                                                    </button>
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                                {/* Parallel Translation */}
                                {parallelTranslation && parallelChapterData && (
                                    <div className={`prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-serif leading-relaxed border-l border-slate-200 dark:border-slate-700 pl-4 ${getFontSizeClasses(fontSize)}`}>
                                        <p className="text-xs font-sans text-slate-500 mb-2">{parallelChapterData.translation_name}</p>
                                        {parallelChapterData.verses.map(verse => (
                                            <span key={verse.verse} className="mr-1">
                                                <sup className="text-primary-600 dark:text-primary-400 font-sans font-bold text-xs mr-1">{verse.verse}</sup>
                                                {verseText(verse)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Bottom Chapter Navigation - Compact */}
                            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={handlePrevChapter}
                                    disabled={!hasPrevChapter}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <ChevronLeftIcon className="h-3 w-3" />
                                    <span className="hidden sm:inline">Prev</span>
                                </button>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {selectedChapter} of {totalChapters}
                                </span>
                                <button
                                    onClick={handleNextChapter}
                                    disabled={!hasNextChapter}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRightIcon className="h-3 w-3" />
                                </button>
                            </div>
                        </article>
                        
                        {selectedText && (
                            <section className="mt-8 animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Analysis for Selection</h3>
                                <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-700/50">
                                    <blockquote className="border-l-4 border-primary-500 pl-4 italic text-slate-600 dark:text-slate-300 mb-4">
                                        "{selectedText}"
                                    </blockquote>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {Object.keys(commentaryPerspectiveLabels).map(key => (
                                            <button key={key} onClick={() => handleSelectionCommentary(key as CommentaryPerspective)} disabled={isSelectionAnalysisLoading} className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 flex items-center justify-center gap-2">
                                                {isSelectionAnalysisLoading ? <LoadingSpinner/> : `Comment on "${commentaryPerspectiveLabels[key as CommentaryPerspective]}"`}
                                            </button>
                                        ))}
                                    </div>
                                    {isSelectionAnalysisLoading && <div className="mt-6 flex justify-center"><LoadingSpinner /></div>}
                                    {selectionAnalysis && !isSelectionAnalysisLoading && (
                                        <div className="mt-6 border-t border-primary-200 dark:border-primary-700/50 pt-6 animate-fade-in">
                                             <div className="flex items-center gap-3 mb-4">
                                                <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                    Commentary: {commentaryPerspectiveLabels[selectionAnalysis.perspective]}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Note: This content is AI-generated and should be used as a study aid.</p>
                                            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                                {selectionAnalysis.text}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                        
                        <section className="mt-8">
                             <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Analysis for Chapter</h3>
                             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                {/* Primary Actions */}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <button onClick={handleSummarize} disabled={isChapterAnalysisLoading} className="w-full px-4 py-2.5 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 flex items-center justify-center gap-2">
                                        {isChapterAnalysisLoading && !chapterAnalysis ? <LoadingSpinner/> : 'Summarize Chapter'}
                                    </button>
                                    {/* Show first 3 popular perspectives */}
                                    {(['catholic', 'enduring_word', 'historical'] as CommentaryPerspective[]).map(p => (
                                        <button key={p} onClick={() => handleChapterCommentary(p)} disabled={isChapterAnalysisLoading} className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:bg-slate-200 dark:disabled:bg-slate-700 flex items-center justify-center gap-2 transition-colors">
                                           {isChapterAnalysisLoading && chapterAnalysis?.perspective === p ? <LoadingSpinner/> : commentaryPerspectiveLabels[p]}
                                        </button>
                                    ))}
                                </div>

                                {/* Collapsible Additional Perspectives */}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <button
                                        onClick={() => setIsCommentaryExpanded(!isCommentaryExpanded)}
                                        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    >
                                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isCommentaryExpanded ? 'rotate-180' : ''}`} />
                                        {isCommentaryExpanded ? 'Hide' : 'Show'} more scholarly perspectives ({Object.keys(commentaryPerspectiveLabels).length - 3})
                                    </button>

                                    {isCommentaryExpanded && (
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 animate-fade-in">
                                            {(Object.keys(commentaryPerspectiveLabels) as CommentaryPerspective[])
                                                .filter(p => !['catholic', 'enduring_word', 'historical'].includes(p))
                                                .map(p => (
                                                    <button key={p} onClick={() => handleChapterCommentary(p)} disabled={isChapterAnalysisLoading} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:bg-slate-200 dark:disabled:bg-slate-700 flex items-center justify-center gap-2 transition-colors">
                                                       {isChapterAnalysisLoading && chapterAnalysis?.perspective === p ? <LoadingSpinner/> : commentaryPerspectiveLabels[p]}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                                {isChapterAnalysisLoading && <div className="mt-6 flex justify-center"><LoadingSpinner /></div>}
                                {chapterAnalysis && !isChapterAnalysisLoading && (
                                    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6 animate-fade-in">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                                {chapterAnalysis.type === 'summary' ? 'Summary' : `Commentary: ${commentaryPerspectiveLabels[chapterAnalysis.perspective!]}`}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Note: This content is AI-generated and should be used as a study aid.</p>
                                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                            {chapterAnalysis.text}
                                        </div>
                                    </div>
                                )}
                                {chatInstance && !isChapterAnalysisLoading && <ChatInterface chatInstance={chatInstance} />}
                             </div>
                        </section>
                    </div>
                )}
                </main>
            </div>
        </>
    );
};