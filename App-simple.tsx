import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8">
          <header className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Theologian's Insight
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-4">
              Bible Study App - Testing Basic Loading
            </p>
          </header>
          
          <div className="text-center">
            <p className="text-lg text-slate-700 dark:text-slate-300">
              ✅ React is working!
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Environment: {typeof process !== 'undefined' ? 'Node' : 'Browser'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              API Key: {process.env.AZURE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Endpoint: {process.env.AZURE_OPENAI_ENDPOINT ? '✅ Set' : '❌ Missing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;