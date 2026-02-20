@echo off
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM pythonw.exe /T 2>nul
taskkill /F /IM powershell.exe /T 2>nul
echo All bridge processes stopped.
pause
