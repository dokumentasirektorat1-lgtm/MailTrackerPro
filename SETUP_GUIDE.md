# MailTrack Pro - Complete Setup Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Setup](#firebase-setup)
4. [Google Drive API Setup](#google-drive-api-setup)
5. [Next.js Dashboard Setup](#nextjs-dashboard-setup)
6. [Node.js Bridge Setup](#nodejs-bridge-setup)
7. [Deployment](#deployment)
8. [Usage](#usage)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**MailTrack Pro** is a comprehensive mail management system that synchronizes MS Access databases to Firebase, with Google Drive integration for attachments.

### System Components:
- **Next.js Web Dashboard** (Vercel) - User interface
- **Firebase** - Authentication & Firestore database
- **Google Drive** - Attachment storage
- **Node.js Bridge** (Office PC) - Data synchronization

---

## 📦 Prerequisites

### For Web Dashboard:
- Node.js 18+ installed
- npm or yarn package manager

### For Node.js Bridge (Office PC):
- Node.js 18+ installed
- Windows OS (for MS Access ODBC driver)
- MS Access Database Driver installed
  - **32-bit Access**: Install 32-bit Node.js
  - **64-bit Access**: Install 64-bit Node.js
- Network access to LAN database (if using network path)

---

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `mailtrack-pro`
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode**
4. Choose location (closest to your region)

### Step 4: Set Security Rules

Go to **Firestore → Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     (request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Mails collection
    match /mails/{mailId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
      allow write: if false; // Only Bridge can write
    }
    
    // Config collection
    match /config/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Step 5: Get Web App Credentials

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click **Web** icon (</>)
4. Register app name: `MailTrack Pro Web`
5. Copy Firebase configuration object

### Step 6: Generate Service Account Key (for Bridge)

1. Go to **Project Settings** → **Service Accounts**
2. Click "Generate new private key"
3. Download JSON file
4. Rename to `serviceAccountKey.json`
5. Save for Bridge setup

---

## ☁️ Google Drive API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `mailtrack-pro`
3. Select the project

### Step 2: Enable Google Drive API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click "Enable"

### Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "Service Account"
3. Name: `mailtrack-bridge`
4. Click "Create and Continue"
5. Grant role: **Editor**
6. Click "Done"

### Step 4: Generate Service Account Key

1. Click on the created service account
2. Go to **Keys** tab
3. Click "Add Key" → "Create new key"
4. Choose **JSON** format
5. Download the key file
6. This can be the same as Firebase service account key

### Step 5: Create Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder: `MailTrack Attachments`
3. Right-click folder → "Share"
4. Add the service account email (from the key file)
5. Grant **Editor** permission
6. Copy the Folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

---

## 🌐 Next.js Dashboard Setup

### Step 1: Install Dependencies

```bash
cd d:\PROGRAMMING\MailTrackerPro
npm install
```

### Step 2: Configure Environment Variables

Create `.env.local` in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace values from Firebase Web App config (Step 5 in Firebase Setup).

### Step 3: Initialize Firestore Collections

You need to create initial documents:

1. **Create first admin user**:
   - Register through the web app
   - Manually update in Firebase Console:
     - Go to Firestore → `users` collection
     - Find your user document
     - Change `role` to `admin`
     - Change `status` to `approved`

2. **Create config document**:
   - Go to Firestore → Create collection `config`
   - Create document with ID: `system`
   - Add fields:
     ```json
     {
       "accessDbPath": "",
       "syncStatus": "offline",
       "driveFolderId": "your-drive-folder-id"
     }
     ```

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5: Test the Application

1. Register a new account
2. Login with admin account
3. Approve the new user in Admin → Users
4. Configure database path in Settings

---

## 🔌 Node.js Bridge Setup

### Step 1: Install MS Access ODBC Driver

**For Windows:**

1. Check your Access version (32-bit or 64-bit)
2. Download matching driver:
   - **64-bit**: [Microsoft Access Database Engine 2016](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
   - **32-bit**: Included with MS Office

3. Install the driver
4. Verify installation:
   - Open "ODBC Data Sources (64-bit)" or "(32-bit)"
   - Check for "Microsoft Access Driver (*.mdb, *.accdb)"

### Step 2: Install Node.js (Matching Bit Version)

- For 64-bit Access → Install 64-bit Node.js
- For 32-bit Access → Install 32-bit Node.js

Download from [nodejs.org](https://nodejs.org/)

### Step 3: Navigate to Bridge Directory

```bash
cd d:\PROGRAMMING\MailTrackerPro\bridge
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env`:
   ```env
   FIREBASE_PROJECT_ID=your_project_id
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
   SYNC_INTERVAL_MS=30000
   ```

### Step 6: Add Service Account Key

1. Copy the `serviceAccountKey.json` file from Firebase setup
2. Place it in the `bridge` folder:
   ```
   bridge/
   ├── serviceAccountKey.json  ← Here
   ├── index.js
   ├── package.json
   └── ...
   ```

### Step 7: Test Database Connection

Create a test script `test-connection.js`:

```javascript
const odbc = require('odbc');

async function test() {
  try {
    const dbPath = 'C:\\Your\\Database\\Path.accdb';
    const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};`;
    
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully!');
    
    const result = await connection.query('SELECT * FROM Mails');
    console.log(`📧 Found ${result.length} records`);
    
    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run: `node test-connection.js`

### Step 8: Start the Bridge

```bash
npm start
```

You should see:
```
🚀 MailTrack Pro Bridge Starting...
✅ Firebase Admin SDK initialized
✅ Google Drive API initialized
👀 Watching for config changes...
✅ Bridge is running!
```

### Step 9: Configure from Web Dashboard

1. Login to web dashboard as admin
2. Go to **Settings**
3. Enter MS Access database path:
   - Local: `C:\Data\MailDB.accdb`
   - Network: `\\Server\Share\MailDB.accdb`
4. Click "Save Settings"

Bridge will automatically detect the change and start syncing!

---

## 🚀 Deployment

### Deploy Next.js to Vercel

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Push code to GitHub

3. Go to [vercel.com](https://vercel.com/)

4. Click "New Project"

5. Import your GitHub repository

6. Add environment variables (same as `.env.local`)

7. Deploy!

### Run Bridge as Windows Service

1. Install `node-windows`:
   ```bash
   npm install -g node-windows
   ```

2. Create `install-service.js`:
   ```javascript
   const Service = require('node-windows').Service;
   
   const svc = new Service({
     name: 'MailTrack Pro Bridge',
     description: 'Synchronizes MS Access to Firebase',
     script: 'D:\\PROGRAMMING\\MailTrackerPro\\bridge\\index.js'
   });
   
   svc.on('install', () => {
     svc.start();
   });
   
   svc.install();
   ```

3. Run as administrator:
   ```bash
   node install-service.js
   ```

---

## 📖 Usage

### For Regular Users:

1. **Register**: Create account on the web dashboard
2. **Wait for Approval**: Admin must approve your account
3. **Login**: Access the dashboard after approval
4. **Browse Directory**: Filter by year, search mails
5. **View Details**: Click any mail to see full details and attachments

### For Administrators:

1. **Approve Users**: Admin → Users → Approve/Reject
2. **Configure System**: Settings → Set database path
3. **Monitor Sync**: Dashboard shows sync status
4. **Manage Roles**: Change user roles to admin

---

## 🔧 Troubleshooting

### Bridge Shows "Offline"

**Possible causes:**
1. Database path incorrect
2. Network drive not accessible
3. ODBC driver not installed
4. Bit version mismatch (32-bit vs 64-bit)

**Solutions:**
- Verify path in Settings
- Check network connectivity
- Reinstall ODBC driver (matching bit version)
- Restart Bridge

### Can't Login After Registration

**Cause:** Account not approved

**Solution:** Admin must approve in Admin → Users

### Google Drive PDF Not Showing

**Causes:**
1. File not publicly shared
2. Incorrect Drive File ID
3. Network/firewall blocking Drive

**Solutions:**
- Check file permissions in Drive
- Verify driveFileId in Firestore
- Try opening driveViewLink directly

### Sync Not Working

**Check:**
1. Bridge is running (`npm start`)
2. serviceAccountKey.json exists
3. Environment variables set correctly
4. Firestore security rules configured
5. Database path set in web Settings

---

## 📞 Support

For issues or questions, check:
- Implementation Plan: `IMPLEMENTATION_PLAN.md`
- Bridge logs in console
- Firebase Console → Firestore for data
- Browser console for frontend errors

---

## 🎉 Congratulations!

Your MailTrack Pro system is now ready to use!

**Key Features:**
✅ Web-based management
✅ MS Access synchronization
✅ Google Drive attachments
✅ User approval workflow
✅ Dynamic schema detection
✅ LAN failure resilience
✅ Real-time configuration
✅ Year-based organization

