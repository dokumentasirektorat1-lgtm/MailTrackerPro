import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    getDocsFromServer,
    getDocFromServer,
    Query,
    QuerySnapshot
} from 'firebase/firestore';
import { db } from './config';

export interface MailDocument {
    id: string; // Composite: "100-2025"
    year: number;
    accessId: number;
    subject?: string;
    sender?: string;
    recipient?: string;
    date?: Timestamp | any; // Allow relaxed type for JSON backup
    category?: string;
    attachments?: Array<{
        fileName: string;
        driveFileId: string;
        driveViewLink: string;
    }>;
    attachment_link?: string; // From Bridge
    [key: string]: any; // Dynamic fields from Access DB
}

// Backup Mode State Management
let backupModeActive = false;
const backupModeListeners: ((active: boolean) => void)[] = [];

export const onBackupModeChange = (callback: (active: boolean) => void) => {
    backupModeListeners.push(callback);
    callback(backupModeActive); // Initial state
    return () => {
        const index = backupModeListeners.indexOf(callback);
        if (index > -1) backupModeListeners.splice(index, 1);
    };
};

const setBackupModeActive = (active: boolean) => {
    if (backupModeActive !== active) {
        backupModeActive = active;
        backupModeListeners.forEach(cb => cb(active));
    }
};

export interface SystemConfig {
    accessDbPath: string;
    syncStatus: 'online' | 'offline' | 'error' | 'healthy'; // Changed 'offline' to include 'error'
    lastSyncAt?: Timestamp;
    lastActive?: Timestamp;
    lastError?: string;
    driveApiKey?: string;
    driveFolderId?: string;
    backup_json_url?: string; // URL to latest_data.json on Drive
    backup_json_id?: string;
    maintenanceMode?: boolean; // Added maintenanceMode
    targetYear?: number;
}

// HARDCODED FALLBACK (To be filled by user in Vercel ENV)
// This MUST clearly be set to your Google Drive direct download link
const FALLBACK_BACKUP_URL = process.env.NEXT_PUBLIC_BACKUP_JSON_URL || "";

/**
 * Fetch Backup Data from Drive JSON
 */
export async function fetchBackupData(): Promise<MailDocument[]> {
    setBackupModeActive(true); // Signal UI
    try {
        let backupUrl = FALLBACK_BACKUP_URL;

        // Try getting fresh config if possible (skip if we know quota is dead)
        /*
        try {
            const configRef = doc(db, 'config', 'system');
            const configDoc = await getDoc(configRef);
            if (configDoc.exists()) {
                const data = configDoc.data() as SystemConfig;
                if (data.backup_json_url) backupUrl = data.backup_json_url;
            }
        } catch (e) {
            console.warn("Could not read config for backup url, using fallback.");
        }
        */

        if (!backupUrl || backupUrl === "YOUR_GLINK_HERE") {
            // Fallback to hardcoded one if config failed (likely)
            backupUrl = FALLBACK_BACKUP_URL;
        }

        // Convert View Link to Direct Download Link if needed
        // e.g. drive.google.com/file/d/XXX/view -> drive.google.com/uc?export=download&id=XXX
        let downloadUrl = backupUrl;
        if (backupUrl.includes('/file/d/')) {
            const fileId = backupUrl.split('/file/d/')[1].split('/')[0];
            downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }

        // 2. Fetch the JSON
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Failed to fetch backup file");

        const data = await response.json();

        // 3. Map to MailDocument structure
        return data.map((row: any) => {
            // Parse Date safely
            let dateVal: any = null;
            const rawDate = row['TANGGAL SURAT DITERIMA'] || row.date;
            if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                    dateVal = { seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 };
                }
            }

            // Parse ID — support both formats: "2025_10" (new) and "10-2025" (legacy)
            const noUrut = row['NO URUT'];
            const year = parseInt(String(row.year || row.id?.split('_')[0] || '2025'));
            const canonicalId = row.id || `${year}_${noUrut}`;

            return {
                ...row,
                id: canonicalId,
                year: year,
                accessId: parseInt(String(noUrut).replace(/\D/g, '')) || 0,
                date: dateVal,
                subject: row['PERIHAL'] || row.subject || '',
                sender: row['PENGIRIM'] || row.sender || '',
                recipient: row['PENERIMA'] || row.recipient || ''
            } as MailDocument;
        });

    } catch (error) {
        console.error("Backup fetch failed:", error);
        return [];
    }
}

