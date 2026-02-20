param (
    [string]$Action = "Install"
)

$TaskName = "MailTrackerBridgeAutoStart"
$ScriptPath = Join-Path $PSScriptRoot "run_bridge_tray.ps1"
$VbsPath = Join-Path $PSScriptRoot "start_hidden.vbs"

# Create VBScript wrapper to launch PowerShell completely hidden (no flash)
$VbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$ScriptPath""", 0, False
"@
Set-Content -Path $VbsPath -Value $VbsContent -Force

# Create Startup Shortcut
$WScriptShell = New-Object -ComObject WScript.Shell
$StartupDir = $WScriptShell.SpecialFolders.Item("Startup")
$ShortcutPath = Join-Path -Path $StartupDir -ChildPath "MailTracker Bridge.lnk"

if (Test-Path $ShortcutPath) {
    Remove-Item $ShortcutPath -Force
}

$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = """$VbsPath"""
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Starts MailTracker Pro Bridge in System Tray"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Save()

Write-Host "✅ Bridge Auto-Start Configured!" -ForegroundColor Green
Write-Host "   - Mode: System Tray (Hidden Icons)"
Write-Host "   - Script: $ScriptPath"
Write-Host "   - Shortcut: $ShortcutPath"
Write-Host ""
Write-Host "To test now, double-click 'start_hidden.vbs' in this folder."
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
