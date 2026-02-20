const admin = require('firebase-admin');

class FirebaseSyncer {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    /**
     * Initialize Firebase Admin SDK
     */
    initialize() {
        if (this.initialized) return;

        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID,
            });

            this.db = admin.firestore();
            this.initialized = true;
            console.log('🔥 Firebase initialized successfully');
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Sync mail records to Firestore
     * Uses composite ID format: {year}_{accessId}
     */
    async syncMails(mails, attachmentMap = {}) {
        if (!this.initialized) {
            this.initialize();
        }

        console.log(`🔄 Starting sync of ${mails.length} records...`);
        let successCount = 0;
        let errorCount = 0;

        let batch = this.db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 400; // Firestore limit is 500

        for (const mail of mails) {
            try {
                // Get Access DB ID (try various common ID fields)
                // Priority: 'NO URUT' seems to be the main ID in user's DB
                const accessId = mail['NO URUT'] || mail.ID || mail.id || mail.MailID || mail.mailId || mail.NoUrut;

                if (!accessId) {
                    // Only log every 10th warning to avoid spamming the logs if many records are invalid
                    if (errorCount % 10 === 0) {
                        console.warn('⚠️ Skipping record without ID (sample):', JSON.stringify(mail).substring(0, 100) + '...');
                    }
                    errorCount++; // Count as error/skipped
                    continue;
                }

                // Extract year from date field
                const year = this.extractYear(mail);

                // Create composite ID
                // Clean accessId to be safe for document ID
                const safeAccessId = String(accessId).replace(/\//g, '-');
                const compositeId = `${year}_${safeAccessId}`;

                // Prepare document data
                const docData = {
                    id: compositeId,
                    year: year,
                    accessId: String(accessId),
                    ...mail
                };

                // Add attachments if available
                if (attachmentMap[accessId]) {
                    docData.attachments = attachmentMap[accessId];
                }

                // Add to batch
                const docRef = this.db.collection('mails').doc(compositeId);
                batch.set(docRef, docData, { merge: true });
                batchCount++;
                successCount++;

                // Commit batch if size reached
                if (batchCount >= BATCH_SIZE) {
                    await batch.commit();
                    console.log(`📦 Committed batch of ${batchCount} records`);
                    // Create NEW batch
                    batch = this.db.batch();
                    batchCount = 0;
                }

            } catch (error) {
                console.error(`❌ Error processing record:`, error.message);
                errorCount++;
            }
        }

        // Commit remaining batch
        if (batchCount > 0) {
            await batch.commit();
            console.log(`📦 Committed final batch of ${batchCount} records`);
        }

        console.log(`✅ Sync complete: ${successCount} processed, ${errorCount} skipped/errors`);
        return { successCount, errorCount };
    }

    /**
     * Extract year from mail record
     */
    extractYear(mail) {
        // Try common date field names based on user's DB structure
        const dateFields = [
            'TANGGAL SURAT MASUK',
            'TANGGAL SURAT DITERIMA',
            'Date',
            'date',
            'MailDate',
            'CreatedDate',
            'Tanggal'
        ];

        for (const field of dateFields) {
            if (mail[field]) {
                try {
                    // Handle Indonesian Date Format (e.g., "1 Juli 2025")
                    const dateStr = String(mail[field]);

                    // Regex to find 4-digit year format (2020-2099)
                    const yearMatch = dateStr.match(/\b(20\d{2})\b/);
                    if (yearMatch) {
                        return parseInt(yearMatch[1]);
                    }

                    // Fallback to standard date parsing
                    const date = new Date(mail[field]);
                    if (!isNaN(date.getTime())) {
                        return date.getFullYear();
                    }
                } catch (error) {
                    // Continue to next field
                }
            }
        }

        // Default to current year if no date found
        return new Date().getFullYear();
    }

    /**
     * Update system configuration
     */
    async updateConfig(updates) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const configRef = this.db.collection('config').doc('system');
            await configRef.set(updates, { merge: true });
            console.log('⚙️ Config updated:', updates);
        } catch (error) {
            console.error('❌ Failed to update config:', error.message);
            throw error;
        }
    }

    /**
     * Update sync status
     */
    async updateSyncStatus(status, lastError = null) {
        const updates = {
            syncStatus: status,
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (lastError) {
            updates.lastError = lastError;
        }

        await this.updateConfig(updates);
    }

    /**
     * Listen to config changes
     */
    onConfigChange(callback) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }

        const configRef = this.db.collection('config').doc('system');

        return configRef.onSnapshot((snapshot) => {
            if (snapshot.exists) {
                const config = snapshot.data();
                console.log('📡 Config changed:', config);
                callback(config);
            }
        }, (error) => {
            console.error('❌ Error watching config:', error.message);
        });
    }
    /**
     * Listen for manual sync trigger
     */
    listenForManualSync(callback) {
        if (!this.initialized) return;

        const triggerRef = this.db.collection('config').doc('sync_trigger');

        return triggerRef.onSnapshot((snapshot) => {
            if (snapshot.exists) {
                const data = snapshot.data();
                if (data && data.trigger === true) {
                    console.log('⚡ Manual sync triggered!');
                    // Reset trigger immediately
                    triggerRef.set({ trigger: false, triggeredAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
                    callback();
                }
            }
        });
    }

    /**
     * Log an audit entry with user-friendly solution
     * @param {Error|string} error The error object or message
     * @param {string} context Context of where the error occurred
     * @param {string} level 'error', 'warning', or 'info'
     */
    async logAudit(error, context = 'Bridge', level = 'error') {
        if (!this.initialized) {
            // Cannot log if firestore is not ready, just console it
            console.error('Cannot write audit log (Firebase not init):', error);
            return;
        }

        const message = error.message || error.toString();
        let solution = 'Please contact technical support.';

        // Simple Error Mapper for User-Friendly Solutions
        if (message.includes('ENOENT') || message.includes('not found')) {
            solution = 'The system cannot find the specified file or directory. Please check if the Database Path in settings is correct and the file actually exists on your computer.';
        } else if (message.includes('EBUSY') || message.includes('locked')) {
            solution = 'The database file is currently in use by another program (likely Microsoft Access). Please close MS Access and try again, or wait a moment.';
        } else if (message.includes('ETIMEDOUT') || message.includes('network')) {
            solution = 'Network connection timed out. Please check your internet connection.';
        } else if (message.includes('permission') || message.includes('EACCES')) {
            solution = 'Permission denied. Try running the bridge as Administrator.';
        } else if (message.includes('Module not found')) {
            solution = 'A required system component is missing. Please try reinstalling the bridge or running "npm install" in the bridge folder.';
        } else if (message.includes('Excel')) {
            solution = 'Issue with Excel/Access driver. Ensure you have the Microsoft Access Database Engine 2010 or 2016 Redistributable installed (32-bit if Node is 32-bit, 64-bit otherwise).';
        }

        try {
            const auditRef = this.db.collection('audit_logs').doc();
            await auditRef.set({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                level: level,
                message: message,
                context: context,
                solution: solution,
                source: 'bridge',
                readBy: [] // Empty initially
            });
            console.log(`📝 Audit log written: [${level}] ${message}`);
        } catch (logError) {
            console.error('❌ Failed to write audit log:', logError.message);
        }
    }
}

module.exports = FirebaseSyncer;
