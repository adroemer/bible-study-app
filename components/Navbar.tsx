import React from 'react';
import { BookOpenIcon, SparklesIcon } from './Icons';

export type Page = 'insight' | 'explorer';

interface NavbarProps {
    page: Page;
    setPage: (page: Page) => void;
    onLogout?: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, icon, label }) => {
    const baseClasses = "flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800";
    const activeClasses = "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300";
    const inactiveClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {icon}
            {label}
        </button>
    );
};

export const Navbar: React.FC<NavbarProps> = ({ page, setPage, onLogout }) => {
    return (
        <nav className="border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-4 mx-auto">
                     <NavButton
                        isActive={page === 'insight'}
                        onClick={() => setPage('insight')}
                        icon={<SparklesIcon className="h-5 w-5" />}
                        label="Theologian's Insight"
                    />
                    <NavButton
                        isActive={page === 'explorer'}
                        onClick={() => setPage('explorer')}
                        icon={<BookOpenIcon className="h-5 w-5" />}
                        label="Bible Explorer"
                    />
                </div>
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="ml-4 px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
};