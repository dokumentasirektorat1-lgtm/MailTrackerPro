@echo off
echo Killing all bridge processes...
schtasks /End /TN "MailTrackerPro_Bridge_Tray"
taskkill /F /IM pythonw.exe
taskkill /F /IM py.exe
taskkill /F /IM python.exe
exit /b 0
