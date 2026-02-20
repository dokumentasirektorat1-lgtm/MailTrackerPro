@echo off
setlocal

:: --- CONFIGURATION ---
set "TASK_NAME=MailTrackerPro_Bridge_Tray"
:: Use Python 3.13 specifically via py launcher to ensure dependencies match
set "PYTHON_EXE=py"
set "ARGS=-3.13 -w"
set "SCRIPT_PATH=%~dp0bridge\bridge_tray.py"

:: Check if script exists
if not exist "%SCRIPT_PATH%" (
    echo [ERROR] Script not found: %SCRIPT_PATH%
    pause
    exit /b 1
)

:: Verify py launcher exists
where py >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python Launcher 'py' not found. Please install Python for Windows.
    pause
    exit /b 1
)

echo ===================================================
echo   REGISTERING TASK SCHEDULER: %TASK_NAME%
echo ===================================================
echo.
echo Script Path: %SCRIPT_PATH%
echo Target: Python 3.13 (via py launcher)
echo.

:: Create the Task
:: /SC ONLOGON - Run at user logon
:: /TR - The command to run.
:: /F - Force overwrite if exists
:: Command structure: py -3.13 -w "Path\To\Script.py"

schtasks /Create /F /SC ONLOGON /TN "%TASK_NAME%" /TR "\"%PYTHON_EXE%\" %ARGS% \"%SCRIPT_PATH%\""

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Task registered successfully!
    echo The bridge will now start automatically when you log in.
    echo.
    echo Attempting to start the task now...
    schtasks /Run /TN "%TASK_NAME%"
) else (
    echo.
    echo [ERROR] Failed to register task. Ensure you run this as Administrator.
)

pause
