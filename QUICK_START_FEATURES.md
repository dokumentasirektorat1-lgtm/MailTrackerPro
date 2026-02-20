# MailTrack Pro - Quick Start Guide

## 🎯 Panduan Cepat Menggunakan Fitur Baru

---

## 1. Navigasi dengan Sidebar

### Desktop (Layar Besar):
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [Sidebar]              [Main Content]                 │
│  │                                                      │
│  │ MailTrack Pro        ═══ Welcome back, User! ═══    │
│  │                                                      │
│  │ [Profile]            [📊 Stats Cards]               │
│  │ Mulyo Agung          ┌──────┬──────┬──────┬──────┐  │
│  │ Administrator        │ 156  │  42  │  89  │ 287  │  │
│  │                      │Masuk │Proses│Selesai│Total│  │
│  │ ● Online             └──────┴──────┴──────┴──────┘  │
│  │                                                      │
│  │ ▶ Dashboard          [📈 Activity Chart]            │
│  │   Mail Directory                                    │
│  │   User Management    [📋 Recent Activity]           │
│  │   Sync Logs                                         │
│  │   Settings                                          │
│  │                                                      │
│  │ [Sign Out]                                          │
│  │                                                      │
└─────────────────────────────────────────────────────────┘
```

**Cara Navigasi:**
1. Klik menu di sidebar kiri
2. Menu aktif akan ter-highlight biru
3. Sidebar selalu terlihat

---

### Mobile (Layar Kecil):
```
┌─────────────────────────┐
│ ☰  Welcome!        🔔   │  <- Top Bar
├─────────────────────────┤
│                         │
│  [📊 Stats Cards]       │
│  ┌────────┬────────┐    │
│  │  156   │   42   │    │
│  │ Masuk  │ Proses │    │
│  └────────┴────────┘    │
│  ┌────────┬────────┐    │
│  │   89   │  287   │    │
│  │ Selesai│ Total  │    │
│  └────────┴────────┘    │
│                         │
│  [📈 Chart]             │
│                         │
└─────────────────────────┘

Tap ☰ ──▶ Sidebar muncul dari kiri
              dengan overlay
```

**Cara Navigasi:**
1. **Tap hamburger icon (☰)** di kiri atas
2. Sidebar muncul dari kiri dengan overlay gelap
3. Pilih menu yang diinginkan
4. Sidebar otomatis tertutup setelah memilih

---

## 2. Dashboard Features

### A. Statistik Surat (Cards)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 📧 MASUK   │  │ ⏱️ PROSES  │  │ ✅ SELESAI │  │ 📊 TOTAL   │
│             │  │             │  │             │  │             │
│    156      │  │     42      │  │     89      │  │    287      │
│ Surat Masuk │  │Dalam Proses │  │   Selesai   │  │Total Surat  │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
   (Biru)           (Kuning)         (Hijau)          (Ungu)
```

**Informasi:**
- **Surat Masuk**: Surat baru yang belum diproses
- **Dalam Proses**: Surat yang sedang ditangani
- **Selesai**: Surat yang sudah selesai diproses
- **Total Surat**: Jumlah semua surat di sistem

---

### B. Grafik Aktivitas Harian

```
     ┌─────────────────────────────────────────────┐
  20 │                     ▓▓                       │
     │                     ▓▓                       │
  15 │         ▓▓          ▓▓                       │
     │         ▓▓          ▓▓          ▓▓           │
  10 │   ▓▓    ▓▓          ▓▓    ▓▓    ▓▓           │
     │   ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓     │
   5 │   ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓     │
     └─────────────────────────────────────────────┘
       Sun   Mon   Tue   Wed   Thu   Fri   Sat
```

**Features:**
- Menampilkan aktivitas 7 hari terakhir
- Hover untuk melihat jumlah detail
- Update otomatis setiap hari

---

### C. Recent Activity Widget

