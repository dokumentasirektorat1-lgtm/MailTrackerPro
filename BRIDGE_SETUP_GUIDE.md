# 🔧 Panduan Setup Node.js Bridge

## Masalah: "Bridge Offline" atau "Database Unknown"

Bridge Node.js adalah komponen yang menghubungkan MS Access database dengan Firebase. Untuk menjalankannya dengan benar:

## ✅ Langkah-Langkah Setup

### 1. **Siapkan MS Access Database**
   - Pastikan file MS Access (.accdb atau .mdb) sudah ada di komputer Anda
   - Catat **FULL PATH** ke file tersebut (bukan hanya nama file!)
   
   **Contoh Path yang BENAR:**
   ```
   C:\Data\DATA SURAT MASUK BIRO REKTOR 2025.accdb
   D:\Database\Mail.accdb
   \\Server\SharedFolder\MailDB.accdb
   ```
   
   **Contoh Path yang SALAH:**
   ```
   DATA SURAT MASUK BIRO REKTOR 2025.accdb  ❌ (tidak ada full path)
   Mail.accdb  ❌ (relatif path)
   ```

### 2. **Install MS Access Driver (Jika Belum)**
   Bridge memerlukan **Microsoft Access Database Engine** untuk koneksi ODBC:
   
   - Download dari: [Microsoft Access Database Engine 2016](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
   - Pilih versi yang sesuai:
     - **AccessDatabaseEngine.exe** untuk 32-bit
     - **AccessDatabaseEngine_X64.exe** untuk 64-bit
   - Install sesuai arsitektur Node.js Anda
   
   **Cara cek arsitektur Node.js:**
   ```powershell
   node -p "process.arch"
   ```

### 3. **Konfigurasi di Web Dashboard**
   
   a. Buka halaman **Settings** di web dashboard
   
   b. Masukkan **Full Path** ke MS Access Database:
      ```
      Contoh: C:\Users\YourName\Documents\DATA SURAT MASUK BIRO REKTOR 2025.accdb
      ```
   
   c. Masukkan **Google Drive Folder ID**:
      - Buka Google Drive folder tempat file akan diupload
      - Copy ID dari URL: `drive.google.com/drive/folders/[FOLDER_ID_INI]`
      - Paste ke field "Google Drive Folder ID"
   
   d. Klik **Save Settings**

### 4. **Jalankan Bridge**
   
   Buka **Terminal BARU** (terpisah dari `npm run dev`):
   
   ```powershell
   cd d:\PROGRAMMING\MailTrackerPro\bridge
   npm start
   ```
   
   **Anda harus melihat output seperti ini:**
   ```
   🚀 MailTrack Pro Bridge Starting...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Firebase Admin SDK initialized
   ✅ Google Drive API initialized
   👀 Watching for config changes...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Bridge is running!
   ```

### 5. **Verifikasi Koneksi**
   
   Setelah bridge berjalan, kembali ke **Dashboard** web app:
   - Status seharusnya berubah menjadi: **"Node.js Bridge: Online"** ✅
   - Warna indikator berubah menjadi **hijau**
   - Sync status menampilkan waktu terakhir sync

## 🔍 Troubleshooting

### Problem: "Database file not found"
**Solusi:**
1. Pastikan path yang dimasukkan adalah **FULL PATH** (bukan nama file saja)
2. Cek apakah file benar-benar ada di lokasi tersebut
3. Gunakan File Explorer → klik kanan file → Properties → copy "Location" + "\\" + "Nama file"

### Problem: "ODBC Driver not found"
**Solusi:**
1. Install Microsoft Access Database Engine (lihat langkah #2 di atas)
2. Pastikan menginstall **versi yang sama** dengan arsitektur Node.js
3. Restart terminal setelah install driver

### Problem: Bridge tetap offline setelah beberapa detik
**Solusi:**
1. Cek nama tabel di MS Access Database
2. Default: Bridge mencari tabel bernama **"Mails"**
3. Jika nama tabel berbeda, update di `bridge/index.js` line 118 dan 122

### Problem: Permission Denied
**Solusi:**
1. Pastikan file MS Access tidak sedang dibuka di aplikasi lain
2. Cek permission file (right-click → Properties → Security)
3. Jika database di network share, pastikan punya akses read

## 📝 Catatan Penting

- **Bridge harus tetap berjalan** di terminal terpisah selama aplikasi digunakan
- Bridge akan otomatis sync setiap 30 detik (default)
- Jika database path berubah, Bridge akan otomatis reconnect
- Log Bridge akan menampilkan detail error jika ada masalah

## 🎯 Langkah Cepat (Quick Start)

```powershell
# 1. Cari full path file Access database Anda
# Contoh: C:\Users\Admin\Documents\DATA SURAT MASUK BIRO REKTOR 2025.accdb

# 2. Buka Settings di web dashboard dan input path tersebut

# 3. Di terminal baru:
cd d:\PROGRAMMING\MailTrackerPro\bridge
npm start

# 4. Biarkan bridge tetap running

# 5. Refresh dashboard, status seharusnya "Online" ✅
```

## ❓ Butuh Bantuan Lebih Lanjut?

Jika masih mengalami masalah, cek log di terminal bridge untuk error message yang lebih detail. Bridge akan memberikan informasi spesifik tentang masalah yang terjadi.
