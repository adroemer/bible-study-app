import React, { useState } from 'react';
import { scholars, scholarsBySpecialty } from '../util/scholarsData';
import { XMarkIcon } from './Icons';

interface ContemporariesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Contemporaries: React.FC<ContemporariesProps> = ({ isOpen, onClose }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<'New Testament' | 'Old Testament' | 'Broader'>('New Testament');

  if (!isOpen) return null;

  const filteredScholars = scholarsBySpecialty[selectedSpecialty];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Biblical Scholars & Contemporaries</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Explore insights from prominent biblical scholars mentioned by H.T. Harris. These scholars represent diverse approaches to biblical interpretation, from evangelical perspectives to historical-critical methodologies.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Filter by Field:</label>
            <div className="flex gap-3 flex-wrap">
              {(['New Testament', 'Old Testament', 'Broader'] as const).map(specialty => (
                <button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSpecialty === specialty
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {specialty === 'Broader' ? 'Old Testament & Broader Studies' : specialty}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {filteredScholars.map(scholar => (
              <div
                key={scholar.id}
                className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600/50 transition-colors"
              >
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{scholar.name}</h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{scholar.specialty}</p>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{scholar.description}</p>
                {scholar.notableFocus && scholar.notableFocus.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {scholar.notableFocus.map(focus => (
                      <span
                        key={focus}
                        className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Note:</span> These scholars represent a spectrum of theological perspectives and methodologies in biblical scholarship. Including both evangelical and critical approaches provides a comprehensive view of contemporary biblical interpretation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