```
┌─────────────────────────────────────────────────────┐
│ Aktivitas Terakhir                    Lihat Semua → │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📧  Surat Undangan Rapat                           │
│     From: Kepala Dinas                             │
│     [MASUK] • 15 Feb 2026                          │
│                                                     │
│ 📧  Laporan Keuangan Q1                            │
│     From: Bagian Keuangan                          │
│     [PROSES] • 14 Feb 2026                         │
│                                                     │
│ 📧  Permohonan Izin Cuti                           │
│     From: Staff HR                                 │
│     [SELESAI] • 14 Feb 2026                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Informasi:**
- 5 surat terakhir yang masuk/diupdate
- Klik "Lihat Semua" untuk ke Mail Directory

---

## 3. Sync Logs Page

**Akses:** Sidebar → Sync Logs (Admin only)

```
┌─────────────────────────────────────────────────────┐
│ Sync Logs                              [Refresh]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │  Total   │ │ Success  │ │ Failed   │ │Partial ││
│  │   150    │ │   142    │ │    5     │ │   3    ││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
│  Filter: [All] [Success] [Failed]                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Timestamp     │ Status  │ Records │ Errors  │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 15 Feb 09:30  │ SUCCESS │   142   │    0    │  │
│  │ 15 Feb 09:00  │ SUCCESS │   138   │    0    │  │
│  │ 15 Feb 08:30  │ FAILED  │     0   │   12    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Lihat riwayat sinkronisasi
- Filter by status (All/Success/Failed)
- Detail error messages
- Refresh manual

---

## 4. Settings - File Selector

**Akses:** Sidebar → Settings (Admin only)

### Sebelum (Cara Lama):
```
MS Access Database Path:
┌───────────────────────────────────────────────┐
│ \\Server\Share\data.accdb                    │  <- Copy-paste manual
└───────────────────────────────────────────────┘
```

### Sesudah (Cara Baru):
```
MS Access Database Path:
┌────────────────────────────────────┬──────────┐
│ \\Server\Share\data.accdb          │ [Select] │  <- Klik button
└────────────────────────────────────┴──────────┘
         ↑                                  ↑
    Auto-filled                      File Picker
```

**Cara Menggunakan:**
1. Klik button **"Select File"**
2. File browser akan terbuka
3. Pilih file `.accdb` atau `.mdb`
4. Path otomatis terisi
5. Klik **"Save Settings"**

**Atau:**
- Tetap bisa ketik/paste path secara manual jika diperlukan

---

## 5. Role-Based Access

### Admin:
✅ Dashboard
✅ Mail Directory  
✅ User Management
✅ Sync Logs
✅ Settings

### User:
✅ Dashboard
✅ Mail Directory  
❌ User Management (tidak terlihat)
❌ Sync Logs (tidak terlihat)
❌ Settings (tidak terlihat)

---

## 6. Keyboard Shortcuts (Future)

Shortcuts yang bisa diimplementasikan:
- `Ctrl/Cmd + K` - Global search
- `Ctrl/Cmd + B` - Toggle sidebar
- `Esc` - Close sidebar (mobile)
- `G + D` - Go to Dashboard
- `G + M` - Go to Mail Directory

---

## 7. Troubleshooting

### Sidebar tidak muncul di mobile:
✅ Pastikan **tap hamburger icon (☰)** di kiri atas
✅ Cek apakah ada error di console browser

### Stats tidak update:
✅ Pastikan **Node.js Bridge** running
✅ Cek sync status di dashboard
✅ Refresh halaman (F5)

### File selector tidak berfungsi:
✅ Browser harus support File API
✅ Cek apakah file `.accdb`/`.mdb` yang dipilih
✅ Pastikan file accessible dari sistem

### Sidebar stuck open:
✅ Klik area gelap (overlay) untuk close
✅ Atau klik tombol X di sidebar
✅ Refresh halaman jika masih stuck

---

## 8. Tips & Best Practices

### Performance:
- Dashboard akan load data saat pertama kali dibuka
- Recent activity hanya ambil 5 terakhir
- Chart data untuk 7 hari terakhir saja

### UX:
- Hover di chart bars untuk lihat detail
- Click cards akan highlight (future: bisa link ke filtered view)
- Sidebar auto-close setelah navigasi di mobile

### Data:
- Stats update real-time dari Firestore
- Sync logs limited to 100 entries
- Chart data cached per session

---

## 🎨 Color Reference

| Status/Type      | Color      | Hex Code  |
|-----------------|------------|-----------|
| Surat Masuk     | Blue       | #3B82F6   |
| Dalam Proses    | Yellow     | #EAB308   |
| Selesai         | Green      | #10B981   |
| Total Surat     | Purple     | #8B5CF6   |
| Success         | Green      | #10B981   |
| Failed/Error    | Red        | #EF4444   |
| Warning         | Yellow     | #F59E0B   |
| Partial         | Orange     | #F97316   |

---

## 📞 Support

Jika menemukan bug atau butuh bantuan:
1. Check console browser untuk error messages
2. Check Node.js Bridge status
3. Check Firestore connection
4. Review IMPLEMENTATION_UPDATE.md untuk detail teknis

---

**Last Updated:** 2026-02-15  
**Version:** 1.0.0  
**Author:** MailTrack Pro Team
