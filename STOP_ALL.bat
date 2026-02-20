@echo off
echo STOPPING LOOP...
taskkill /F /IM node.exe /T
taskkill /F /IM wscript.exe /T
taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq MailTrackerPro_Bridge_Process_V2*" /T
echo Done.
