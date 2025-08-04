
import React from 'react';
import type { GeminiResponse } from '../types';
import { SourceList } from './SourceList';
import { ChatBubbleLeftRightIcon } from './Icons';

interface ResponseDisplayProps {
  response: GeminiResponse;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  return (
    <div className="animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Generated Insight
          </h2>
        </div>
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
          {response.text}
        </div>
        
        {response.sources.length > 0 && (
          <>
            <hr className="my-6 border-slate-200 dark:border-slate-700" />
            <SourceList sources={response.sources} />
          </>
        )}
      </div>
    </div>
  );
};

// Add a simple fade-in animation to tailwind config
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);
