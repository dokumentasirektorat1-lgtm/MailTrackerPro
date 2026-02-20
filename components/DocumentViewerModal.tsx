'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Disclosure } from '@headlessui/react';

interface Attachment {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'excel' | 'image' | 'doc' | 'other';
    url: string;
}

interface EventInfo {
    date: string;
    time: string;
    place: string;
}

interface MailDetail {
    id: string;
    trackingId: string;
    subject: string;
    sender: string;
    receivedDate: string;
    status: string;
    category: string;
    processedBy?: string;
    notes?: string;
    catatan_tambahan?: string;
    attachments: Attachment[];
    eventInfo?: EventInfo;
}

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    mail: MailDetail | null;
}

const getFileIcon = (type: string) => {
    switch (type) {
        case 'pdf':
            return (
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                </div>
            );
        case 'excel':
            return (
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0 border border-green-100 dark:border-green-800">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                </div>
            );
        case 'image':
            return (
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-800">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                </div>
            );
    }
};

const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let badge = 'bg-slate-100 text-slate-700 ring-slate-600/20'; // Default

    if (s.includes('selesai') || s.includes('delivered') || s.includes('complete')) {
        badge = 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 ring-green-600/20';
    } else if (s.includes('proses') || s.includes('process') || s.includes('transit')) {
        badge = 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20';
    } else if (s.includes('pending') || s.includes('tunggu')) {
        badge = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20';
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${badge}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {status.toUpperCase()}
        </span>
    );
};

