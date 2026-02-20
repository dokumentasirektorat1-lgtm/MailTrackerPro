'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useConfig } from '@/lib/hooks/useConfig';

export default function DashboardHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, isAdmin, user } = useAuth();
    const { config, quotaExceeded, backupMode } = useConfig();
    const [unreadCount, setUnreadCount] = useState(0);

    // ... (existing useEffect)

    const handleManualSync = async () => {
        try {
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            await setDoc(doc(db, 'config', 'sync_trigger'), {
                trigger: true,
                triggeredBy: user?.uid || 'anon',
                timestamp: serverTimestamp()
            }, { merge: true });
            alert("Manual sync signal sent!");
        } catch (e) {
            console.error("Sync trigger failed:", e);
        }
    };

    // Helper to determine status color
    const getStatusColor = () => {
        if (quotaExceeded) return 'bg-yellow-500';
        if (backupMode) return 'bg-orange-500';
        if (config?.syncStatus === 'online' || config?.syncStatus === 'healthy') return 'bg-emerald-500';
        if (config?.backup_json_url) return 'bg-amber-500'; // Legacy Backup Mode
        return 'bg-red-500';
    };

    const getStatusText = () => {
        if (quotaExceeded) return 'Quota Full (Manual Mode)';
        if (backupMode) return 'Backup Mode (JSON)';
        if (config?.syncStatus === 'online' || config?.syncStatus === 'healthy') return 'Online';
        if (config?.backup_json_url) return 'Backup Mode';
        return 'Offline';
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
        { name: 'Directory', href: '/admin/directory', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
        { name: 'Audit Log', href: '/admin/audit', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
        { name: 'Settings', href: '/admin/settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    ];

    return (
        <>
            {(quotaExceeded || backupMode) && (
                <div className={`${backupMode ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'} border-b px-4 py-3`}>
                    <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <span className={`${backupMode ? 'text-orange-600 bg-orange-100' : 'text-yellow-600 bg-yellow-100'} p-1.5 rounded-full`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </span>
                            <p className={`text-sm font-medium ${backupMode ? 'text-yellow-900' : 'text-yellow-800'}`}>
                                <strong>System Notice:</strong> {backupMode ? 'Using Google Drive Backup (Realtime Sync Paused due to Quota)' : 'Daily cloud quota exceeded. detailed updates are paused.'}
                            </p>
                        </div>
                        <button
                            onClick={handleManualSync}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            FORCE SYNC NOW
                        </button>
                    </div>
                </div>
            )}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                {/* ... rest of header ... */}
                {/* Sync Status Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${!quotaExceeded && (config?.syncStatus === 'online' || config?.syncStatus === 'healthy') ? 'animate-pulse' : ''}`}></div>
                    <span className={`text-xs font-semibold ${quotaExceeded ? 'text-yellow-700' :
                        (config?.syncStatus === 'online' || config?.syncStatus === 'healthy' ? 'text-emerald-700' :
                            config?.backup_json_url ? 'text-amber-700' : 'text-red-700')
                        }`}>
                        {getStatusText()}
                    </span>
                </div>

                {/* Notification Bell */}
                <Link href="/admin/audit" className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
                    <span className="sr-only">View notifications</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{profile?.displayName}</p>
                        <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden border-t border-gray-200 px-4 py-2">
                    <nav className="flex gap-1 overflow-x-auto">
                        {navigation && navigation.map((item, idx) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name + idx}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${isActive
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {item.icon}
                                    </svg>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>
        </>
    );
}
