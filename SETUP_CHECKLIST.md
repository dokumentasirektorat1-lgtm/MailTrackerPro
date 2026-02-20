# MailTrack Pro - Complete Setup Checklist

## ✅ Pre-Installation Checklist

### Requirements Verification
- [ ] Node.js 18+ installed on development machine
- [ ] Node.js 18+ installed on office PC (for Bridge)
- [ ] Windows OS on office PC
- [ ] MS Access installed (or at least ODBC driver)
- [ ] MS Access database (.accdb or .mdb file) available
- [ ] Network access to database (if on LAN)
- [ ] Google account for Firebase & Drive
- [ ] Credit card for Firebase (free tier available)

---

## 📋 Phase 1: Firebase Setup

### 1.1 Create Firebase Project
- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add project"
- [ ] Name: `mailtrack-pro` (or your preferred name)
- [ ] Disable Google Analytics (optional)
- [ ] Wait for project creation

### 1.2 Enable Authentication
- [ ] Click "Authentication" in sidebar
- [ ] Click "Get started"
- [ ] Go to "Sign-in method" tab
- [ ] Enable "Email/Password"
- [ ] Save changes

### 1.3 Create Firestore Database
- [ ] Click "Firestore Database" in sidebar
- [ ] Click "Create database"
- [ ] Choose "Start in production mode"
- [ ] Select location (closest to you)
- [ ] Click "Enable"

### 1.4 Set Firestore Rules
- [ ] Go to "Firestore Database" → "Rules"
- [ ] Replace with rules from SETUP_GUIDE.md
- [ ] Click "Publish"

### 1.5 Get Web App Config
- [ ] Go to Project Settings (gear icon)
- [ ] Scroll to "Your apps"
- [ ] Click Web icon (</>)
- [ ] Register app: `MailTrack Pro Web`
- [ ] Copy Firebase config object
- [ ] Save for later

### 1.6 Generate Service Account
- [ ] Go to Project Settings → Service Accounts
- [ ] Click "Generate new private key"
- [ ] Download JSON file
- [ ] Rename to `serviceAccountKey.json`
- [ ] Keep secure!

---

## ☁️ Phase 2: Google Drive Setup

### 2.1 Enable Drive API
- [ ] Go to https://console.cloud.google.com/
- [ ] Select Firebase project (auto-created)
- [ ] Go to "APIs & Services" → "Library"
- [ ] Search "Google Drive API"
- [ ] Click "Enable"

### 2.2 Create Drive Folder
- [ ] Go to https://drive.google.com/
- [ ] Create new folder: `MailTrack Attachments`
- [ ] Right-click → Get link
- [ ] Copy Folder ID from URL

### 2.3 Share with Service Account
- [ ] Right-click folder → Share
- [ ] Add service account email (from serviceAccountKey.json)
- [ ] Grant "Editor" permission
- [ ] Share

---

## 💻 Phase 3: Next.js Dashboard Setup

### 3.1 Clone/Navigate to Project
```bash
cd d:\PROGRAMMING\MailTrackerPro
```
- [ ] Verified in correct directory

### 3.2 Install Dependencies
```bash
npm install
```
- [ ] Installation completed successfully
- [ ] No critical errors in output

### 3.3 Create Environment File
```bash
copy .env.local.example .env.local
```
- [ ] File created

### 3.4 Configure Environment
Edit `.env.local`:
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY → from Firebase config
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN → from Firebase config
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID → from Firebase config
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET → from Firebase config
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID → from Firebase config
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID → from Firebase config

### 3.5 Test Development Server
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Landing page displays correctly

### 3.6 Create First Admin User
- [ ] Click "Create Account"
- [ ] Fill in details
- [ ] Register successfully
- [ ] Note: Will be on pending page

### 3.7 Promote to Admin (Firebase Console)
- [ ] Go to Firebase Console → Firestore
- [ ] Navigate to `users` collection
- [ ] Find your user document (by email)
- [ ] Click document
- [ ] Edit these fields:
  - [ ] `role`: Change to `"admin"`
  - [ ] `status`: Change to `"approved"`
- [ ] Save changes

### 3.8 Verify Admin Access
- [ ] Logout from web app
- [ ] Login again
- [ ] Should redirect to Dashboard (not pending)
- [ ] "Settings" menu visible
- [ ] "Users" menu visible

### 3.9 Create Config Document
- [ ] Go to Firebase Console → Firestore
- [ ] Click "Start collection"
- [ ] Collection ID: `config`
- [ ] Document ID: `system`
- [ ] Add fields:
  ```
  accessDbPath: "" (empty string)
  syncStatus: "offline"
  driveFolderId: "your-folder-id-from-step-2.2"
  ```
