require('dotenv').config();
const DatabaseConnector = require('./db-connector');
const FirebaseSyncer = require('./firebase-sync');
const DriveUploader = require('./drive-uploader');
const Logger = require('./logger');
const net = require('net');

// SINGLE INSTANCE CHECK PORT
const LOCK_PORT = 56789;

class MailTrackBridge {
    constructor() {
        this.dbConnector = new DatabaseConnector();
        this.firebaseSyncer = new FirebaseSyncer();
        this.driveUploader = new DriveUploader();

        this.currentConfig = null;
        this.schedulerTimeout = null;
        this.manualSyncListener = null;
        this.configUnsubscribe = null;
        this.isRunning = false;
    }

    /**
     * Start the bridge
     */
    async start() {
        console.log('🚀 MailTrack Pro Bridge Starting...');
        console.log('━'.repeat(50));

        try {
            // Initialize Firebase
            this.firebaseSyncer.initialize();
            console.log('✅ Firebase Admin SDK initialized');

            // Initialize Google Drive
            await this.driveUploader.initialize();
            console.log('✅ Google Drive API initialized');

            // Watch for configuration changes
            this.watchConfig();
            console.log('👀 Watching for config changes...');

            this.isRunning = true;
            console.log('━'.repeat(50));
            console.log('✅ Bridge is running!');
            console.log('Press Ctrl+C to stop');
            console.log('━'.repeat(50));

        } catch (error) {
            console.error('❌ Bridge startup failed:', error.message);
            // Try to log if firebase is somewhat ready
            try {
                if (this.firebaseSyncer.initialized) {
                    await this.firebaseSyncer.logAudit(error, 'Startup', 'error');
                }
            } catch (e) { }
            process.exit(1);
        }
    }

    /**
     * Watch for configuration changes from Firestore
     */
    watchConfig() {
        this.configUnsubscribe = this.firebaseSyncer.onConfigChange(async (config) => {
            console.log('📡 Configuration update detected');

            // Check if database path changed
            const pathChanged = !this.currentConfig || this.currentConfig.accessDbPath !== config.accessDbPath;

            this.currentConfig = config;

            if (pathChanged && config.accessDbPath) {
                console.log(`🔄 Database path changed to: ${config.accessDbPath}`);

                // Clear existing sync schedule
                if (this.schedulerTimeout) {
                    clearTimeout(this.schedulerTimeout);
                }

                // Start new sync cycle
                await this.startSyncCycle();
            }
        });
    }

    /**
     * Start sync cycle
     */
    async startSyncCycle() {
        if (!this.currentConfig || !this.currentConfig.accessDbPath) {
            console.log('⚠️ No database path configured. Waiting for configuration...');
            return;
        }

        // Setup Manual Sync Listener if not already active
        if (!this.manualSyncListener) {
            console.log('🎧 Listening for manual sync triggers...');
            this.manualSyncListener = this.firebaseSyncer.listenForManualSync(() => {
                console.log('⚡ Manual sync requested by user!');
                this.performSync();
            });
        }

        // Smart Scheduler Logic
        const scheduleNext = () => {
            const now = new Date();
            const hour = now.getHours();
            let delay = 0;
            let shouldSync = false;
            let mode = '';

            // 08:00 - 13:59: Rare (15 minutes)
            if (hour >= 8 && hour < 14) {
                mode = 'RARE (15m)';
                delay = 15 * 60 * 1000;
                shouldSync = true;
            }
            // 14:00 - 16:59: Frequent (2 mins) - Rush Hour
            else if (hour >= 14 && hour < 17) {
                mode = 'FREQUENT (2m)';
                delay = 2 * 60 * 1000;
                shouldSync = true;
            }
            // Outside 08:00 - 17:00: Manual Only
            else {
                mode = 'OFF-HOURS (Manual Only)';
                // Check again in 30 mins to see if schedule changed
                delay = 30 * 60 * 1000;
                shouldSync = false;
            }

            console.log(`🕒 ${now.toLocaleTimeString()} - Scheduler: ${mode}. Next check in ${Math.round(delay / 60000)}m.`);

            const action = shouldSync ? this.performSync() : Promise.resolve();

            action.finally(() => {
                this.schedulerTimeout = setTimeout(scheduleNext, delay);
            });
        };

        // Start the loop
        scheduleNext();
    }

