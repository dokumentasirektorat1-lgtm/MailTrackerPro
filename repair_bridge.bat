@echo off
cd /d "%~dp0"
echo Activating Virtual Environment...
call .venv\Scripts\activate

echo.
echo ===================================================
echo     REPAIRING PYWIN32 (Win32com) INSTALLATION
echo ===================================================
echo.
echo Running pywin32_postinstall.py...
python .venv\Scripts\pywin32_postinstall.py -install

echo.
echo ===================================================
echo     VERIFYING INSTALLATION
echo ===================================================
python -c "import win32com.client; print('Success! win32com is working.')"

echo.
pause