- [ ] Save document

---

## 🔌 Phase 4: Node.js Bridge Setup (Office PC)

### 4.1 Install MS Access ODBC Driver
- [ ] Determine Access version (32-bit or 64-bit)
  - Open Access → File → Account → About Access
- [ ] If 64-bit Access:
  - [ ] Download Microsoft Access Database Engine 2016 (64-bit)
  - [ ] Install
- [ ] If 32-bit Access:
  - [ ] Already included with Office
- [ ] Verify: Open "ODBC Data Sources (64-bit)" or "(32-bit)"
- [ ] Confirm "Microsoft Access Driver" is listed

### 4.2 Install Correct Node.js Version
- [ ] Go to https://nodejs.org/
- [ ] Download version matching Access:
  - 64-bit Access → 64-bit Node.js
  - 32-bit Access → 32-bit Node.js
- [ ] Install Node.js
- [ ] Verify installation:
  ```bash
  node --version
  npm --version
  ```

### 4.3 Navigate to Bridge Directory
```bash
cd d:\PROGRAMMING\MailTrackerPro\bridge
```
- [ ] In correct directory

### 4.4 Install Bridge Dependencies
```bash
npm install
```
- [ ] Installation completed
- [ ] No errors

### 4.5 Create Bridge Environment
```bash
copy .env.example .env
```
- [ ] File created

### 4.6 Configure Bridge Environment
Edit `bridge\.env`:
- [ ] FIREBASE_PROJECT_ID → your Firebase project ID
- [ ] GOOGLE_APPLICATION_CREDENTIALS → `./serviceAccountKey.json`
- [ ] GOOGLE_DRIVE_FOLDER_ID → from Phase 2.2
- [ ] SYNC_INTERVAL_MS → `30000` (30 seconds)

### 4.7 Copy Service Account Key
- [ ] Copy `serviceAccountKey.json` from Phase 1.6
- [ ] Paste into `bridge/` folder
- [ ] Verify file path: `d:\PROGRAMMING\MailTrackerPro\bridge\serviceAccountKey.json`

### 4.8 Test Database Connection
Create `bridge\test.js`:
```javascript
const odbc = require('odbc');

async function test() {
  try {
    const dbPath = 'C:\\Path\\To\\Your\\Database.accdb'; // CHANGE THIS
    const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};`;
    
    console.log('Connecting to:', dbPath);
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected!');
    
    const result = await connection.query('SELECT * FROM Mails');
    console.log(`✅ Found ${result.length} records`);
    console.log('Sample:', result[0]);
    
    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run test:
```bash
node test.js
```
- [ ] Connection successful
- [ ] Records retrieved
- [ ] No errors

### 4.9 Start Bridge
```bash
npm start
```
- [ ] Bridge starts without errors
- [ ] See message: "✅ Bridge is running!"
- [ ] See message: "👀 Watching for config changes..."

---

## ⚙️ Phase 5: Configuration & First Sync

