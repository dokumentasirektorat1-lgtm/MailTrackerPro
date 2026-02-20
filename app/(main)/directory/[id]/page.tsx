'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMailById, MailDocument } from '@/lib/firebase/firestore';

export default function MailDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [mail, setMail] = useState<MailDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMail = async () => {
            try {
                const mailData = await getMailById(params.id);
                if (mailData) {
                    setMail(mailData);
                } else {
                    setError('Mail not found');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load mail');
            } finally {
                setLoading(false);
            }
        };

        fetchMail();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="text-center">
                    <div className="loader mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading mail details...</p>
                </div>
            </div>
        );
    }

    if (error || !mail) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-red-900 mb-2">Error Loading Mail</h2>
                    <p className="text-red-700 mb-6">{error || 'Mail not found'}</p>
                    <Link href="/directory" className="btn-primary inline-block">
                        Back to Directory
                    </Link>
                </div>
            </div>
        );
    }

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object' && value.seconds) {
            return new Date(value.seconds * 1000).toLocaleString();
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    // Get all fields except technical ones
    const displayFields = Object.keys(mail).filter(
        (key) => !['id', 'year', 'accessId', 'attachments'].includes(key)
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6 animate-fade-in">
                <Link
                    href="/directory"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Directory
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mail Details</h1>
                <p className="text-gray-600">Document ID: <span className="font-mono font-semibold">{mail.id}</span></p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mail Information */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 animate-slide-up">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Information
                        </h2>

                        <div className="space-y-4">
                            {displayFields.map((field) => (
                                <div key={field} className="border-b border-gray-200 pb-3 last:border-0">
                                    <label className="text-sm font-medium text-gray-600 block mb-1 capitalize">
                                        {field.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <p className="text-gray-900 break-words">{formatValue(mail[field])}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-primary-50 rounded-xl p-4 mt-4 border border-primary-200">
                        <h3 className="text-sm font-semibold text-primary-900 mb-2">Metadata</h3>
                        <div className="space-y-1 text-xs text-primary-700">
                            <p><strong>Year:</strong> {mail.year}</p>
                            <p><strong>Access ID:</strong> {mail.accessId}</p>
                            <p><strong>Composite ID:</strong> {mail.id}</p>
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Attachments
                        </h2>

                        {!mail.attachments || mail.attachments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p>No attachments available</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mail.attachments.map((attachment, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Attachment Header */}
                                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{attachment.fileName}</p>
                                                    <p className="text-xs text-gray-500">PDF Document</p>
                                                </div>
                                            </div>
                                            <a
                                                href={attachment.driveViewLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                Open in Drive
                                            </a>
                                        </div>

                                        {/* Google Drive Viewer Embed */}
                                        <div className="relative bg-gray-100" style={{ height: '600px' }}>
                                            <iframe
                                                src={`https://drive.google.com/file/d/${attachment.driveFileId}/preview`}
                                                className="w-full h-full"
                                                allow="autoplay"
                                                title={attachment.fileName}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
