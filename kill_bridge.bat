@echo off
echo Killing all bridge processes...
schtasks /End /TN "MailTrackerPro_Bridge_Tray"
taskkill /F /IM pythonw.exe /T 2>nul
taskkill /F /IM py.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul
exit /b 0
