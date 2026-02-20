const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class DriveUploader {
    constructor() {
        this.drive = null;
        this.auth = null;
        this.initialized = false;
    }

    /**
     * Initialize Google Drive API
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Use service account authentication
            const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

            this.auth = new google.auth.GoogleAuth({
                keyFile: keyFile,
                scopes: ['https://www.googleapis.com/auth/drive.file'],
            });

            this.drive = google.drive({ version: 'v3', auth: this.auth });
            this.initialized = true;
            console.log('☁️ Google Drive initialized successfully');
        } catch (error) {
            console.error('❌ Google Drive initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Upload file to Google Drive
     */
    async uploadFile(filePath, fileName, folderId) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(`📤 Uploading ${fileName} to Drive...`);

            const fileMetadata = {
                name: fileName,
                parents: folderId ? [folderId] : [],
            };

            const media = {
                mimeType: 'application/pdf',
                body: await fs.createReadStream(filePath),
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink',
            });

            const file = response.data;

            // Make file viewable by anyone with the link
            await this.drive.permissions.create({
                fileId: file.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });

            console.log(`✅ Uploaded: ${fileName} (ID: ${file.id})`);

            return {
                fileName: file.name,
                driveFileId: file.id,
                driveViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
            };
        } catch (error) {
            console.error(`❌ Upload failed for ${fileName}:`, error.message);
            throw error;
        }
    }

    /**
     * Upload multiple attachments
     */
    async uploadAttachments(attachments, folderId) {
        const uploadedFiles = [];

        for (const attachment of attachments) {
            try {
                const result = await this.uploadFile(
                    attachment.path,
                    attachment.name,
                    folderId
                );
                uploadedFiles.push(result);
            } catch (error) {
                console.error(`⚠️ Skipping ${attachment.name} due to error`);
            }
        }

        return uploadedFiles;
    }

    /**
     * Check if file exists in Drive
     */
    async fileExists(fileName, folderId) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;

            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id, name, webViewLink)',
            });

            if (response.data.files && response.data.files.length > 0) {
                const file = response.data.files[0];
                return {
                    exists: true,
                    fileName: file.name,
                    driveFileId: file.id,
                    driveViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
                };
            }

            return { exists: false };
        } catch (error) {
            console.error('❌ Error checking file existence:', error.message);
            return { exists: false };
        }
    }

    /**
     * Get or upload file (avoid duplicates)
     */
    async getOrUploadFile(filePath, fileName, folderId) {
        // Check if file already exists
        const existingFile = await this.fileExists(fileName, folderId);

        if (existingFile.exists) {
            console.log(`♻️ File already exists: ${fileName}`);
            return existingFile;
        }

        // Upload new file
        return await this.uploadFile(filePath, fileName, folderId);
    }
}

module.exports = DriveUploader;
