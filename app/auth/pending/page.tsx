'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { onSnapshot, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function PendingPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user?.uid) return;

        // Listen to user document for real-time approval status
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            const data = snapshot.data();
            if (data?.status === 'approved') {
                toast.success('Account Approved!', {
                    description: 'Your account has been approved. Redirecting to dashboard...'
                });
                router.push('/dashboard');
            } else if (data?.status === 'rejected') {
                toast.error('Access Denied', {
                    description: 'Your account has been rejected.'
                });
                // Optional: Could redirect back to login or stay here
            }
        });

        return () => unsubscribe();
    }, [user, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="loader"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="glass-effect rounded-2xl p-8 shadow-2xl text-center animate-fade-in">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Approval Pending
                    </h1>

                    {/* Message */}
                    <p className="text-white/90 mb-2">
                        Welcome, <span className="font-semibold">{profile?.displayName || user.email}</span>!
                    </p>

                    <p className="text-white/80 mb-6 text-sm leading-relaxed">
                        Your account has been created successfully. However, access to the system is restricted until an administrator approves your account.
                    </p>

                    {/* Info Box */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6 text-left">
                        <h3 className="text-white font-semibold mb-2 text-sm">What happens next?</h3>
                        <ul className="text-white/80 text-sm space-y-1">
                            <li className="flex items-start gap-2">
                                <span className="text-white mt-0.5">•</span>
                                <span>An administrator will review your account</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-white mt-0.5">•</span>
                                <span>You'll receive access once approved</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-white mt-0.5">•</span>
                                <span>Check back later or contact your administrator</span>
                            </li>
                        </ul>
                    </div>

                    {/* Account Info */}
                    <div className="bg-white/10 rounded-lg p-3 mb-6 text-xs text-white/70">
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Status:</strong> <span className="text-yellow-200 font-semibold">Pending Approval</span></p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleSignOut}
                            className="w-full px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            Sign Out
                        </button>

                        <Link
                            href="/"
                            className="block w-full px-6 py-3 bg-white/10 text-white rounded-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
