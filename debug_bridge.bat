@echo off
cd /d "%~dp0"
echo Starting MailTrackerPro Bridge (Debug Mode)...

:: Activate Virtual Env
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo Python environment not found. Please setup .venv first.
    pause
    exit
)

:: Run the tray application with full console output (python.exe, NOT pythonw.exe)
python bridge/bridge_tray.py

echo.
echo Process exited. Check for errors above.
pause
