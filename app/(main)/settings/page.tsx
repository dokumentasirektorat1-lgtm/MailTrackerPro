'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useConfig } from '@/lib/hooks/useConfig';
import { updateSystemConfig } from '@/lib/firebase/firestore';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { config, loading } = useConfig();
    const [formData, setFormData] = useState({
        accessDbPath: '',
        driveFolderId: '',
        driveApiKey: '',
        backup_json_url: '',
        targetYear: new Date().getFullYear().toString(),
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (config) {
            setFormData({
                accessDbPath: config.accessDbPath || '',
                driveFolderId: config.driveFolderId || '',
                driveApiKey: config.driveApiKey || '',
                backup_json_url: config.backup_json_url || '',
                targetYear: config.targetYear?.toString() || new Date().getFullYear().toString(),
            });
        }
    }, [config]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Trim whitespace and validate path
            const trimmedPath = formData.accessDbPath.trim();

            const dataToSave = {
                ...formData,
                accessDbPath: trimmedPath,
                driveFolderId: formData.driveFolderId.trim(),
                driveApiKey: formData.driveApiKey.trim(),
                backup_json_url: formData.backup_json_url.trim(),
                targetYear: parseInt(formData.targetYear) || new Date().getFullYear(),
            };

            console.log('Saving config:', dataToSave);

            const success = await updateSystemConfig(dataToSave);

            if (success) {
                toast.success('Settings Saved!', {
                    description: 'Configuration updated. The Bridge will sync changes to Google Drive automatically.'
                });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error('Save Failed', {
                description: error.message || 'Failed to save settings'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (loading) {
        return (
            <ProtectedRoute requireAdmin>
                <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                    <div className="loader"></div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requireAdmin>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">System Settings</h1>
                    <p className="text-slate-600 dark:text-slate-400">Unified Configuration for MailTrackerPro</p>
                </div>

                {/* Sync Status */}
                <div className={`rounded-xl p-6 mb-6 border animate-slide-up transition-colors duration-300 ${config?.syncStatus === 'online'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${config?.syncStatus === 'online' ? 'bg-emerald-100 dark:bg-emerald-800/30' : 'bg-red-100 dark:bg-red-800/30'
                            }`}>
                            <svg className={`w-6 h-6 ${config?.syncStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-semibold text-lg mb-1 ${config?.syncStatus === 'online' ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                                Bridge Status: <span className="capitalize">{config?.syncStatus || 'Unknown'}</span>
                            </h3>
                            {config?.lastSyncAt && (
                                <p className={`text-sm ${config?.syncStatus === 'online' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                    Last sync: {new Date(config.lastSyncAt.seconds * 1000).toLocaleString()}
                                </p>
                            )}
                            <p className={`text-xs mt-2 ${config?.syncStatus === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {config?.syncStatus === 'online'
                                    ? '✓ Bridge is actively monitoring for changes'
                                    : '✗ Bridge is offline or database is unreachable'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-slide-up transition-colors duration-300" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* MS Access Database Path */}
                        <div>
                            <label htmlFor="accessDbPath" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                MS Access Database Path
                            </label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                Full path to the .accdb file. This path will be synced to <code>config.json</code> on Google Drive.
                            </p>
                            <input
                                type="text"
                                id="accessDbPath"
                                name="accessDbPath"
                                value={formData.accessDbPath}
                                onChange={handleChange}
                                placeholder="F:\Folder\Database.accdb"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                required
                            />
                        </div>

                        {/* Target Year */}
                        <div>
                            <label htmlFor="targetYear" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                Active Sync Year
                            </label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                The specific year to sync from the MS Access Database. This tells the bridge which table to scan (e.g., 2026).
                            </p>
                            <input
                                type="number"
                                id="targetYear"
                                name="targetYear"
                                value={formData.targetYear}
                                onChange={handleChange}
                                placeholder="2026"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                required
                            />
                        </div>

                        {/* Backup JSON URL */}
                        <div>
                            <label htmlFor="backup_json_url" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                Google Drive Backup Link (JSON)
                            </label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                Public Link to <code>latest_data.json</code> generated by the Bridge. Used for "Yellow/Backup Mode".
                            </p>
                            <input
                                type="text"
                                id="backup_json_url"
                                name="backup_json_url"
                                value={formData.backup_json_url}
                                onChange={handleChange}
                                placeholder="https://www.googleapis.com/drive/v3/files/..."
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>

                        {/* Google Drive Folder ID */}
                        <div>
                            <label htmlFor="driveFolderId" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                Google Drive Folder ID
                            </label>
                            <input
                                type="text"
                                id="driveFolderId"
                                name="driveFolderId"
                                value={formData.driveFolderId}
                                onChange={handleChange}
                                placeholder="1a2b3c4d5e6f7g8h9i0j"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>

                        {/* Google Drive API Key (Optional) */}
                        <div>
                            <label htmlFor="driveApiKey" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                Google Drive API Key <span className="text-slate-500 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                id="driveApiKey"
                                name="driveApiKey"
                                value={formData.driveApiKey}
                                onChange={handleChange}
                                rows={3}
                                placeholder="AIzaSy..."
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm resize-none text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>

                        {/* Credentials Guide */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Bridge Configuration Guide</h3>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <details className="group">
                                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                        <span>How to setup credentials.json?</span>
                                        <span className="transition group-open:rotate-180">
                                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <div className="text-slate-600 dark:text-slate-400 group-open:animate-fadeIn p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-sm space-y-3">
                                        <p>The Python Bridge requires a <strong>credentials.json</strong> file to authenticate with your Google Drive. Follow these steps:</p>
                                        <ol className="list-decimal list-inside space-y-1 ml-1">
                                            <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google Cloud Console</a>.</li>
                                            <li>Create a new Project (or select existing).</li>
                                            <li>Go to <strong>APIs & Services {'>'} Library</strong> and enable <strong>Google Drive API</strong>.</li>
                                            <li>Go to <strong>APIs & Services {'>'} Credentials</strong>.</li>
                                            <li>Click <strong>Create Credentials {'>'} OAuth client ID</strong>.</li>
                                            <li>Select <strong>Desktop app</strong> as Application type.</li>
                                            <li>Download the JSON file, rename it to <code>credentials.json</code>.</li>
                                            <li>Place this file in your project folder: <code>MailTrackerPro/bridge/credentials.json</code>.</li>
                                        </ol>
                                        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded text-xs border border-amber-200 dark:border-amber-800">
                                            <strong>Note:</strong> On first run, a browser window will open asking you to login to your Google Account. This generates a <code>token.json</code> file for future automatic logins.
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4">
                            <div className="flex gap-3">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                    <p className="font-semibold mb-1">Unified Configuration:</p>
                                    <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                                        <li>• Settings saved here are synced to Firestore.</li>
                                        <li>• The Python Bridge reads Firestore and updates <code>config.json</code> on Drive.</li>
                                        <li>• If connection is lost, the Web App attempts to read from the Backup Link.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Settings
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}
