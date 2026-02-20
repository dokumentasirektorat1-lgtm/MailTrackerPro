'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/firebase/auth';
import { toast } from 'sonner';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast.error('Password Mismatch: Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            toast.error('Weak Password: Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        const result = await registerUser(formData.email, formData.password, formData.displayName);

        if (result.success) {
            toast.success('Registration Successful!', {
                description: 'Your account has been created successfully. Please wait for admin approval.'
            });
            router.push('/auth/pending');
        } else {
            toast.error('Registration Failed', {
                description: result.message
            });
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
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="text-primary-100 mt-2">Join MailTrack Pro today</p>
                </div>

                {/* Registration Form */}
                <div className="glass-effect rounded-2xl p-8 shadow-2xl animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-white mb-2">
                                Full Name
                            </label>
                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                required
                                value={formData.displayName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                                    Creating Account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-primary-100 text-sm">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-white font-semibold hover:underline">
                                Sign In
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
