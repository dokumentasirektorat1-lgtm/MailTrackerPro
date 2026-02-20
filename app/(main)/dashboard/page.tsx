'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useConfig } from '@/lib/hooks/useConfig';
import { getAvailableYears, getMailsByYear, resetSystemStatus } from '@/lib/firebase/firestore';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

export default function DashboardPage() {
    const { profile } = useAuth();
    const { config } = useConfig();
    const [stats, setStats] = useState({
        totalMails: 0,
        incoming: 0,
        inProcess: 0,
        completed: 0,
        pendingUsers: 0,
        activeUsers: 0,
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [activeUsersList, setActiveUsersList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Explicitly track if we utilized backup data
    const [isUsingBackup, setIsUsingBackup] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Determine which year to fetch
                const years = await getAvailableYears();
                const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
                console.log(`fetching dashboard data for year: ${latestYear}`);

                // 2. Parallel fetching
                const [mails, usersSnap] = await Promise.all([
                    getMailsByYear(latestYear),
                    getDocs(query(collection(db, 'users'), where('status', '==', 'approved')))
                ]);

                // --- BACKUP DETECTION LOGIC ---
                // If config says offline (or is missing) but we have mails, it means we likely got them from backup.
                // We can't know for sure unless getMailsByYear returns metadata, but we can check the config status.
                // Or if we modify getMailsByYear to return { data: [], source: 'firestore' | 'backup' } 
                // For now, rely on standard inference:
                if (config && config.syncStatus !== 'online' && mails.length > 0) {
                    setIsUsingBackup(true);
                } else if (!config && mails.length > 0) {
                    setIsUsingBackup(true);
                } else {
                    setIsUsingBackup(false);
                }

                // Calculate Mail Stats
                let incoming = 0;
                let inProcess = 0;
                let completed = 0;

                mails.forEach((mail: any) => {
                    // Normalize keys (handle case sensitivity or variations)
                    const status = (mail.Status || mail.status || mail.STATUS || '').toLowerCase();

                    if (status.includes('selesai') || status.includes('complete') || status.includes('arsip')) completed++;
                    else if (status.includes('proses') || status.includes('process') || status.includes('tindak')) inProcess++;
                    else incoming++;
                });

                // Calculate User Stats
                const activeUsers = usersSnap.size;
                const recentUsersData = usersSnap.docs.slice(0, 3).map(doc => doc.data());
                setActiveUsersList(recentUsersData);

                // Pending Users (Admin only)
                let pendingUsers = 0;
                if (profile?.role === 'admin') {
                    // In Backup mode, this might fail if Firestore is totally down.
                    // Wrap in try/catch to be safe
                    try {
                        const pendingSnap = await getDocs(query(collection(db, 'users'), where('status', '==', 'pending')));
                        pendingUsers = pendingSnap.size;
                    } catch (e) { console.log('Pending users fetch failed (offline)'); }
                }

                setStats({
                    totalMails: mails.length,
                    incoming,
                    inProcess,
                    completed,
                    pendingUsers,
                    activeUsers
                });

                // Recent Activity
                const sortedMails = [...mails].sort((a, b) => {
                    // Safety check for date objects which might differ in structure (Firestore Timestamp vs JSON object)
                    const getSeconds = (obj: any) => {
                        if (!obj) return 0;
                        if (obj.seconds) return obj.seconds; // Firestore or Mock Timestamp
                        if (obj instanceof Date) return Math.floor(obj.getTime() / 1000);
                        return 0;
                    };

                    const timeA = getSeconds(a['TANGGAL SURAT DITERIMA'] || a.date);
                    const timeB = getSeconds(b['TANGGAL SURAT DITERIMA'] || b.date);

                    if (timeA !== timeB) return timeB - timeA;

                    const idA = parseInt(String(a.accessId || a['NO URUT'] || 0).replace(/\D/g, ''));
                    const idB = parseInt(String(b.accessId || b['NO URUT'] || 0).replace(/\D/g, ''));
                    return idB - idA;
                });

                const recent = sortedMails.slice(0, 5).map((mail: any) => ({
                    id: mail.id,
                    trackingId: (() => {
                        const noUrut = mail['NO URUT'] || mail.accessId || '-';
                        return `${latestYear}_${noUrut}`;
                    })(),
                    subject: mail.PERIHAL || mail.Perihal || mail.Subject || mail.subject || 'No Subject',
                    status: mail.Status || mail.status || 'Pending',
                    timestamp: (() => {
                        const val = mail['TANGGAL SURAT DITERIMA'] || mail.date;
                        if (val) {
                            // Handle Firestore Timestamp or JSON mock {seconds, nanoseconds}
                            const seconds = val.seconds || (val instanceof Date ? Math.floor(val.getTime() / 1000) : 0);
                            if (seconds) {
                                return new Date(seconds * 1000).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                });
                            }
                        }
                        return 'N/A';
                    })()
                }));
                setRecentActivity(recent);

            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [profile, config]); // Re-run if config changes (e.g. status updates)

    // Determine Status Logic (Revised)
    const getSystemStatus = () => {
        if (!config && loading) return 'loading';

        // Priority 1: Config says Online or Healthy
        if (config?.syncStatus === 'online' || config?.syncStatus === 'healthy') return 'online';

        // Priority 2: Detected Backup Usage (Data loaded despite offline)
        if (isUsingBackup) return 'backup';

        // Priority 3: Config indicates backup available even if not yet loaded
        if (config?.backup_json_url) return 'backup'; // Optimistic backup status

        return 'offline';
    };

    const status = getSystemStatus();

    if (loading && !stats.totalMails) { // Only show full loader if no data
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0ea5e9]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header / Title Section */}
            <div className="md:flex md:items-center md:justify-between animate-fade-in">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Dashboard Overview
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Monitor mail operations and database synchronization status.
                    </p>
                </div>
            </div>

            {/* Sync Monitor Hero Card */}
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-slide-up">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                    <svg className="w-32 h-32 text-[#0ea5e9]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm8 11h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                </div>
                <div className="p-6 md:p-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">MS Access Sync Monitor</h3>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${status === 'online' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : status === 'backup' ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${status === 'online' ? 'bg-emerald-500 animate-pulse'
                                        : status === 'backup' ? 'bg-amber-500'
                                            : 'bg-red-500'
                                        }`}></span>
                                    {status === 'online' ? 'Active' : status === 'backup' ? 'Backup Mode' : 'Offline'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                                {status === 'online' ? 'Connection to legacy database is stable. Real-time synchronization is active.' :
                                    status === 'backup' ? 'Primary connection lost. displaying cached data from Google Drive Backup. Some recent changes may be delayed.' :
                                        'Connection interrupted. Database is unreachable.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right border-r border-slate-200 dark:border-slate-700 pr-6 hidden sm:block">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">Last Successful Sync</p>
                                <p className="text-lg font-medium text-slate-900 dark:text-white font-mono mt-0.5">
                                    {config?.lastSyncAt ? new Date(config.lastSyncAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                </p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">Engine Version</p>
                                <p className="text-lg font-medium text-slate-900 dark:text-white font-mono mt-0.5">v2.1.0</p>
                            </div>

                            {/* Sync Manual Button - Always visible now, even in backup mode */}
                            <button
                                className={`ml-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors border ${status === 'online'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0ea5e9] hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600'
                                    }`}
                                onClick={() => {
                                    // Trigger Logic (Could be implemented later via Firestore signal)
                                    toast.info("Sync signal sent! (This feature requires Bridge Listener)");
                                }}
                            >
                                <svg className={`mr-2 h-5 w-5 ${status === 'online' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {status === 'online' ? 'Syncing...' : 'Force Sync'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-700">
                    <div className={`h-1 w-full shadow-[0_0_10px_rgba(16,185,129,0.3)] ${status === 'online' ? 'bg-emerald-500 animate-pulse'
                        : status === 'backup' ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}></div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {/* Total Mail Volume */}
                <div className="overflow-hidden rounded-xl bg-white dark:bg-[#1e293b] px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow sm:p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                            <svg className="h-6 w-6 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Mail Volume</dt>
                                <dd>
                                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.totalMails.toLocaleString()}</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="flex items-center text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            Mail Count
                        </span>
                    </div>
                </div>

                {/* Processing Queue */}
                <div className="overflow-hidden rounded-xl bg-white dark:bg-[#1e293b] px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow sm:p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
                            <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Processing Queue</dt>
                                <dd>
                                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.inProcess.toLocaleString()}</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="flex items-center text-slate-500 dark:text-slate-400">
                            In Progress
                        </span>
                    </div>
                </div>

                {/* Active Users */}
                <div className="overflow-hidden rounded-xl bg-white dark:bg-[#1e293b] px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow sm:p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3">
                            <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Active Users</dt>
                                <dd>
                                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.activeUsers.toLocaleString()}</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <div className="flex -space-x-2 overflow-hidden">
                            {activeUsersList.length > 0 ? (
                                activeUsersList.map((user, index) => (
                                    <div key={user.uid || index} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#1e293b] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </div>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400">No active users</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sync Errors */}
                <div className="overflow-hidden rounded-xl bg-white dark:bg-[#1e293b] px-4 py-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow sm:p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Sync Errors</dt>
                                <dd>
                                    <div className={`text-2xl font-semibold ${config?.lastError ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                        {config?.lastError ? 1 : 0}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className={`flex items-center font-medium ${status === 'online' ? 'text-emerald-600' : status === 'backup' ? 'text-amber-600' : 'text-red-600 dark:text-red-400'}`}>
                            {status === 'online' ? 'System Healthy' : status === 'backup' ? 'Running on Backup' : 'Connection Error'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Table & Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {/* Recent Activity Table (2 cols) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Mail Activity</h3>
                        <Link className="text-sm font-medium text-[#0ea5e9] hover:text-[#0284c7] transition-colors" href="/directory">View all</Link>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">No Urut</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perihal</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Diterima</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-[#1e293b]">
                                {recentActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No recent activity</td>
                                    </tr>
                                ) : (
                                    recentActivity.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white font-mono">{activity.trackingId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={activity.subject}>{activity.subject}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${activity.status.toLowerCase().includes('deliv') || activity.status.toLowerCase().includes('selesai')
                                                    ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400'
                                                    : activity.status.toLowerCase().includes('proc') || activity.status.toLowerCase().includes('pros')
                                                        ? 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {activity.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400 font-mono">{activity.timestamp}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Panel (1 col) */}
                <div className="space-y-6">
                    {/* Database Connection */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Database Connection</h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                </div>
                                <div className="ml-3 w-full">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Legacy_Mail_DB.accdb</p>
                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${status === 'online' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                            : status === 'backup' ? 'bg-amber-50 text-amber-600'
                                                : 'bg-red-50 text-red-600'
                                            }`}>
                                            {status === 'online' ? 'Online' : status === 'backup' ? 'Backup' : 'Offline'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono truncate" title={config?.accessDbPath}>{config?.accessDbPath || 'Wait for sync...'}</p>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                                        <div className={`h-1.5 rounded-full ${status === 'online' ? 'bg-[#0ea5e9]' : status === 'backup' ? 'bg-amber-500' : 'bg-red-500'
                                            }`} style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Controls - Visible only to Admins */}
                    {profile?.role === 'admin' && (
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg shadow-slate-900/10 p-6 text-white overflow-hidden relative">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0ea5e9]/20 rounded-full blur-3xl"></div>
                            <h3 className="text-base font-semibold mb-4 relative z-10 text-white">Admin Controls</h3>
                            <div className="space-y-3 relative z-10">
                                {/* Links */}
                                <Link href="/admin/audit" className="w-full group flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/5">
                                    <span className="flex items-center text-slate-200">
                                        <svg className="mr-3 h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        View Error Logs
                                    </span>
                                    <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>

                                <Link href="/admin/users" className="w-full group flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/5">
                                    <span className="flex items-center text-slate-200">
                                        <svg className="mr-3 h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        User Permissions
                                    </span>
                                    <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>

                                <Link href="/settings" className="w-full group flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/5">
                                    <span className="flex items-center text-slate-200">
                                        <svg className="mr-3 h-5 w-5 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        </svg>
                                        System Settings
                                    </span>
                                    <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
