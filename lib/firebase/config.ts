import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: only initialize Firebase if a valid API key is present.
// This prevents build-time crashes during Next.js static prerendering
// when environment variables are not yet available.
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    // Provide stub exports so imports don't break at module-evaluation time.
    // These stubs will never be used at runtime because 'use client' pages
    // only run in the browser where env vars ARE available.
    console.warn(
        '[Firebase] NEXT_PUBLIC_FIREBASE_API_KEY is not set. ' +
        'Firebase services are disabled. Set environment variables in Vercel.'
    );
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
}

export { app, auth, db };
