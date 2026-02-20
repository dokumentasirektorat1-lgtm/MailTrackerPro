# MailTrack Pro

<div align="center">

![MailTrack Pro](https://img.shields.io/badge/MailTrack-Pro-0ea5e9?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-orange?style=for-the-badge&logo=firebase)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)

**Comprehensive Mail Management System**

Synchronize MS Access databases to Firebase with Google Drive integration

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 📋 Overview

**MailTrack Pro** adalah sistem manajemen surat lengkap yang menghubungkan database MS Access lokal/LAN ke cloud Firebase dengan integrasi Google Drive untuk lampiran dokumen.

### Mengapa MailTrack Pro?

✨ **Remote Management** - Kelola database Access dari mana saja via web browser  
🔄 **Real-time Sync** - Sinkronisasi otomatis antara Access dan Firebase  
☁️ **Cloud Storage** - Lampiran tersimpan aman di Google Drive  
🔐 **Secure Access** - Sistem approval user dan role-based access  
📊 **Dynamic Schema** - Otomatis mendeteksi kolom database (tidak perlu konfigurasi manual)  
🌐 **LAN Resilient** - Tetap berfungsi meski koneksi LAN terputus sementara  
📅 **Smart Year Management** - Handling ID komposit untuk data tahunan

---

## ✨ Features

### Web Dashboard (Next.js + Vercel)
- 🎨 **Modern UI** - Beautiful, responsive design dengan glassmorphism
- 🔐 **Authentication** - Email/password dengan approval workflow
- 📊 **Dynamic Directory** - Tabel otomatis menyesuaikan kolom per tahun
- 🔍 **Advanced Search** - Filter by year, search multiple fields
- 👁️ **PDF Viewer** - Integrated Google Drive viewer (no download)
- ⚙️ **Remote Settings** - Configure database path from web
- 👥 **User Management** - Approve/reject users, manage roles

### Node.js Bridge (Office PC)
- 🔌 **ODBC Connector** - Direct MS Access connection
- 🔄 **Auto Sync** - Periodic synchronization to Firestore
- 📡 **Config Monitoring** - Real-time response to web settings
- 🆔 **Composite IDs** - Smart year_id handling (2025_1, 2026_1, etc.)
- ☁️ **Drive Upload** - Automatic attachment upload to Google Drive
- 🛡️ **Failure Resilience** - Continues running even if LAN is down
- 📊 **Status Reporting** - Live sync status to dashboard

### Firebase Backend
- 🔥 **Firestore** - Scalable NoSQL database
- 🔐 **Authentication** - Secure user management
- 🔒 **Security Rules** - Role-based access control
- ⚡ **Real-time** - Live config updates to Bridge

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd d:\PROGRAMMING\MailTrackerPro
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... etc
```

### 3. Run Dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Setup Bridge (Office PC)

```bash
cd bridge
npm install
# Configure .env with Firebase credentials
npm start
```

📖 **For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Dashboard (Vercel)                    │
│                      Next.js 14 + React                      │
│                  users → dashboard → settings                │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
                   ┌─────────────────┐
                   │  Firebase Cloud │
                   ├─────────────────┤
                   │  • Firestore    │
                   │  • Auth         │
                   │  • Real-time    │
                   └────────┬────────┘
                            │
                            ↓
              ┌─────────────────────────┐
              │   Node.js Bridge (PC)   │
              ├─────────────────────────┤
              │  • Config Monitor       │
              │  • ODBC Connector       │
              │  • Sync Engine          │
              │  • Drive Uploader       │
              └──────┬──────────────┬───┘
                     │              │
         ┌───────────┘              └────────────┐
         ↓                                       ↓
┌─────────────────┐                  ┌──────────────────┐
│   MS Access DB  │                  │  Google Drive    │
│  (Local/LAN)    │                  │  (Attachments)   │
│                 │                  │                  │
│  • Mails table  │                  │  • PDFs          │
│  • Dynamic cols │                  │  • Public links  │
└─────────────────┘                  └──────────────────┘
```

---

## 📁 Project Structure

```
MailTrackerPro/
├── app/                        # Next.js App Router
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── pending/
│   ├── dashboard/              # Main dashboard
│   ├── directory/              # Mail directory
│   │   └── [id]/              # Detail view
│   ├── settings/               # System settings (admin)
│   └── admin/
│       └── users/              # User management
│
├── components/                 # React components
│   ├── auth/                   # Auth components
│   └── layout/                 # Layout components
│
├── lib/                        # Business logic
│   ├── firebase/               # Firebase services
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   └── firestore.ts
│   └── hooks/                  # Custom hooks
│
├── bridge/                     # Node.js Bridge
│   ├── index.js               # Main entry
│   ├── db-connector.js        # MS Access ODBC
│   ├── firebase-sync.js       # Firestore sync
│   ├── drive-uploader.js      # Google Drive
│   └── package.json
│
├── SETUP_GUIDE.md             # Complete setup guide
└── IMPLEMENTATION_PLAN.md     # Technical plan
```

---

## 🔑 Key Features Explained

### 1. 🆔 Annual ID Handling (Composite IDs)

**Problem**: MS Access ID resets to 1 every year, causing conflicts.

**Solution**: Create composite IDs `{year}_{accessId}`

```
2025_1 → Mail ID 1 from year 2025
2025_2 → Mail ID 2 from year 2025
2026_1 → Mail ID 1 from year 2026 (no conflict!)
```

### 2. 📊 Dynamic Schema Mapping

**Problem**: Database columns may vary per year or installation.

**Solution**: Auto-detect columns using `Object.keys()`

```javascript
// Automatically generates table headers from data
const columns = getColumnsForYear(2025);
// → ['subject', 'sender', 'recipient', 'date', ...]
```

### 3. 🔄 LAN Connection Resilience

**Problem**: Network drives may disconnect temporarily.

**Solution**: Bridge shows "offline" but keeps last known data

```javascript
if (!databaseAccessible) {
  updateStatus('offline');
  // Dashboard still shows last synced data
}
```

### 4. ⚙️ Remote Configuration

**Problem**: Database path changes require server access.

**Solution**: Configure via web dashboard

```javascript
// Admin changes path in Settings
updateConfig({ accessDbPath: '\\Server\Share\data.accdb' });

// Bridge monitors Firestore and auto-updates
onConfigChange((config) => {
  connectToDatabase(config.accessDbPath);
});
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Custom CSS
- **UI**: SweetAlert2
- **Auth**: Firebase Authentication
- **Database**: Firebase Firestore

### Backend Bridge
- **Runtime**: Node.js 18+
- **Database**: ODBC (MS Access)
- **Cloud**: Firebase Admin SDK
- **Storage**: Google Drive API
- **Language**: JavaScript (CommonJS)

### Infrastructure
- **Hosting**: Vercel (Dashboard)
- **Database**: Firebase Firestore
- **Storage**: Google Drive
- **Bridge**: Windows Service (Office PC)

---

## 📚 Documentation

- **[Setup Guide](./SETUP_GUIDE.md)** - Complete installation instructions
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Technical architecture
- **[Bridge README](./bridge/README.md)** - Bridge-specific docs (to be created)

---

## 🔐 Security

- ✅ Firebase Authentication with email/password
- ✅ Firestore Security Rules (role-based)
- ✅ User approval workflow (gated access)
- ✅ Admin-only settings and user management
- ✅ Service account for Bridge (no public credentials)
- ✅ Environment variables for sensitive data

---

## 🎯 Use Cases

### Perfect For:
- 📬 **Mail/Document Tracking** - Track incoming/outgoing mail
- 📋 **Archive Management** - Organize documents by year
- 🏢 **Office Administration** - Centralized mail management
- 🌐 **Remote Teams** - Access mail records from anywhere
- 📊 **Reporting** - Generate statistics and reports
- 🔍 **Search & Discovery** - Quickly find specific documents

---

## 🚦 System Requirements

### Web Dashboard (Any Device)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection

### Bridge Server (Office PC)
- **OS**: Windows 7/10/11 or Windows Server
- **Node.js**: Version 18+ (matching Access bit version)
- **MS Access Driver**: 32-bit or 64-bit ODBC driver
- **RAM**: 2GB minimum
- **Network**: Access to LAN database (if network share)
- **Internet**: Required for Firebase sync

---

## 🤝 Contributing

This is a custom enterprise solution. For modifications:

1. Review the architecture in `IMPLEMENTATION_PLAN.md`
2. Test changes locally first
3. Update security rules if Firestore structure changes
4. Document any new features

---

## 📝 License

Proprietary - Internal Use Only

---

## 🎉 Credits

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Google Drive API](https://developers.google.com/drive)
- [ODBC](https://github.com/markdirish/node-odbc)

---

## 📞 Support

For technical support:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Review Bridge console logs
3. Check Firebase Console for errors
4. Verify Firestore security rules

---

<div align="center">

**MailTrack Pro** - Modern Mail Management for the Digital Age

Made by Senior Full-stack Developer & System Architect

</div>
