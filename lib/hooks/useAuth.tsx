'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, UserProfile } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    isApproved: boolean;
    isAdmin: boolean;
    isRejected: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
    isApproved: false,
    isAdmin: false,
    isRejected: false,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;

        const unsubscribeAuth = onAuthChange((firebaseUser) => {
            setUser(firebaseUser);

            // Clear previous profile listener
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (firebaseUser) {
                // Listen to profile in real-time
                unsubscribeProfile = onSnapshot(
                    doc(db, 'users', firebaseUser.uid),
                    (snapshot) => {
                        if (snapshot.exists()) {
                            setProfile(snapshot.data() as UserProfile);
                        } else {
                            setProfile(null);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Profile snapshot error:", error);
                        setLoading(false);
                    }
                );
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const value: AuthContextType = {
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        isApproved: profile?.status === 'approved',
        isAdmin: profile?.role === 'admin',
        isRejected: profile?.status === 'rejected',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
