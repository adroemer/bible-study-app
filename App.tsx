
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { fetchGroundedResponse } from './services/secureApiService';
import type { GeminiResponse } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ResponseDisplay } from './components/ResponseDisplay';
import { ErrorAlert } from './components/ErrorAlert';
import { BookOpenIcon, SparklesIcon } from './components/Icons';
import { BibleExplorer } from './components/BibleExplorer';
import { Navbar, type Page } from './components/Navbar';
import { Login } from './components/Login';
import { MemoryService, type StudyMemoryState } from './services/memoryService';

const InsightPage: React.FC = () => {
  // Initialize state from memory
  const memoryState = useMemo(() => MemoryService.loadStudyState(), []);
  
  const [query, setQuery] = useState<string>(memoryState.lastQuery || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GeminiResponse | null>(memoryState.lastResponse || null);

  // Save query to memory when it changes
  useEffect(() => {
    if (query.trim()) {
      const currentState = MemoryService.loadStudyState();
      MemoryService.saveStudyState({
        ...currentState,
        lastQuery: query
      });
    }
  }, [query]);

  const handleReset = useCallback(() => {
    setQuery('');
    setError(null);
    setResponse(null);
    MemoryService.clearStudyState();
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      setError("Please enter a topic or question.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await fetchGroundedResponse(query);
      setResponse(result);
      
      // Save response to memory
      const currentState = MemoryService.loadStudyState();
      MemoryService.saveStudyState({
        ...currentState,
        lastQuery: query,
        lastResponse: {
          response: result.response,
          sources: result.sources,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <>
      <header className="text-center mb-8">
        <div className="flex justify-between items-start mb-2">
          <div></div> {/* Spacer for centering */}
          <div className="inline-flex items-center gap-3">
            <SparklesIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              F3 Bible Study
            </h1>
          </div>
          <button
            onClick={handleReset}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-3 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Reset
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Explore biblical topics with insights from prominent Christian voices, powered by Azure OpenAI.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Explain the concept of grace..."
          className="w-full h-32 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow duration-200 resize-none"
          disabled={isLoading}
          aria-label="Topic or question input"
        />
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Thinking...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Seek Insight
            </>
          )}
        </button>
      </form>
      <div className="mt-8">
        {error && <ErrorAlert message={error} />}
        {response && <ResponseDisplay response={response} />}
      </div>
    </>
  );
}


const App: React.FC = () => {
  const [page, setPage] = useState<Page>('explorer');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            <Navbar page={page} setPage={setPage} onLogout={handleLogout} />
            <div className="mt-8">
              {page === 'insight' && <InsightPage />}
              {page === 'explorer' && <BibleExplorer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
