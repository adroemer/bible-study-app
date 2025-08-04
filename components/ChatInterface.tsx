
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { PaperAirplaneIcon } from './Icons';

interface ChatInterfaceProps {
  chatInstance: {
    sendMessage: (message: string) => Promise<string>;
  };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatInstance }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatHistoryRef.current?.scrollTo(0, chatHistoryRef.current.scrollHeight);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = { author: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const result = await chatInstance.sendMessage(userInput);
      const aiMessage: ChatMessage = { author: 'ai', text: result };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { author: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Chat About This Chapter</h3>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-96 flex flex-col">
        <div ref={chatHistoryRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.author === 'ai' && <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>}
              <div className={`max-w-md p-3 rounded-2xl ${msg.author === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
                <div className="max-w-md p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none">
                    <LoadingSpinner />
                </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow duration-200"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
            <PaperAirplaneIcon className="h-5 w-5"/>
          </button>
        </form>
      </div>
    </div>
  );
};
