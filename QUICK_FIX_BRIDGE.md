# ✅ SOLUSI: Bridge Offline → Online

## 🎯 Masalah Anda
Anda sudah input file MS Access dan Drive ID, tapi bridge masih **offline** karena:
- ❌ Path database yang diinput: `DATA SURAT MASUK BIRO REKTOR 2025.accdb`
- ✅ Yang diperlukan: **FULL PATH** (contoh: `C:\Users\...\DATA SURAT MASUK BIRO REKTOR 2025.accdb`)

## 📍 Cara Mendapatkan Full Path Database

### Metode 1: Via File Explorer
1. Buka **File Explorer**
2. Cari file `DATA SURAT MASUK BIRO REKTOR 2025.accdb`
3. **Klik kanan** → **Properties**
4. Copy **Location** + tambahkan `\` + nama file

   **Contoh hasil:**
   ```
   C:\Users\YourName\Documents\DATA SURAT MASUK BIRO REKTOR 2025.accdb
   ```

### Metode 2: Via Address Bar
1. Buka folder tempat file database berada
2. **Klik** pada address bar di File Explorer
3. **Copy** path yang muncul
4. Tambahkan `\DATA SURAT MASUK BIRO REKTOR 2025.accdb` di akhirnya

## 🚀 Langkah Selanjutnya

### 1. Update Path di Settings
1. Buka **Settings** page di dashboard web (`http://localhost:3000/settings`)
2. Di field **"MS Access Database Path"**, masukkan **FULL PATH** yang sudah Anda dapatkan
3. Pastikan Drive Folder ID sudah benar: `1lFvS8ZH7MajHoFs1BOWaf1mk3GPn3SRK`
4. Klik **Save Settings**

### 2. Pastikan Bridge Tetap Running
Bridge sudah berjalan di background. Jika sudah close terminal, jalankan lagi:

```powershell
# Di terminal BARU (jangan close yang `npm run dev`)
cd d:\PROGRAMMING\MailTrackerPro\bridge
npm start
```

Biarkan terminal ini **tetap terbuka** selama aplikasi digunakan.

### 3. Refresh Dashboard
Setelah save settings dengan full path:
1. Kembali ke **Dashboard** (`http://localhost:3000/dashboard`)
2. **Refresh** halaman (F5)
3. Status akan berubah dari **"Unknown"** → **"Online"** ✅

## 🎨 Yang Akan Berubah

**SEBELUM (Offline):**
```
Node.js Bridge: Unknown
❌ Bridge is offline or database is unreachable
```

**SESUDAH (Online):**
```
Node.js Bridge: Online ✅
✓ Bridge is actively monitoring for changes
Last sync: [timestamp]
```

## 📋 Checklist

- [ ] Cari full path ke file `DATA SURAT MASUK BIRO REKTOR 2025.accdb`
- [ ] Update path di **Settings** page
- [ ] Pastikan Drive Folder ID: `1lFvS8ZH7MajHoFs1BOWaf1mk3GPn3SRK`
- [ ] Klik **Save Settings**
- [ ] Bridge sedang running di terminal
- [ ] Refresh dashboard
- [ ] Status berubah menjadi **"Online"** ✅

## ⚠️ Catatan Penting

1. **MS Access Driver diperlukan!**
   - Jika bridge tetap error setelah full path benar, install:
   - [Microsoft Access Database Engine 2016](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
   - Pilih versi 64-bit jika Node.js Anda 64-bit

2. **Bridge harus tetap running**
   - Jangan close terminal bridge
   - Bridge akan sync otomatis setiap 30 detik

3. **Cek Log Bridge**
   - Jika masih offline, lihat error di terminal bridge
   - Error message akan memberitahu masalah spesifik

## 🆘 Masih Bermasalah?

Baca panduan lengkap di: **`BRIDGE_SETUP_GUIDE.md`**
