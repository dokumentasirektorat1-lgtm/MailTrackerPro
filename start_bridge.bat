@echo off
cd /d "%~dp0"
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
