
import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative" role="alert">
      <div className="flex items-center">
        <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
        <div>
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{message}</span>
        </div>
      </div>
    </div>
  );
};
