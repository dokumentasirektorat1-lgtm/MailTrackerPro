'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, isAdmin } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    const mainNav = [
        { name: 'Dashboard', href: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { name: 'Mail Directory', href: '/directory', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        { name: 'User Management', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true },
    ];

    const systemNav = [
        { name: 'Configuration', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', adminOnly: true },
        { name: 'Audit Logs', href: '/admin/audit', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', adminOnly: true },
    ];

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
            )}

            <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1e293b] border-r border-slate-700/50 flex flex-col shrink-0 transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
                    <div className="h-8 w-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-[#0ea5e9]/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-white">MailTrack Pro</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    {/* Main Nav Section */}
                    {mainNav.some(item => !item.adminOnly || isAdmin) && (
                        <>
                            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main</div>
                            {mainNav.map((item) => {
                                if (item.adminOnly && !isAdmin) return null;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                            ? 'bg-[#0ea5e9] text-white shadow-md shadow-[#0ea5e9]/25'
                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                            }`}
                                    >
                                        <svg className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                        </svg>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </>
                    )}

                    {/* System Nav Section */}
                    {systemNav.some(item => !item.adminOnly || isAdmin) && (
                        <>
                            <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">System</div>
                            {systemNav.map((item) => {
                                if (item.adminOnly && !isAdmin) return null;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                            ? 'bg-[#0ea5e9] text-white shadow-md shadow-[#0ea5e9]/25'
                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                            }`}
                                    >
                                        <svg className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                        </svg>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </>
                    )}
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-slate-700/50 bg-[#1e293b]">
                    <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-600">
                            {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{profile?.displayName || 'User'}</p>
                            <p className="text-xs text-slate-400">{profile?.role === 'admin' ? 'System Admin' : 'Staff'}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="ml-auto text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
                            title="Sign Out"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
