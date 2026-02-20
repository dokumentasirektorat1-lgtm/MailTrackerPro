'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="h-screen w-full bg-slate-50 dark:bg-background-dark flex overflow-hidden transition-colors duration-300">
                {/* Sidebar - Static on Desktop, Fixed on Mobile */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Content Area - Scrolls independently */}
                <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
                    <Topbar onMenuClick={() => setSidebarOpen(true)} />

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth overscroll-none scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
