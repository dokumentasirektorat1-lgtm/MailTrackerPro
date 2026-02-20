'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAvailableYears, getColumnsForYear } from '@/lib/firebase/firestore';
import { useMails } from '@/lib/hooks/useMails';
import DocumentViewerModal from '@/components/DocumentViewerModal';

export default function DirectoryPage() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchColumn, setSearchColumn] = useState<string>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [pageSizeOption, setPageSizeOption] = useState<number | 'all'>(5);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'NO URUT', direction: 'desc' });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMail, setSelectedMail] = useState<any>(null);

    // Columns
    const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);

    // Data Fetching
    const { mails, loading, error } = useMails(selectedYear);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Years
    useEffect(() => {
        const fetchYears = async () => {
            const years = await getAvailableYears();
            if (years.length > 0) {
                setAvailableYears(years);
                if (!years.includes(selectedYear)) setSelectedYear(years[0]);
            } else {
                setAvailableYears([currentYear]);
            }
        };
        fetchYears();
    }, []);

    // Fetch & Transform Columns
    useEffect(() => {
        const fetchColumns = async () => {
            const rawColumns = await getColumnsForYear(selectedYear);

            // 1. Filter out raw disposisi cols only (Event cols remain separate)
            const ignored = [
                'PENANGGUNG JAWAB PENERIMA DISPOSISI', 'ISI DISPOSISI',
                'date', 'subject', 'sender', 'year', 'accessId', 'id', 'attachment_link', 'search_keywords', 'target_year_config'
            ];
            const filtered = rawColumns.filter(c => !ignored.includes(c));

            // 2. Add Composite Columns
            // Preferred Order
            const preferred = [
                'NO URUT', 'PERIHAL', 'NO SURAT MASUK',
                'TANGGAL SURAT MASUK', 'TANGGAL SURAT DITERIMA',
                'NAMA INSTANSI PENGIRIM',
                'TANGGAL PELAKSANAAN', 'WAKTU PELAKSANAAN', 'TEMPAT PELAKSANAAN',
                'DISPOSISI_INFO'
            ];

            const finalCols = [
                ...preferred.filter(c => filtered.includes(c) || c === 'DISPOSISI_INFO'),
                ...filtered.filter(c => !preferred.includes(c))
            ];

            setDynamicColumns(finalCols);
        };
        fetchColumns();
    }, [selectedYear]);
    // Note: removed `mails` dependency to avoid infinite rendering if columns don't change, 
    // but `getColumnsForYear` fetches mails internally.

    // 1. Filter
    const filteredMails = useMemo(() => {
        // 1. Deduplicate by specific ID (safety net)
        const uniqueMap = new Map();
        mails.forEach(m => {
            // Only process if year matches (or is missing)
            if (!m.year || m.year === selectedYear) {
                uniqueMap.set(m.id, m);
            }
        });
        const uniqueMails = Array.from(uniqueMap.values());

        if (!debouncedSearch) return uniqueMails;
        const term = debouncedSearch.toLowerCase();

        return uniqueMails.filter(mail => {
            if (searchColumn === 'all') {
                return Object.values(mail).some(val =>
                    String(val).toLowerCase().includes(term)
                );
            }
            const val = mail[searchColumn];
            return String(val || '').toLowerCase().includes(term);
        });
    }, [mails, debouncedSearch, searchColumn, selectedYear]);

    // 2. Sort
    const sortedMails = useMemo(() => {
        const sorted = [...filteredMails];
        if (sortConfig) {
            sorted.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                // Handle Composite Sorts?
                if (sortConfig.key === 'DETAIL_KEGIATAN') valA = a['TANGGAL PELAKSANAAN']; // Sort by Date
                if (sortConfig.key === 'DISPOSISI_INFO') valA = a['PENANGGUNG JAWAB PENERIMA DISPOSISI'];

                // Numeric Clean
                const cleanA = String(valA || '').replace(/[^0-9.-]/g, '');
                const cleanB = String(valB || '').replace(/[^0-9.-]/g, '');
                const numA = parseFloat(cleanA);
                const numB = parseFloat(cleanB);

                const isNumeric = !isNaN(numA) && !isNaN(numB) && cleanA && cleanB;

                if (isNumeric) {
                    valA = numA;
                    valB = numB;
                } else {
                    valA = String(valA || '').toLowerCase();
                    valB = String(valB || '').toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filteredMails, sortConfig]);

    // 3. Paginate
    const currentTableData = useMemo(() => {
        if (pageSizeOption === 'all') return sortedMails;
        const start = (currentPage - 1) * pageSize;
        return sortedMails.slice(start, start + pageSize);
    }, [sortedMails, currentPage, pageSize, pageSizeOption]);

    const totalPages = pageSizeOption === 'all' ? 1 : Math.ceil(sortedMails.length / pageSize);

    // Helper for Column Widths
    const getColumnClass = (header: string) => {
        const h = header.toUpperCase();
        if (h === 'DISPOSISI_INFO') return "w-[250px] min-w-[250px] whitespace-normal leading-tight";

        if (h === 'TANGGAL PELAKSANAAN') return "w-[120px] whitespace-nowrap text-center text-sm font-medium";
        if (h === 'WAKTU PELAKSANAAN') return "w-[100px] whitespace-nowrap text-center text-sm";
        if (h === 'TEMPAT PELAKSANAAN') return "min-w-[150px] max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis px-2";

        if (h.includes('NO URUT') || h.includes('ID')) return "w-[80px] min-w-[80px] text-center whitespace-normal break-words";
        if (h.includes('TANGGAL') || h.includes('DATE')) return "w-[110px] min-w-[110px] text-center whitespace-normal leading-tight";
        if (h.includes('WAKTU')) return "w-[90px] min-w-[90px] text-center whitespace-nowrap";
        if (h.includes('SUMBER') || h.includes('PENGIRIM')) return "max-w-[180px] whitespace-normal leading-tight";
        if (h.includes('PERIHAL') || h.includes('SUBJECT')) return "min-w-[250px] max-w-[400px] whitespace-normal leading-relaxed";
        if (h.includes('LAMPIRAN') || h.includes('ATTACHMENT')) return "w-[80px] text-center";
        if (h.includes('STATUS')) return "w-[100px] text-center";
        return "min-w-[120px] whitespace-normal";
    };

    const getSortIcon = (column: string) => {
        if (!sortConfig || sortConfig.key !== column) return <span className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
        return <span className="text-primary-600 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const formatUniqueId = (mail: any) => mail['NO URUT'] || mail.id;

    const formatCellValue = (value: any): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object' && value.seconds) {
            // Firestore Timestamp
            return new Date(value.seconds * 1000).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
        }
        // Handle ISO Date Strings (2026-02-20T00:00:00)
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'long', year: 'numeric'
                });
            }
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    const getComputedStatus = (mail: any) => {
        // Custom logic: If Disposisi fields are filled, it is 'In Process'
        const disposisiBy = mail['PENANGGUNG JAWAB PENERIMA DISPOSISI'];
        const disposisiNote = mail['ISI DISPOSISI'];

        if (disposisiBy && disposisiNote && disposisiBy !== '-' && disposisiNote !== '-') {
            return 'In Process';
        }

        return (mail.Status || mail.status || 'Pending');
    };

    const handleExportCSV = () => {
        if (!sortedMails.length) return;

        // Collect headers
        const headers = ['Tracking ID', ...dynamicColumns.filter(c => !['id', 'year', 'accessId', 'attachments'].includes(c))];

        const csvContent = [
            headers.join(','),
            ...sortedMails.map(mail =>
                headers.map(header => {
                    let val = '';
                    if (header === 'Tracking ID') {
                        val = formatUniqueId(mail);
                    } else if (header === 'DISPOSISI_INFO') {
                        val = `${mail['PENANGGUNG JAWAB PENERIMA DISPOSISI'] || '-'} (${mail['ISI DISPOSISI'] || '-'})`;
                    } else if (header.match(/status/i)) {
                        val = getComputedStatus(mail);
                    } else {
                        val = mail[header];
                    }

                    // Format value for CSV (escape quotes, etc)
                    let str = formatCellValue(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        str = `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mail_archive_${selectedYear}.csv`;
        link.click();
    };

    const handleViewDetail = (mail: any) => {
        // Map Firestore data to Modal interface
        // Detect Event/Deadline Info
        const eventDate = mail['TANGGAL PELAKSANAAN'];
        const eventTime = mail['WAKTU PELAKSANAAN'];
        const eventPlace = mail['TEMPAT PELAKSANAAN'];
        const isEvent = (eventDate && eventDate !== '-') || (eventTime && eventTime !== '-') || (eventPlace && eventPlace !== '-');

        const mailDetail = {
            id: mail.id,
            trackingId: mail['NO URUT'] || mail.TrackingID || mail.NoSurat || `TRK-${mail.id.substring(0, 8)}`,
            subject: mail.PERIHAL || mail.Perihal || mail.Subject || 'No Subject',
            sender: mail['NAMA INSTANSI PENGIRIM'] || mail.Pengirim || 'Unknown Sender',
            receivedDate: mail['TANGGAL SURAT DITERIMA'] || (mail.ReceivedAt ? new Date(mail.ReceivedAt.seconds * 1000).toLocaleString('id-ID') : 'N/A'),
            status: getComputedStatus(mail).toLowerCase(),
            category: mail.Category || mail.Kategori || 'General',
            processedBy: mail.ProcessedBy || mail['PENANGGUNG JAWAB PENERIMA DISPOSISI'],
            notes: mail['ISI DISPOSISI'] || mail.Notes || mail.Catatan,
            attachments: (mail.attachments || mail.Attachments || []).map((att: any, idx: number) => ({
                id: att.driveFileId || `att-${idx}`,
                name: att.fileName || `Attachment ${idx + 1}`,
                size: 'Unknown',
                type: att.fileName?.split('.').pop()?.toLowerCase() || 'file',
                url: att.driveViewLink || '#'
            })),
            eventInfo: isEvent ? {
                date: eventDate || '-',
                time: eventTime || '-',
                place: eventPlace || '-'
            } : undefined
        };

        setSelectedMail(mailDetail);
        setIsModalOpen(true);
    };

    // Sorting Logic
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };



    const handlePageSizeChange = (val: string) => {
        const newVal = val === 'all' ? 'all' : Number(val);
        setPageSizeOption(newVal);
        setPageSize(newVal === 'all' ? sortedMails.length : newVal);
        setCurrentPage(1);
    }



    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Mail Directory</h1>
                    <p className="text-slate-600 dark:text-slate-400">Browse and search all mail records archive.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-card p-6 animate-slide-up border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Year Filter */}
                    <div className="md:col-span-3">
                        <label htmlFor="year" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Year Archive
                        </label>
                        <div className="relative">
                            <select
                                id="year"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all font-medium appearance-none cursor-pointer"
                            >
                                {availableYears.length > 0 ? (
                                    availableYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))
                                ) : (
                                    <option value={currentYear}>{currentYear}</option>
                                )}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    {/* Search & Filter */}
                    <div className="md:col-span-9 flex flex-col md:flex-row gap-4 items-end">
                        {/* Column Filter */}
                        <div className="w-full md:w-1/4">
                            <label htmlFor="column-filter" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Search In
                            </label>
                            <div className="relative">
                                <select
                                    id="column-filter"
                                    value={searchColumn}
                                    onChange={(e) => setSearchColumn(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all font-medium appearance-none cursor-pointer"
                                >
                                    <option value="all">All Columns</option>
                                    {dynamicColumns.map((col) => (
                                        <option key={col} value={col}>
                                            {col.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="w-full md:w-3/4">
                            <label htmlFor="search" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Smart Search
                            </label>
                            <div className="relative group">
                                <input
                                    id="search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by keyword..."
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 transition-all font-medium shadow-sm group-hover:shadow-md"
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Info & Pagination Controls */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                        Showing <strong className="text-slate-900 dark:text-white">{sortedMails.length}</strong> records for <strong className="text-slate-900 dark:text-white">{selectedYear}</strong>
                    </span>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">Show:</span>
                            <select
                                value={pageSizeOption}
                                onChange={(e) => handlePageSizeChange(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-1 px-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading records...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Failed to load data</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">{error}</p>
                    </div>
                ) : sortedMails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No records found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                            We couldn't find any mails matching your search or filters for the year {selectedYear}.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        {/* Tracking ID / No Urut Column */}
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider md:sticky md:left-0 z-10 bg-slate-50 dark:bg-surface-dark md:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => handleSort('NO URUT')}>
                                            <div className="flex items-center gap-1">
                                                NO URUT (ID)
                                                {sortConfig?.key === 'NO URUT' && (
                                                    <span className="text-primary-500">
                                                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>

                                        {/* Dynamic Columns */}
                                        {dynamicColumns.map((column) => (
                                            <th
                                                key={column}
                                                className={`px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group ${getColumnClass(column)}`}
                                                onClick={() => handleSort(column)}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {column.replace(/_/g, ' ')}
                                                    {getSortIcon(column)}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky right-0 z-10 bg-slate-50 dark:bg-surface-dark shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.1)] w-16">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {currentTableData.map((mail) => (
                                        <tr
                                            key={mail.id}
                                            className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                            onClick={() => handleViewDetail(mail)}
                                        >
                                            <td className={`px-6 py-4 whitespace-normal md:sticky md:left-0 z-10 bg-white dark:bg-surface-dark group-hover:bg-blue-50/50 dark:group-hover:bg-slate-800/50 transition-colors md:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] ${getColumnClass('NO URUT')}`}>
                                                <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-1 rounded border border-primary-100 dark:border-primary-500/20 break-words">
                                                    {mail['NO URUT'] || mail.id}
                                                </span>
                                            </td>
                                            {dynamicColumns.map((column) => {
                                                // Handle Attachments Column
                                                if (column.match(/LAMPIRAN|ATTACHMENT|FILE/i)) {
                                                    const hasAtt = mail.attachments && mail.attachments.length > 0;
                                                    // Priority: attachment_link field -> or first item in attachments array
                                                    const attLink = mail.attachment_link || (hasAtt ? mail.attachments?.[0]?.driveViewLink : null);

                                                    return (
                                                        <td key={column} className={`px-6 py-4 text-center ${getColumnClass(column)}`}>
                                                            {attLink ? (
                                                                <a
                                                                    href={attLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center justify-center p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-colors group/icon"
                                                                    title="View Attachment"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                    </svg>
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                }

                                                // 2. DISPOSISI INFO
                                                if (column === 'DISPOSISI_INFO') {
                                                    const pic = mail['PENANGGUNG JAWAB PENERIMA DISPOSISI'];
                                                    const note = mail['ISI DISPOSISI'];
                                                    const hasData = (pic && pic !== '-') || (note && note !== '-');

                                                    return (
                                                        <td key={column} className={`px-6 py-4 text-sm text-slate-600 dark:text-slate-300 ${getColumnClass(column)}`}>
                                                            {hasData ? (
                                                                <div className="flex flex-col gap-1">
                                                                    {pic && pic !== '-' && <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{pic}</div>}
                                                                    {note && note !== '-' && <div className="italic text-slate-500 text-xs text-wrap leading-snug">{note}</div>}
                                                                </div>
                                                            ) : <span className="text-slate-400 italic">-</span>}
                                                        </td>
                                                    );
                                                }

                                                let val = mail[column];
                                                // Override status for visual consistency
                                                if (column.match(/status/i)) {
                                                    val = getComputedStatus(mail);
                                                    return (
                                                        <td key={column} className={`px-6 py-4 text-sm ${getColumnClass(column)}`}>
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${val === 'In Process' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                                val === 'Selesai' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                    'bg-slate-50 text-slate-700 ring-slate-600/20'
                                                                }`}>
                                                                {val}
                                                            </span>
                                                        </td>
                                                    );
                                                }
                                                return (
                                                    <td key={column} className={`px-6 py-4 whitespace-normal text-sm text-slate-600 dark:text-slate-300 break-words ${getColumnClass(column)}`}>
                                                        {formatCellValue(val)}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-4 whitespace-nowrap text-right sticky right-0 z-10 bg-white dark:bg-surface-dark group-hover:bg-blue-50/50 dark:group-hover:bg-slate-800/50 transition-colors shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetail(mail);
                                                    }}
                                                    title="View Details"
                                                    className="p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-surface-dark">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Page {currentPage} of {totalPages} ({sortedMails.length} Total)
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Document Viewer Modal */}
            <DocumentViewerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mail={selectedMail}
            />
        </div>
    );
}