export default function DocumentViewerModal({ isOpen, onClose, mail }: DocumentViewerModalProps) {
    const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(null);
    const [iframeLoading, setIframeLoading] = useState(true);

    useEffect(() => {
        if (mail?.attachments && mail.attachments.length > 0) {
            setActiveAttachment(mail.attachments[0]);
        } else {
            setActiveAttachment(null);
        }
    }, [mail]);

    useEffect(() => {
        if (activeAttachment) {
            setIframeLoading(true);
        }
    }, [activeAttachment]);

    if (!mail) return null;

    // Convert view link to preview link for embedding
    const getEmbedUrl = (url: string) => {
        if (!url) return '';

        // Handle Google Drive Links
        if (url.includes('drive.google.com')) {
            // Case 1: Already a preview link
            if (url.includes('/preview')) return url;

            // Case 2: Use file ID if available (most robust)
            // Extract ID from: .../d/FILE_ID/... or id=FILE_ID
            const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
            }

            // Case 3: Fallback replacement
            return url.replace(/\/view.*/, '/preview')
                .replace(/\/edit.*/, '/preview')
                .replace(/export=download/, '');
        }

        return url;
    };

    // New Helper: Get View URL (Open in New Tab)
    const getViewUrl = (url: string) => {
        if (!url) return '#';
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/file/d/${idMatch[1]}/view?usp=drivesdk`;
        }
        return url;
    };

    // New Helper: Get Download URL
    const getDownloadUrl = (url: string) => {
        if (!url) return '#';
        // If it's already a download link, return it
        if (url.includes('export=download')) return url;

        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
        }
        return url;
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-7xl h-[90vh] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                                {/* Modal Header */}
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-surface-dark z-10">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-primary shadow-sm">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                                                {mail.subject}
                                            </Dialog.Title>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                                                <span className="flex items-center gap-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    #{mail.trackingId}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">From: {mail.sender}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                {getStatusBadge(mail.status)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4 self-start">
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body: Split View */}
                                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                                    {/* Main Viewer Area - Desktop Only */}
                                    <div className="hidden md:flex flex-1 bg-slate-100 dark:bg-background-dark relative flex-col overflow-hidden">
                                        {activeAttachment ? (
                                            <div className="w-full h-full relative group">
                                                {iframeLoading && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 z-10">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                                        <p className="text-slate-500 font-medium">Loading Document...</p>
                                                    </div>
                                                )}
                                                <iframe
                                                    src={getEmbedUrl(activeAttachment.url)}
                                                    className="w-full h-full border-none"
                                                    onLoad={() => setIframeLoading(false)}
                                                    allowFullScreen
                                                />
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                    <a
                                                        href={getViewUrl(activeAttachment.url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors"
                                                    >
                                                        Open in New Tab
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                    <a
                                                        href={getDownloadUrl(activeAttachment.url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-600 transition-colors"
                                                    >
                                                        Download
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </a>
                                                </div>
                                                {/* PDF Toolbar */}
                                                {mail.attachments.length > 1 && (
                                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full shadow-lg flex items-center gap-4 z-10 border border-slate-200 dark:border-slate-700 ring-1 ring-black/5">
                                                        {/* Previous Attachment */}
                                                        <button
                                                            onClick={() => {
                                                                if (!activeAttachment || !mail.attachments) return;
                                                                const idx = mail.attachments.findIndex(a => a.id === activeAttachment.id);
                                                                if (idx > 0) setActiveAttachment(mail.attachments[idx - 1]);
                                                                else setActiveAttachment(mail.attachments[mail.attachments.length - 1]); // Loop to last
                                                            }}
                                                            disabled={mail.attachments.length <= 1}
                                                            className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors disabled:opacity-30"
                                                            title="Previous Attachment"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>

                                                        <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300 min-w-[32px] text-center">
                                                            {activeAttachment && mail.attachments ? mail.attachments.findIndex(a => a.id === activeAttachment.id) + 1 : 0}
                                                            <span className="text-slate-400 mx-1">/</span>
                                                            {mail.attachments?.length || 0}
                                                        </span>

                                                        {/* Next Attachment */}
                                                        <button
                                                            onClick={() => {
                                                                if (!activeAttachment || !mail.attachments) return;
                                                                const idx = mail.attachments.findIndex(a => a.id === activeAttachment.id);
                                                                if (idx < mail.attachments.length - 1) setActiveAttachment(mail.attachments[idx + 1]);
                                                                else setActiveAttachment(mail.attachments[0]); // Loop to first
                                                            }}
                                                            disabled={mail.attachments.length <= 1}
                                                            className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors disabled:opacity-30"
                                                            title="Next Attachment"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-lg font-medium">No document selected</p>
                                                <p className="text-sm">Select an attachment from the list to view</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sidebar: Attachments & Info */}
                                    <div className="w-full md:w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark flex flex-col shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20 overflow-y-auto custom-scrollbar h-full md:h-auto">

                                        {/* Mobile View Document Button */}
                                        <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10 flex flex-col gap-2">
                                            <a
                                                href={getViewUrl(activeAttachment?.url || '')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm transition-all ${activeAttachment ? 'bg-white dark:bg-surface-dark text-primary border border-blue-200 dark:border-blue-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Document
                                            </a>
                                            <a
                                                href={getDownloadUrl(activeAttachment?.url || '')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm transition-all ${activeAttachment ? 'bg-primary text-white border border-transparent' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </a>
                                        </div>

                                        {/* Attachments List */}
                                        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                Attachments ({mail.attachments.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {mail.attachments.length === 0 && (
                                                    <p className="text-sm text-slate-400 italic">No attachments found.</p>
                                                )}
                                                {mail.attachments.map((attachment) => (
                                                    <div
                                                        key={attachment.id}
                                                        onClick={() => setActiveAttachment(attachment)}
                                                        className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all ${activeAttachment?.id === attachment.id
                                                            ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 shadow-sm relative overflow-hidden'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                                            }`}
                                                    >
                                                        {activeAttachment?.id === attachment.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>}
                                                        {getFileIcon(attachment.type)}
                                                        <div className="ml-3 flex-1 min-w-0">
                                                            <p className={`text-sm truncate ${activeAttachment?.id === attachment.id ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                                                {attachment.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{attachment.size || 'View'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="p-5 space-y-5">
                                            {/* Event Info Section (Collapsible) */}
                                            {mail.eventInfo && (
                                                <Disclosure defaultOpen>
                                                    {({ open }) => (
                                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30 overflow-hidden">
                                                            <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 focus:outline-none">
                                                                <span className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    Event Details
                                                                </span>
                                                                <svg
                                                                    className={`${open ? 'rotate-180 transform' : ''} h-4 w-4 text-indigo-500 transition-transform`}
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </Disclosure.Button>
                                                            <Disclosure.Panel className="px-4 pb-4 pt-1 text-sm text-indigo-800 dark:text-indigo-200 space-y-2">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-indigo-400 dark:text-indigo-400 uppercase tracking-wide">Date</p>
                                                                    <p className="font-medium">{mail.eventInfo?.date}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-indigo-400 dark:text-indigo-400 uppercase tracking-wide">Time</p>
                                                                    <p className="font-medium">{mail.eventInfo?.time}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-indigo-400 dark:text-indigo-400 uppercase tracking-wide">Place</p>
                                                                    <p className="font-medium">{mail.eventInfo?.place}</p>
                                                                </div>
                                                            </Disclosure.Panel>
                                                        </div>
                                                    )}
                                                </Disclosure>
                                            )}

                                            {/* General Info */}
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Metadata</h3>

                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Received Date</p>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{mail.receivedDate}</p>
                                                </div>

                                                {mail.processedBy && (
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Processed By</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                                {mail.processedBy.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{mail.processedBy}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {mail.notes && mail.notes !== '-' && (
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Disposisi Notes</p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-serif italic">{mail.notes}</p>
                                                    </div>
                                                )}

                                                {mail.catatan_tambahan && mail.catatan_tambahan !== '-' && (
                                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wide mb-1">Catatan Tambahan</p>
                                                        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{mail.catatan_tambahan}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