// (Removed duplicate import)

const checkOnlineStatus = async (timeoutMs: number = 3000): Promise<boolean> => {
    try {
        const configRef = doc(db, 'config', 'system');

        // Timeout wrapper for getDocFromServer
        const fetchPromise = getDocFromServer(configRef);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
        );

        await Promise.race([fetchPromise, timeoutPromise]);
        return true;
    } catch (e) {
        // console.warn("Connectivity Check Failed:", e);
        return false;
    }
};

/**
 * Robust date parser that handles:
 * 1. Firestore Timestamp objects { seconds, nanoseconds }
 * 2. ISO Date Strings "2026-02-20T00:00:00"
 * 3. JS Date Objects
 * 4. Null/Undefined -> returns null
 */
const parseFirestoreDate = (val: any): { seconds: number, nanoseconds: number } | null => {
    if (!val) return null;

    // Is it already a Firestore Timestamp-like object?
    if (typeof val.seconds === 'number') {
        return { seconds: val.seconds, nanoseconds: val.nanoseconds || 0 };
    }

    // Is it a Date object?
    if (val instanceof Date) {
        return { seconds: Math.floor(val.getTime() / 1000), nanoseconds: 0 };
    }

    // Is it a string? Try to parse it.
    if (typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            return { seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 };
        }
    }

    return null;
};

/**
 * Get all mails for a specific year
 */