    /**
     * Perform single sync operation
     */
    async performSync() {
        console.log('\n' + '━'.repeat(50));
        console.log(`🔄 Sync started at ${new Date().toLocaleString()}`);
        console.log('━'.repeat(50));

        try {
            const dbPath = this.currentConfig.accessDbPath;

            // Step 1: Connect to database
            const isAccessible = await this.dbConnector.isAccessible(dbPath);

            if (!isAccessible) {
                const err = new Error('Database not accessible. Check path and network connection.');
                await this.firebaseSyncer.logAudit(err, 'Database Access', 'error');
                throw err;
            }

            await this.dbConnector.connect(dbPath);

            // Step 2: Auto-detect table name
            const tableNames = await this.dbConnector.getTableNames();
            console.log(`📊 Available tables: ${tableNames.join(', ')}`);

            // Try to find mail table (try common names)
            const possibleNames = ['Mails', 'Mail', 'SuratMasuk', 'Surat', 'tblMails', 'tblSurat'];
            let mailTableName = null;

            for (const name of possibleNames) {
                if (tableNames.includes(name)) {
                    mailTableName = name;
                    break;
                }
            }

            // If not found, use first non-system table
            if (!mailTableName && tableNames.length > 0) {
                mailTableName = tableNames.find(name => !name.startsWith('MSys'));
            }

            if (!mailTableName) {
                throw new Error('No suitable table found in database. Please check your Access database structure.');
            }

            console.log(`✅ Using table: "${mailTableName}"`);

            // Step 3: Get table schema (for dynamic column detection)
            const columns = await this.dbConnector.getTableColumns(mailTableName);
            console.log(`📋 Detected ${columns.length} columns: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);

            // Step 4: Fetch all mails
            const mails = await this.dbConnector.getAllMails(mailTableName);
            console.log(`📧 Retrieved ${mails.length} mail records`);

            // Step 5: Process attachments (if applicable)
            // This is a placeholder - actual implementation depends on your Access DB structure
            const attachmentMap = {}; // Map of accessId -> attachments[]

            // Step 5: Sync to Firestore
            const result = await this.firebaseSyncer.syncMails(mails, attachmentMap);

            // Step 6: Update sync status
            await this.firebaseSyncer.updateSyncStatus('online');

            console.log('━'.repeat(50));
            console.log(`✅ Sync completed successfully`);
            console.log(`   - Records synced: ${result.successCount}`);
            console.log(`   - Errors: ${result.errorCount}`);
            console.log('━'.repeat(50));

        } catch (error) {
            console.error('\n❌ Sync failed:', error.message);

            // Log operational error to audit logs
            await this.firebaseSyncer.logAudit(error, 'Sync Process', 'error');

            // Update Firestore with offline status
            try {
                await this.firebaseSyncer.updateSyncStatus('offline', error.message);
            } catch (updateError) {
                console.error('❌ Failed to update offline status:', updateError.message);
            }

            console.log('━'.repeat(50));
            console.log('⚠️ Will retry on next interval...');
            console.log('━'.repeat(50));
        }
    }

    /**
     * Stop the bridge
     */
    async stop() {
        console.log('\n🛑 Stopping bridge...');

        if (this.schedulerTimeout) {
            clearTimeout(this.schedulerTimeout);
        }

        if (this.manualSyncListener) {
            this.manualSyncListener(); // Unsubscribe
        }

        if (this.configUnsubscribe) {
            this.configUnsubscribe();
        }

        await this.dbConnector.disconnect();

        this.isRunning = false;
        console.log('✅ Bridge stopped');
    }
}

// ==========================================
// MAIN EXECUTION WITH SINGLE CHECK
// ==========================================

let bridge;
const server = net.createServer();

server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Another instance is already running on port ${LOCK_PORT}. Exiting...`);
        // Exit quickly to prevent resource hogging
        process.exit(1);
    } else {
        console.error('❌ Failed to bind to lock port:', err);
        process.exit(1);
    }
});

server.once('listening', () => {
    // Only proceed if we acquired the lock
    console.log(`🔒 Acquired single-instance lock on port ${LOCK_PORT}`);

    // Setup logger now
    Logger.setupLogger();

    // Instantiate and start bridge
    bridge = new MailTrackBridge();
    bridge.start().catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
});

// Try to bind to the lock port
server.listen(LOCK_PORT, '127.0.0.1');

// ==========================================
// SHUTDOWN HANDLERS
// ==========================================

async function gracefulShutdown() {
    console.log('\n\n📡 Received shutdown signal...');
    if (bridge) {
        await bridge.stop();
    }
    server.close();
    process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = MailTrackBridge;
