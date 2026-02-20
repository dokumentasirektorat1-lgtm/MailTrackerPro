'use client';

import { useConfig } from '@/lib/hooks/useConfig';
import { useState, useEffect } from 'react';

interface TopbarProps {
    onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
    const { config } = useConfig();
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Initial theme check
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        }
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <header className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
            <div className="flex items-center justify-between h-20 px-6">

                {/* Left: Mobile Menu & Breadcrumbs/Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:flex relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-64 lg:w-96 pl-10 pr-4 py-2.5 border-none rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
                            placeholder="Mencari surat, pengirim, atau tracking ID..."
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 text-xs border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">

                    {/* Sync Status Badge */}
                    <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${!config
                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        : (config.syncStatus === 'online' || config.syncStatus === 'healthy')
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
                        }`}>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${!config ? 'bg-slate-400' : (config.syncStatus === 'online' || config.syncStatus === 'healthy' ? 'bg-emerald-400' : 'bg-red-400')
                                }`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${!config ? 'bg-slate-500' : (config.syncStatus === 'online' || config.syncStatus === 'healthy' ? 'bg-emerald-500' : 'bg-red-500')
                                }`}></span>
                        </span>
                        <span className="text-xs font-semibold tracking-wide">
                            {!config ? 'INITIALIZING...' : (config.syncStatus === 'online' || config.syncStatus === 'healthy' ? 'DB CONNECTED' : 'OFFLINE')}
                        </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    {/* Notification Bell */}
                    <button className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-surface-dark animate-pulse"></span>
                    </button>

                </div>
            </div>
        </header>
    );
}