export const getMailsByYear = async (year: number): Promise<MailDocument[]> => {
    try {
        // 1. Connectivity Check (Ping)
        // Check if we can reach server (1 Read Cost)
        const isOnline = await checkOnlineStatus(3000);

        if (!isOnline) {
            console.warn("⚠️ Firestore Connectivity Check Failed. Assuming Quota Exceeded or Offline.");
            throw new Error("PING_FAILED");
        }

        // 2. If Online, Fetch Data Efficiently (Cache Allowed)
        const mailsRef = collection(db, 'surat_masuk');
        // Filter by year field (stored as number by the bridge)
        const q = query(mailsRef, where('year', '==', year));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Firestore returned empty for year ${year}. Possibly sync issues.`);
        }

        const mails: MailDocument[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const accessId = parseInt(String(data['NO URUT']).replace(/\D/g, '')) || 0;

            mails.push({
                ...data,
                id: doc.id,
                year: year,
                accessId: accessId,
                date: parseFirestoreDate(data['TANGGAL SURAT DITERIMA']),
                subject: data['PERIHAL'],
                sender: data['PENGIRIM'],
            } as MailDocument);
        });

        setBackupModeActive(false);
        return mails.sort((a, b) => b.accessId - a.accessId);

    } catch (error: any) {
        // DETECT QUOTA EXCEEDED, TIMEOUT, or OFFLINE
        console.warn("Firestore fetch error/ping failed:", error.message);

        // For ANY error accessing Real Server, we revert to Backup
        console.warn('⚠️ ACTIVATING FAILOVER MODE: Fetching from Google Drive Backup JSON...');
        setBackupModeActive(true);
        const backupMails = await fetchBackupData();
        return backupMails.sort((a, b) => b.accessId - a.accessId);
    }
};

/**
 * Get a single mail by composite ID
 */
export const getMailById = async (compositeId: string): Promise<MailDocument | null> => {
    try {
        // Try Firestore
        const mailRef = doc(db, 'surat_masuk', compositeId);
        const mailDoc = await getDoc(mailRef);

        if (mailDoc.exists()) {
            const data = mailDoc.data();
            return {
                ...data,
                id: mailDoc.id,
                date: parseFirestoreDate(data['TANGGAL SURAT DITERIMA']),
                accessId: parseInt(String(data['NO URUT'] || '').replace(/\D/g, '')) || 0,
            } as MailDocument;
        }
        throw new Error("Doc not found in FS");
    } catch (error) {
        // Fallback: Fetch all back up data and find one
        const backupMails = await fetchBackupData();
        return backupMails.find(m => m.id === compositeId) || null;
    }
};

/**
 * Search mails by keyword
 */
export const searchMails = async (
    year: number,
    searchTerm: string
): Promise<MailDocument[]> => {
    try {
        const allMails = await getMailsByYear(year);

        // Client-side filtering for flexible search
        const filtered = allMails.filter((mail) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (mail.subject || mail['PERIHAL'] || '').toLowerCase().includes(searchLower) ||
                (mail.sender || mail['PENGIRIM'] || '').toLowerCase().includes(searchLower) ||
                (mail.recipient || mail['PENERIMA'] || '').toLowerCase().includes(searchLower) ||
                (mail.category || '').toLowerCase().includes(searchLower)
            );
        });

        return filtered;
    } catch (error) {
        console.error('Error searching mails:', error);
        return [];
    }
};

/**
 * Get system configuration
 */
export const getSystemConfig = async (): Promise<SystemConfig | null> => {
    try {
        const configRef = doc(db, 'config', 'system');
        const configDoc = await getDoc(configRef);

        if (configDoc.exists()) {
            return configDoc.data() as SystemConfig;
        }
        return null;
    } catch (error) {
        console.error('Error fetching config:', error);
        return null;
    }
};

/**
 * Update system configuration
 */
export const updateSystemConfig = async (
    updates: Partial<SystemConfig>
): Promise<boolean> => {
    try {
        const configRef = doc(db, 'config', 'system');
        await setDoc(configRef, updates, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating config:', error);
        return false;
    }
};

/**
 * Reset System Status (Clear Errors)
 */
export const resetSystemStatus = async (): Promise<boolean> => {
    try {
        const configRef = doc(db, 'config', 'system');
        await updateDoc(configRef, {
            syncStatus: 'healthy',
            lastError: null,
            lastSyncAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error resetting system status:', error);
        return false;
    }
};

/**
 * Listen to config changes in real-time
 */
export const onConfigChange = (callback: (config: SystemConfig) => void, onError?: (error: any) => void) => {
    const configRef = doc(db, 'config', 'system');
    return onSnapshot(configRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as SystemConfig);
        }
    }, (error) => {
        if (onError) onError(error);
        else console.error("Config listener error:", error);
    });
};

/**
 * Get all available years from mails
 */
/**
 * Get all available years from mails in Firestore.
 * Reads the distinct `year` values from documents in surat_masuk.
 */
export const getAvailableYears = async (): Promise<number[]> => {
    try {
        const isOnline = await checkOnlineStatus(3000);
        if (!isOnline) return [new Date().getFullYear()];

        const mailsRef = collection(db, 'surat_masuk');
        // Fetch a sample of docs to extract distinct years
        const snapshot = await getDocs(query(mailsRef, orderBy('year', 'desc')));
        const yearsSet = new Set<number>();
        snapshot.forEach(doc => {
            const y = doc.data().year;
            if (y && typeof y === 'number') yearsSet.add(y);
        });
        const years = Array.from(yearsSet).sort((a, b) => b - a);
        return years.length > 0 ? years : [new Date().getFullYear()];
    } catch {
        return [new Date().getFullYear()];
    }
};

/**
 * Get dynamic columns for a specific year
 */
export const getColumnsForYear = async (year: number): Promise<string[]> => {
    try {
        const mails = await getMailsByYear(year);
        if (mails.length === 0) return [];

        // Get all unique keys from the first few documents
        const allKeys = new Set<string>();
        mails.slice(0, 5).forEach((mail) => {
            Object.keys(mail).forEach((key) => allKeys.add(key));
        });

        // Filter out technical fields
        const filteredKeys = Array.from(allKeys).filter(
            (key) => !['id', 'year', 'accessId', 'attachments', 'attachment_link'].includes(key)
        );

        return filteredKeys;
    } catch (error) {
        console.error('Error fetching columns:', error);
        return [];
    }
};
