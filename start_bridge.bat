@echo off
cd /d "%~dp0"

:: -------------------------------------------------------------
::  MAILTRACKER PRO BRIDGE RUNNER (LOCAL ONLY)
:: -------------------------------------------------------------
::  NOTE FOR DEPLOYMENT (VERCEL/NETLIFY):
::  This file and the entire 'bridge' folder are ignored on Vercel.
::  The Python Bridge runs ONLY on the local Windows PC where the 
::  MS Access database resides. It acts as a background agent pushing
::  data to Firebase/Google Drive.
:: -------------------------------------------------------------

echo Starting MailTrackerPro Bridge...

:: Check if .venv exists
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo Python environment not found. Please setup .venv first.
    pause
    exit
)

:: Run the tray application (invisible window)
start /min "" pythonw bridge/bridge_tray.py

exit
