
import React from 'react';
import type { Source } from '../types';
import { LinkIcon } from './Icons';

interface SourceListProps {
  sources: Source[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
        Sources
      </h3>
      <ul className="space-y-2">
        {sources.map((source, index) => (
          <li key={index} className="flex items-start gap-3">
            <LinkIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-1 flex-shrink-0" />
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline break-words"
              title={source.uri}
            >
              {source.title || source.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
