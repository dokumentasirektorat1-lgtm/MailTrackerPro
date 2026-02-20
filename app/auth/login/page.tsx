'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInUser } from '@/lib/firebase/auth';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await signInUser(email, password);

        if (result.success && result.profile) {
            // Check user approval status
            if (result.profile.status === 'pending') {
                Swal.fire({
                    title: 'Account Pending',
                    text: 'Your account is successfully registered and currently awaiting administrator approval. You will be redirected once approved.',
                    icon: 'info',
                    confirmButtonText: 'Understood',
                    confirmButtonColor: '#3b82f6',
                });
                router.push('/auth/pending');
            } else if (result.profile.status === 'approved') {
                toast.success('Welcome back, ' + result.profile.displayName + '!');
                router.push('/dashboard');
            } else if (result.profile.status === 'rejected') {
                Swal.fire({
                    title: 'Access Denied',
                    text: 'Unfortunately, your registration has been rejected. Please contact the administrator for further information.',
                    icon: 'error',
                    confirmButtonText: 'Close',
                    confirmButtonColor: '#ef4444',
                });
            }
        } else {
            toast.error(result.message || 'Login Failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center px-4 py-12 relative">
            {/* Background decoration - Fixed to viewport to prevent scroll issues */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8 animate-fade-in">
                    <Link href="/" className="inline-block">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 mx-auto mb-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Sign In</h1>
                    <p className="text-primary-100 mt-2">Welcome back to MailTrack Pro</p>
                </div>

                {/* Login Form */}
                <div className="glass-effect rounded-2xl p-8 shadow-2xl animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                                    Signing In...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-primary-100 text-sm">
                            Don't have an account?{' '}
                            <Link href="/auth/register" className="text-white font-semibold hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-4 text-center">
                        <Link href="/" className="text-primary-200 text-sm hover:text-white transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
