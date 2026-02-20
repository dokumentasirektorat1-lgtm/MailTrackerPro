'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function HomePage() {
    const { user, isApproved, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (isApproved) {
                router.push('/dashboard');
            } else {
                router.push('/auth/pending');
            }
        }
    }, [user, isApproved, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                {/* Hero Section */}
                <div className="text-center animate-fade-in">
                    {/* Logo/Icon */}
                    <div className="mb-8 inline-block">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
                        MailTrack <span className="text-primary-200">Pro</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-primary-100 mb-3 font-light">
                        Comprehensive Mail Management System
                    </p>

                    <p className="text-base md:text-lg text-primary-200 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Seamlessly connect your MS Access database to the cloud with real-time synchronization,
                        smart document management, and powerful search capabilities.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
                        <Link
                            href="/auth/login"
                            className="group px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:bg-primary-50 flex items-center gap-2 min-w-[200px] justify-center"
                        >
                            <span>Sign In</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>

                        <Link
                            href="/auth/register"
                            className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105 min-w-[200px] text-center"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {/* Feature 1 */}
                    <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">Real-time Sync</h3>
                        <p className="text-primary-100 text-sm">Automatic synchronization between MS Access and cloud storage</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">Smart Documents</h3>
                        <p className="text-primary-100 text-sm">Integrated Google Drive viewer with attachment management</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">Secure Access</h3>
                        <p className="text-primary-100 text-sm">Role-based authentication with admin approval workflow</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-primary-200 text-sm">
                    <p>&copy; 2026 MailTrack Pro. All rights reserved.</p>
                </div>
            </div>
        </main>
    );
}
