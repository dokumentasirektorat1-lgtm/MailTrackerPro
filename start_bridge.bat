@echo off
cd /d "%~dp0"

:: -------------------------------------------------------------
::  MAILTRACKER PRO BRIDGE LAUNCHER
:: -------------------------------------------------------------
::  Script ini akan menjalankan 'run_bridge_tray.ps1' secara hidden.
::  PS1 tersebut bertindak sebagai Watchdog (Auto-Resart jika crash).
::  Logika utama bridge ada di 'bridge/bridge_tray.py'.
:: -------------------------------------------------------------

:: Mulai Bridge secara tersembunyi tanpa powershell
start "" wscript.exe "%~dp0start_hidden.vbs"

exit
