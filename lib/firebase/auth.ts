import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    approvedAt?: any;
    approvedBy?: string;
}

/**
 * Register a new user
 */
export const registerUser = async (
    email: string,
    password: string,
    displayName: string
): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore with pending status
        const userProfile: UserProfile = {
            uid: user.uid,
            email: email,
            displayName: displayName,
            role: 'user',
            status: 'pending', // New users start as pending
            createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);

        return {
            success: true,
            message: 'Registration successful! Please wait for admin approval.',
            user,
        };
    } catch (error: any) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: error.message || 'Registration failed',
        };
    }
};

/**
 * Sign in user
 */
export const signInUser = async (
    email: string,
    password: string
): Promise<{ success: boolean; message: string; user?: User; profile?: UserProfile }> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error('User profile not found');
        }

        const profile = userDoc.data() as UserProfile;

        return {
            success: true,
            message: 'Login successful',
            user,
            profile,
        };
    } catch (error: any) {
        console.error('Login error:', error);
        return {
            success: false,
            message: error.message || 'Login failed',
        };
    }
};

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

/**
 * Get user profile
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return userDoc.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
