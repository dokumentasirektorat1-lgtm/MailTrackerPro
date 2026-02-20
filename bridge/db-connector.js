const MDBReader = require('mdb-reader');
const fs = require('fs');
const path = require('path');

class DatabaseConnector {
    constructor() {
        this.db = null;
        this.currentPath = null;
    }

    /**
     * Connect to MS Access database using mdb-reader (no ODBC needed!)
     */
    async connect(dbPath) {
        try {
            // Close existing connection if path changed
            if (this.db && this.currentPath !== dbPath) {
                await this.disconnect();
            }

            // Return existing connection if same path
            if (this.db && this.currentPath === dbPath) {
                return this.db;
            }

            console.log(`📂 Connecting to database: ${dbPath}`);

            // Validate path
            let absolutePath = dbPath;
            if (!path.isAbsolute(dbPath)) {
                absolutePath = path.resolve(dbPath);
                console.log(`📍 Resolved to absolute path: ${absolutePath}`);
            }

            // Check if file exists
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Database file not found at path: ${absolutePath}\n\n❗ Please check:\n   1. File path is correct\n   2. File exists at the location\n   3. Use full path (e.g., C:\\Data\\database.accdb or \\\\Server\\Share\\database.accdb)`);
            }

            // Read database file
            const buffer = fs.readFileSync(absolutePath);
            this.db = new MDBReader(buffer);
            this.currentPath = absolutePath;

            console.log('✅ Database connected successfully (using mdb-reader)');
            return this.db;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            this.db = null;
            this.currentPath = null;
            throw error;
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        if (this.db) {
            try {
                this.db = null;
                console.log('🔌 Database disconnected');
            } catch (error) {
                console.error('Error disconnecting:', error.message);
            } finally {
                this.db = null;
                this.currentPath = null;
            }
        }
    }

    /**
     * Get all mails from a specific table
     */
    async getAllMails(tableName = 'Mails') {
        try {
            if (!this.db) {
                throw new Error('Database not connected');
            }

            // Get table
            const table = this.db.getTable(tableName);

            if (!table) {
                throw new Error(`Table "${tableName}" not found in database`);
            }

            // Get all rows as objects
            const mails = table.getData();

            console.log(`📧 Retrieved ${mails.length} records from ${tableName}`);
            return mails;
        } catch (error) {
            console.error(`❌ Failed to retrieve mails from ${tableName}:`, error.message);
            throw error;
        }
    }

    /**
     * Get table schema
     */
    async getTableColumns(tableName = 'Mails') {
        try {
            if (!this.db) {
                throw new Error('Database not connected');
            }

            const table = this.db.getTable(tableName);

            if (!table) {
                throw new Error(`Table "${tableName}" not found`);
            }

            // Get column names
            const columns = table.getColumnNames();
            console.log(`📋 Columns in ${tableName}:`, columns);
            return columns;
        } catch (error) {
            console.error(`❌ Failed to get columns from ${tableName}:`, error.message);
            return [];
        }
    }

    /**
     * Check if database is accessible
     */
    async isAccessible(dbPath) {
        try {
            await this.connect(dbPath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get all table names in database
     */
    async getTableNames() {
        try {
            if (!this.db) {
                throw new Error('Database not connected');
            }

            const tableNames = this.db.getTableNames();
            console.log(`📊 Tables in database:`, tableNames);
            return tableNames;
        } catch (error) {
            console.error('❌ Failed to get table names:', error.message);
            return [];
        }
    }
}

module.exports = DatabaseConnector;
