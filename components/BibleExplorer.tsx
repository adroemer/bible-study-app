
import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { BibleBook, BibleChapter, CommentaryPerspective, BibleTranslation, BibleVerse } from '../types';
import { chronologicalBooks, alphabeticalBooks } from '../util/bibleBooks';
import { fetchChapter } from '../services/bibleService';
import { summarizeChapter, generateChapterCommentary, createScriptureChat, generateSelectionCommentary } from '../services/azureOpenAIService';
import { ErrorAlert } from './ErrorAlert';
import { LoadingSpinner } from './LoadingSpinner';
import { ArrowsRightLeftIcon, BookOpenIcon, ChatBubbleLeftRightIcon } from './Icons';
import { ChatInterface } from './ChatInterface';

type SortOrder = 'chrono' | 'alpha';

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

    const count = chapterCounts[bookName] || 0;

    return (
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
            {Array.from({ length: count }, (_, i) => i + 1).map(chapter => (
                <button key={chapter} onClick={() => onSelectChapter(chapter)} className="aspect-square flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
                    {chapter}
                </button>
            ))}
        </div>
    );
};

const commentaryPerspectiveLabels: Record<CommentaryPerspective, string> = {
    catholic: 'Catholic Perspective',
    enduring_word: 'Enduring Word Style',
    historical: 'Historical Theologian'
};


export const BibleExplorer: React.FC = () => {
    const [sortOrder, setSortOrder] = useState<SortOrder>('chrono');
    const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [translation, setTranslation] = useState<BibleTranslation>('web');
    const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [chapterAnalysis, setChapterAnalysis] = useState<{ type: 'summary' | 'commentary', text: string, perspective?: CommentaryPerspective } | null>(null);
    const [isChapterAnalysisLoading, setIsChapterAnalysisLoading] = useState(false);
    
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [selectionAnalysis, setSelectionAnalysis] = useState<{ text: string, perspective: CommentaryPerspective } | null>(null);
    const [isSelectionAnalysisLoading, setIsSelectionAnalysisLoading] = useState(false);

    const [chatInstance, setChatInstance] = useState<{ sendMessage: (message: string) => Promise<string> } |
    null>(null);

    const mainContentRef = useRef<HTMLDivElement>(null);

    const books = useMemo(() => (sortOrder === 'chrono' ? chronologicalBooks : alphabeticalBooks), [sortOrder]);

    const handleSelectBook = (book: BibleBook) => {
        setSelectedBook(book);
        setSelectedChapter(null);
        setChapterData(null);
        setChapterAnalysis(null);
        setChatInstance(null);
        setSelectedText(null);
        setSelectionAnalysis(null);
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
        if (!chapterData) return;
        setIsChapterAnalysisLoading(true);
        setChapterAnalysis(null);
        setChatInstance(null);
        try {
            const summary = await summarizeChapter(chapterData.text, chapterData.reference);
            setChapterAnalysis({ type: 'summary', text: summary });
            setChatInstance(createScriptureChat(chapterData.reference, chapterData.text));
        } catch (err) {
            setError(err instanceof Error ? `Failed to get summary: ${err.message}`: 'Unknown error');
        } finally {
            setIsChapterAnalysisLoading(false);
        }
    }

    const handleChapterCommentary = async (perspective: CommentaryPerspective) => {
        if (!chapterData) return;
        setIsChapterAnalysisLoading(true);
        setChapterAnalysis(null);
        setChatInstance(null);
        try {
            const commentary = await generateChapterCommentary(chapterData.text, chapterData.reference, perspective);
            setChapterAnalysis({ type: 'commentary', text: commentary, perspective });
            setChatInstance(createScriptureChat(chapterData.reference, chapterData.text));
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
        if (!selectedText || !chapterData) return;
        setIsSelectionAnalysisLoading(true);
        setSelectionAnalysis(null);
        try {
            const commentary = await generateSelectionCommentary(selectedText, chapterData.reference, perspective);
            setSelectionAnalysis({ text: commentary, perspective });
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


    return (
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
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

            <main ref={mainContentRef} className="lg:col-span-2">
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
                
                {isLoading && <div className="mt-8 flex justify-center"><LoadingSpinner /></div>}

                {chapterData && !isLoading && (
                    <div className="mt-8 animate-fade-in">
                        <article className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                            <header className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{chapterData.reference}</h3>
                                    <div className="sm:w-1/2 lg:w-1/3">
                                         <label htmlFor="translation-select" className="sr-only">Translation</label>
                                         <select 
                                            id="translation-select"
                                            value={translation}
                                            onChange={handleTranslationChange}
                                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                        >
                                            <option value="web">World English Bible</option>
                                            <option value="kjv">King James Version</option>
                                            <option value="bbe">Bible in Basic English</option>
                                            <option value="asv">American Standard Version</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Translation: {chapterData.translation_name}</p>
                            </header>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-serif leading-relaxed" onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection}>
                                {chapterData.verses.map(verse => (
                                    <span key={verse.verse} className="mr-1">
                                        <sup className="text-primary-600 dark:text-primary-400 font-sans font-bold text-xs mr-1">{verse.verse}</sup>
                                        {verseText(verse)}
                                    </span>
                                ))}
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
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <button onClick={handleSummarize} disabled={isChapterAnalysisLoading} className="w-full px-4 py-2 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 flex items-center justify-center gap-2">
                                        {isChapterAnalysisLoading && !chapterAnalysis ? <LoadingSpinner/> : 'Summarize Chapter'}
                                    </button>
                                    
                                    {(Object.keys(commentaryPerspectiveLabels) as CommentaryPerspective[]).map(p => (
                                        <button key={p} onClick={() => handleChapterCommentary(p)} disabled={isChapterAnalysisLoading} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:border-slate-400 disabled:bg-slate-200 dark:disabled:bg-slate-700 flex items-center justify-center gap-2">
                                           {isChapterAnalysisLoading && chapterAnalysis?.perspective === p ? <LoadingSpinner/> : commentaryPerspectiveLabels[p]}
                                        </button>
                                    ))}
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
    );
};