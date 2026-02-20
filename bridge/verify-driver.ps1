# Verification Script - Run di PowerShell
Write-Host "Checking ODBC Drivers..." -ForegroundColor Cyan

# Get all Access drivers
$drivers = Get-OdbcDriver | Where-Object {$_.Name -like '*Access*'}

# Check for 64-bit driver
$driver64 = $drivers | Where-Object {$_.Platform -eq '64-bit'}

if ($driver64) {
    Write-Host "`n✅ SUCCESS: 64-bit Access Driver found!" -ForegroundColor Green
    Write-Host "Driver Name: $($driver64.Name)" -ForegroundColor Green
    Write-Host "`nYou can now restart the bridge." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ ERROR: 64-bit driver not found" -ForegroundColor Red
    Write-Host "Please reinstall AccessDatabaseEngine_X64.exe" -ForegroundColor Red
}

Write-Host "`nAll Access Drivers:" -ForegroundColor Cyan
$drivers | Select-Object Name, Platform | Format-Table
