# MailTrack Pro - Quick Reference

## 🚀 Quick Commands

### Dashboard (Next.js)
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Access at: http://localhost:3000
```

### Bridge (Node.js)
```bash
cd bridge

# Install dependencies
npm install

# Run bridge
npm start

# Run with auto-restart (development)
npm run dev
```

---

## 🔑 Default Access

### First Admin Setup
1. Register at `/auth/register`
2. Go to Firebase Console
3. Navigate to Firestore → `users` collection
4. Find your user document (by email)
5. Change:
   - `role`: `"admin"`
   - `status`: `"approved"`

### Firestore Collections

```javascript
// Collection: config
// Document ID: system
{
  accessDbPath: "C:\\Data\\MailDB.accdb",  // or \\Server\Share\DB.accdb
  syncStatus: "online" | "offline",
  lastSyncAt: Timestamp,
  driveFolderId: "your-drive-folder-id",
  driveApiKey: "optional-api-key"
}

// Collection: mails
// Document ID: {year}_{accessId} (e.g., "2025_1")
{
  id: "2025_1",
  year: 2025,
  accessId: 1,
  subject: "...",
  sender: "...",
  recipient: "...",
  date: Timestamp,
  attachments: [
    {
      fileName: "document.pdf",
      driveFileId: "abc123...",
      driveViewLink: "https://drive.google.com/..."
    }
  ]
  // + dynamic fields from Access DB
}

// Collection: users
// Document ID: {userId}
{
  uid: "user-id",
  email: "user@example.com",
  displayName: "John Doe",
  role: "user" | "admin",
  status: "pending" | "approved" | "rejected",
  createdAt: Timestamp,
  approvedAt: Timestamp,
  approvedBy: "admin-uid"
}
```

---

## 🔧 Common Tasks

### Add New User as Admin
```javascript
// Firebase Console → Firestore → users → [userId]
{
  role: "admin",          // Change from "user"
  status: "approved"      // Change from "pending"
}
```

### Change Database Path
1. Login as admin
2. Go to **Settings**
3. Update "MS Access Database Path"
4. Click "Save Settings"
5. Bridge auto-detects and reconnects

### Check Sync Status
- **Dashboard**: Top right shows "Online" or "Offline"
- **Settings Page**: Full status with last sync time
- **Bridge Console**: Real-time logs

### Manually Trigger Sync
Bridge syncs automatically every 30 seconds (configurable).

To change interval:
```env
# bridge/.env
SYNC_INTERVAL_MS=60000  # 60 seconds
```

---

## 📊 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isApproved() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
    }
    
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    // Mails
    match /mails/{mailId} {
      allow read: if isApproved();
      allow write: if false;  // Only Bridge writes
    }
    
    // Config
    match /config/{configId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

---

## 🌐 Environment Variables

### Dashboard (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Bridge (.env)
```env
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
GOOGLE_DRIVE_FOLDER_ID=
SYNC_INTERVAL_MS=30000
```

---

## 🐛 Troubleshooting Quick Fixes

### "Database not accessible"
```bash
# Check path format
Local:   C:\Data\MailDB.accdb
Network: \\Server\Share\MailDB.accdb

# Verify ODBC driver installed
# Control Panel → Administrative Tools → ODBC Data Sources
```

### "Firebase initialization failed"
```bash
# Check serviceAccountKey.json exists in bridge/
# Verify FIREBASE_PROJECT_ID in .env
# Ensure internet connection
```

### "User stuck on pending"
```javascript
// Firebase Console → Firestore → users → [userId]
// Change status to "approved"
```

### "Sync shows offline but database exists"
```bash
# Check Bridge console for errors
# Verify database path in Settings
# Check network connectivity
# Restart Bridge: Ctrl+C then npm start
```

### "PDF not showing in detail page"
```javascript
// Check Firestore → mails → [mailId] → attachments
// Verify driveFileId and driveViewLink exist
// Test driveViewLink in browser directly
```

---

## 📱 Key Pages & Routes

```
Public:
  /                     → Landing page
  /auth/login           → Login
  /auth/register        → Register

Protected:
  /dashboard            → Home dashboard
  /directory            → Mail directory (dynamic table)
  /directory/[id]       → Mail detail & PDF viewer
  /auth/pending         → Pending approval page

Admin Only:
  /settings             → System configuration
  /admin/users          → User management
```

---

## 🔄 Sync Flow Diagram

```
┌──────────────┐
│  Web Admin   │
│  Sets Path   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Firestore   │
│  config/     │
│  system      │
└──────┬───────┘
       │ (onSnapshot)
       ↓
┌──────────────┐
│   Bridge     │
│  Detects     │
│  Change      │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Connect to  │
│  MS Access   │
│  Database    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Read Mails  │
│  with ODBC   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Transform   │
│  Data        │
│  (year_id)   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Upload to   │
│  Firestore   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Web Users   │
│  See Data    │
└──────────────┘
```

---

## 💡 Pro Tips

1. **Composite IDs**: Always use format `{year}_{accessId}` for unique identification
2. **Dynamic Columns**: No need to hardcode columns - auto-detected from data
3. **LAN Resilience**: Dashboard shows last known data even if Bridge is offline
4. **Year Filtering**: Users can switch years to see historical data
5. **Admin Approval**: New users can't access until approved by admin
6. **Real-time Config**: Bridge responds to web changes in ~1 second
7. **PDF Security**: Files are view-only (no download) via Drive viewer

---

## 📞 Support Checklist

When reporting issues, include:
- [ ] Bridge console logs
- [ ] Browser console errors
- [ ] Firebase Console screenshot
- [ ] Database path being used
- [ ] Windows & Node.js version (for Bridge)
- [ ] Access database version (32-bit or 64-bit)

---

## 🎓 Learning Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Google Drive API**: https://developers.google.com/drive/api/guides/about-sdk
- **ODBC Node**: https://github.com/markdirish/node-odbc

---

**Last Updated**: {{ current_date }}  
**Version**: 1.0.0