### 5.1 Set Database Path via Web
- [ ] Open web dashboard (http://localhost:3000 or Vercel URL)
- [ ] Login as admin
- [ ] Go to "Settings"
- [ ] Enter MS Access Database Path:
  - Example local: `C:\Data\MailDB.accdb`
  - Example network: `\\Server\Share\MailDB.accdb`
- [ ] Enter Drive Folder ID (if not set)
- [ ] Click "Save Settings"
- [ ] See success message

### 5.2 Verify Bridge Response
Check Bridge console:
- [ ] See: "📡 Configuration update detected"
- [ ] See: "🔄 Database path changed to: ..."
- [ ] See: "🔄 Sync started at ..."
- [ ] See: "✅ Sync completed successfully"
- [ ] No errors in sync process

### 5.3 Verify Data in Firestore
- [ ] Go to Firebase Console → Firestore
- [ ] Check `mails` collection exists
- [ ] See documents with IDs like `2025_1`, `2025_2`, etc.
- [ ] Open a document
- [ ] Verify fields from Access DB are present

### 5.4 Verify Data in Web Dashboard
- [ ] Go to web dashboard
- [ ] Click "Dashboard"
- [ ] Check stats show correct numbers
- [ ] Go to "Directory"
- [ ] See mails listed in table
- [ ] Verify columns match Access DB fields
- [ ] Click a mail to view details
- [ ] Verify all fields display

### 5.5 Test Year Filtering
- [ ] In Directory page
- [ ] Change year dropdown
- [ ] Table updates with correct data
- [ ] Columns adjust if different per year

### 5.6 Test Search
- [ ] In Directory page
- [ ] Type in search box
- [ ] Results filter in real-time
- [ ] Clear search → all results return

---

## 🧪 Phase 6: Testing Features

### 6.1 User Management
- [ ] Register a new test user
- [ ] Should land on "Pending" page
- [ ] Login as admin
- [ ] Go to Admin → Users
- [ ] See pending user
- [ ] Click "Approve"
- [ ] Logout
- [ ] Login as test user
- [ ] Should access dashboard

### 6.2 LAN Resilience Test
- [ ] Disconnect network drive (or rename DB file)
- [ ] Wait for next sync
- [ ] Bridge shows: "❌ Sync failed"
- [ ] Dashboard shows: "Offline" status
- [ ] Dashboard still shows last data
- [ ] Reconnect database
- [ ] Bridge auto-recovers
- [ ] Dashboard shows: "Online" status

### 6.3 Dynamic Schema Test
- [ ] Add a new column to Access DB
- [ ] Add data to new column
- [ ] Wait for sync
- [ ] Go to Directory page
- [ ] New column appears in table
- [ ] Data from new column displays

### 6.4 PDF Attachment Test (if applicable)
- [ ] View a mail with attachments
- [ ] See attachment listed
- [ ] PDF viewer displays document
- [ ] Click "Open in Drive"
- [ ] Opens in new tab

---

## 🚀 Phase 7: Deployment

### 7.1 Deploy to Vercel
- [ ] Push code to GitHub (create repo if needed)
- [ ] Go to https://vercel.com/
- [ ] Click "New Project"
- [ ] Import GitHub repository
- [ ] Add environment variables:
  - [ ] NEXT_PUBLIC_FIREBASE_API_KEY
  - [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - [ ] NEXT_PUBLIC_FIREBASE_APP_ID
- [ ] Click "Deploy"
- [ ] Wait for deployment
- [ ] Test production URL

### 7.2 Update Firebase Auth Domain
- [ ] Go to Firebase Console → Authentication
- [ ] Go to Settings
- [ ] Add Vercel domain to authorized domains
- [ ] Save

### 7.3 Run Bridge as Windows Service (Optional)
See SETUP_GUIDE.md section on Windows Service

---

## ✅ Final Verification

### System Health Check
- [ ] Web dashboard accessible
- [ ] Can login successfully
- [ ] Dashboard shows correct stats
- [ ] Directory loads and filters work
- [ ] Mail details page works
- [ ] Settings page accessible (admin)
- [ ] User management works (admin)
- [ ] Bridge running and syncing
- [ ] Sync status shows "Online"
- [ ] No errors in Bridge console
- [ ] No errors in browser console
- [ ] Firestore has recent data

### Feature Checklist
- [ ] ✅ User registration
- [ ] ✅ Admin approval workflow
- [ ] ✅ Role-based access (user/admin)
- [ ] ✅ Year-based filtering
- [ ] ✅ Dynamic table columns
- [ ] ✅ Real-time search
- [ ] ✅ Mail detail view
- [ ] ✅ PDF viewer (if attachments exist)
- [ ] ✅ Remote configuration
- [ ] ✅ Sync status monitoring
- [ ] ✅ LAN failure resilience
- [ ] ✅ Composite ID handling (year_id)

---

## 📞 Post-Setup

### Documentation Review
- [ ] Read README.md for overview
- [ ] Read SETUP_GUIDE.md for details
- [ ] Bookmark QUICK_REFERENCE.md for commands
- [ ] Review IMPLEMENTATION_PLAN.md for architecture

### Maintenance Tasks
- [ ] Schedule regular Firestore backups
- [ ] Monitor Bridge logs for errors
- [ ] Update dependencies periodically
- [ ] Test user approval flow monthly
- [ ] Verify sync working daily

### Training
- [ ] Train admins on user approval
- [ ] Train admins on Settings configuration
- [ ] Train users on Directory search
- [ ] Document any custom workflows

---

## 🎉 Success!

If all items are checked, your MailTrack Pro system is:
- ✅ Fully operational
- ✅ Connected to MS Access
- ✅ Syncing to Firebase
- ✅ Accessible via web
- ✅ Secure and approved-access only
- ✅ Ready for production use

**Congratulations! 🎊**

---

## 📝 Notes & Customizations

Use this space to note any customizations or specific configurations for your installation:

```
Database Path: ___________________________________

Drive Folder ID: ___________________________________

Specific Table Name: ___________________________________

Custom Column Names: ___________________________________

Special Date Field: ___________________________________

Sync Interval: __________________________________

Other Notes:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

**Setup Date**: _________________  
**Setup By**: _________________  
**Version**: 1.0.0
