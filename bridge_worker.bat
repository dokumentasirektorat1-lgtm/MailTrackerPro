@echo off
:: Set Title (visible if console shown, useful for debugging)
title MailTrackerPro_Bridge_Process_V2

cd /d "%~dp0"

:: Activate Env
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo Python environment not found.
    exit /b 1
)

:: Run Python (GUI mode/pythonw) but WAIT for it to finish.
:: 'start /wait "" pythonw ...' ensures the batch file waits, preventing restart loops.
:: And 'pythonw' ensures no extra console window (besides the hidden parent one).
start /wait "" pythonw bridge/bridge_tray.py
