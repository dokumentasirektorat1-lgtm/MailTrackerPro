'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import {
    collection, query, orderBy, onSnapshot, limit
} from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useConfig } from '@/lib/hooks/useConfig';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Swal from 'sweetalert2';

/**
 * Inner component to handle data fetching ONLY when authenticated and authorized.
 * This prevents "Missing or insufficient permissions" errors during initial page load
 * before the authentication state is fully resolved.
 */
function AdminAuditContent() {
    const { user } = useAuth();
    const { config } = useConfig();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Auto-scroll logic
    useEffect(() => {
        const container = document.getElementById('bridge-terminal');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        if (!user) return;
        console.log("Listening to audit_logs...");
        const q = query(collection(db, 'audit_logs'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Audit Logs snapshot received, size:", snapshot.size);
            const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Safer sort
            newLogs.sort((a: any, b: any) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });

            setLogs(newLogs);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Audit Logs error:", err);
            setError(err.message);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const showDiagnostic = (msg: string) => {
        let title = 'System Diagnostic';
        let text = msg;
        let icon: 'error' | 'warning' | 'info' = 'info';

        if (msg.includes('PermissionDenied')) {
            title = 'Security Rule Block';
            text = 'Firestore rejected the request. Please verify that your Security Rules allow the current user or service account to access this collection.';
            icon = 'error';
        } else if (msg.includes('database is unreachable')) {
            title = 'Database Link Lost';
            text = 'The bridge cannot find the MS Access file. Check if the PC is on and the path is correct.';
            icon = 'warning';
        }

        Swal.fire({
            title,
            text,
            icon,
            background: '#1e293b',
            color: '#f8fafc',
            confirmButtonColor: '#3b82f6',
            customClass: {
                popup: 'rounded-2xl border border-slate-700 shadow-2xl shadow-blue-500/10'
            }
        });
    };

    const isSystemError = config?.syncStatus === 'offline' || !!config?.lastError;
    const lastActive = config?.lastActive ? new Date(config.lastActive.seconds * 1000).toLocaleString('id-ID') : 'Never';

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Technical <span className="text-blue-500">Audit</span> Log</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Monitoring kernel events and bridge health sensors</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Refresh Console
                    </button>
                </div>
            </div>

            {/* Dashboard Sensors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    {/* Connection Status Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Sensor Status</h2>
                            <div className={`h-2.5 w-2.5 rounded-full ${config?.syncStatus === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        </div>
                        <div className="p-8 text-center">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${config?.syncStatus === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 uppercase">{config?.syncStatus || 'OFFLINE'}</h3>
                            <p className="text-xs text-slate-500 font-mono mb-6">LAST BEACON: {lastActive}</p>

                            {config?.lastError && (
                                <button
                                    onClick={() => showDiagnostic(config.lastError!)}
                                    className="w-full py-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-200 transition-all border border-red-200 dark:border-red-800/50"
                                >
                                    Deep Diagnostic Required
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="bg-blue-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <h4 className="font-bold text-lg mb-2 relative z-10">Bridge Operations</h4>
                        <p className="text-blue-100 text-sm relative z-10 leading-relaxed mb-4">The background service is currently polling for Google Drive signals every 60 seconds.</p>
                        <div className="text-[10px] font-mono bg-white/20 p-2 rounded relative z-10">
                            ENV: PRODUCTION<br />
                            HOST: LOCAL_MACHINE<br />
                            VERSION: 2.1.0-STABLE
                        </div>
                    </div>
                </div>

                {/* Log Streamer */}
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[520px]">
                    <div className="px-5 py-3 bg-slate-800/80 border-b border-white/5 flex items-center justify-between">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Bridge Terminal Output</span>
                    </div>
                    <div id="bridge-terminal" className="flex-1 p-6 font-mono text-xs text-green-400/90 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-600 italic">Initializing stream...</div>
                        ) : logs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-600 italic">No logs available in database.</div>
                        ) : (
                            [...logs].reverse().map((log, i) => (
                                <div key={log.id} className="hover:bg-white/5 border-l-2 border-transparent hover:border-blue-500 pl-3 transition-colors">
                                    <span className="text-slate-600 mr-4">{(i + 1).toString().padStart(3, '0')}</span>
                                    <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-amber-400' : 'text-green-400/90'}>
                                        [{log.level ? log.level.toUpperCase() : 'INFO'}] {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Event History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Full Event History</h2>
                        <p className="text-xs text-slate-500 mt-1">Real-time sensor data from the bridge engine</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                try {
                                    const { getDocs, collection, query, limit } = await import('firebase/firestore');
                                    const snap = await getDocs(query(collection(db, 'audit_logs'), limit(10)));
                                    Swal.fire({
                                        title: 'Data Probe',
                                        text: `Found ${snap.size} documents in Firestore collection "audit_logs".`,
                                        icon: 'info',
                                        background: '#1e293b',
                                        color: '#f8fafc'
                                    });
                                } catch (e: any) {
                                    Swal.fire({ title: 'Probe Failed', text: e.message, icon: 'error' });
                                }
                            }}
                            className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all"
                        >
                            Direct Data Probe
                        </button>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-500">
                            {logs.length} EVENTS TOTAL
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto overflow-y-auto h-[450px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <table className="w-full text-left relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-widest shadow-sm">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Context</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {error ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-red-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            <p>Snapshot Error: {error}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                        No event history found in the database.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            {log.timestamp && typeof log.timestamp.toDate === 'function'
                                                ? log.timestamp.toDate().toLocaleString('id-ID')
                                                : 'Pending...'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.level === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{log.message}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">{log.userName || 'SYSTEM_CORE'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function AuditLogPage() {
    return (
        <ProtectedRoute requireAdmin>
            <AdminAuditContent />
        </ProtectedRoute>
    );
}
