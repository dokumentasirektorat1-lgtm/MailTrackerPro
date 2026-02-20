@echo off
cd /d "%~dp0"

:: -------------------------------------------------------------
::  MAILTRACKER PRO BRIDGE LAUNCHER
:: -------------------------------------------------------------
::  Script ini akan menjalankan 'run_bridge_tray.ps1' secara hidden.
::  PS1 tersebut bertindak sebagai Watchdog (Auto-Resart jika crash).
::  Logika utama bridge ada di 'bridge/bridge_tray.py'.
:: -------------------------------------------------------------

echo Starting MailTrackerPro Watchdog & Bridge...

:: Jalankan PowerShell script dalam mode Hidden (WindowStyle Hidden)
:: Ini memastikan aplikasi berjalan di background/tray.
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "run_bridge_tray.ps1"

exit
