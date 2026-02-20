'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
    const { user, profile, loading, isApproved, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not authenticated - redirect to login
                router.push('/auth/login');
            } else if (!isApproved) {
                // Authenticated but not approved - redirect to pending page
                router.push('/auth/pending');
            } else if (requireAdmin && !isAdmin) {
                // Not an admin - redirect to dashboard
                router.push('/dashboard');
            }
        }
    }, [user, profile, loading, isApproved, isAdmin, requireAdmin, router]);

    // Show loading screen while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="text-center">
                    <div className="loader mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render protected content until fully authenticated and approved
    if (!user || !isApproved || (requireAdmin && !isAdmin)) {
        return null;
    }

    return <>{children}</>;
};
