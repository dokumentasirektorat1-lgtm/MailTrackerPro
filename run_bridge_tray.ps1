[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

Add-Type -MemberDefinition '
    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, UInt32 Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
' -Name Win32Utils -Namespace User32

$scriptPath = $PSScriptRoot
$bridgeScript = Join-Path $scriptPath "bridge_worker.bat"
$UNIQUE_TITLE = "MailTrackerPro_Bridge_Process_V2"
$global:manualExit = $false
$lastRestartTime = [DateTime]::MinValue
$global:currentBridgeProcess = $null

# ---------------------------------------------------------
# Helper: Check if bridge_tray.py is actually running
# Uses process list instead of window handle because
# pythonw.exe is headless (no window title or handle).
# ---------------------------------------------------------
function Test-BridgeRunning {
    # Check for node running the bridge script
    $procs = Get-Process -Name "node" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        try {
            # Get Command Line via WMI
            $cmdline = (Get-WmiObject Win32_Process -Filter "ProcessId=$($p.Id)").CommandLine
            if ($cmdline -match "index\.js") { return $true }
        }
        catch {}
    }
    return $false
}

# ---------------------------------------------------------
# CRITICAL: SINGLE INSTANCE CHECK (MUTEX)
# ---------------------------------------------------------
$mutexName = "Global\MailTrackerPro_Tray_Mutex"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (!$mutex.WaitOne(0, $false)) { exit }

# ---------------------------------------------------------
# Helper: Get Current Valid Handle
# ---------------------------------------------------------
function Get-CurrentHandle {
    # Check saved process object first
    if ($global:currentBridgeProcess -and -not $global:currentBridgeProcess.HasExited) {
        return [IntPtr]::Zero  # Placeholder non-zero equivalent for compatibility
    }
    # Fallback: search by window title (for visible cmd windows if any)
    $proc = Get-Process | Where-Object { $_.MainWindowTitle -match $UNIQUE_TITLE } | Select-Object -First 1
    if ($proc) {
        $global:currentBridgeProcess = $proc
        return $proc.MainWindowHandle
    }
    return [IntPtr]::Zero
}

# ---------------------------------------------------------
# Helper: Start Bridge Process
# ---------------------------------------------------------
function Start-BridgeProcess {
    param([bool]$StartVisible = $false)

    # 1. COOLDOWN CHECK
    $now = Get-Date
    if (($now - $global:lastRestartTime).TotalSeconds -lt 15) { return }
    $global:lastRestartTime = $now

    # 2. RUNNING CHECK â€” use process existence, not window handle
    #    pythonw.exe is headless so it never has a MainWindowHandle.
    if (Test-BridgeRunning) { return }

    # 3. START IT
    $p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bridgeScript`"" -WindowStyle Hidden -PassThru
    $global:currentBridgeProcess = $p
    Write-Host "[Watchdog] Bridge process started. PID: $($p.Id)"
}

# ---------------------------------------------------------
# Initial Start
# ---------------------------------------------------------
Start-BridgeProcess -StartVisible $false

# ---------------------------------------------------------
# Tray Icon Setup
# ---------------------------------------------------------
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
try {
    $notifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -Id $PID).MainModule.FileName)
}
catch {
    $notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
}
$notifyIcon.Text = "MailTracker Pro Bridge"
$notifyIcon.Visible = $true

$contextMenu = New-Object System.Windows.Forms.ContextMenu

# Action: Toggle / Revive
$ToggleAction = {
    $handle = Get-CurrentHandle
    
    if ($handle -eq [IntPtr]::Zero) {
        # Revive Visible
        Start-BridgeProcess -StartVisible $true
        return
    }

    # Force Show (SW_RESTORE = 9)
    # Using 'IsWindowVisible' isn't enough for Minimized windows sometimes.
    # We check if it's ICONIC (Minimized) OR HIDDEN (Visible= False)
    
    if ([User32.Win32Utils]::IsWindowVisible($handle)) {
        # It's visible. Is it minimized?
        if ([User32.Win32Utils]::IsIconic($handle)) {
            # Minimized -> Restore
            [User32.Win32Utils]::ShowWindow($handle, 9)
            [User32.Win32Utils]::SetForegroundWindow($handle)
        }
        else {
            # Visible & Normal -> Hide
            [User32.Win32Utils]::ShowWindow($handle, 0)
        }
    }
    else {
        # Hidden -> Restore
        [User32.Win32Utils]::ShowWindow($handle, 9)
        [User32.Win32Utils]::SetForegroundWindow($handle)
    }
}


$menuItemShow = New-Object System.Windows.Forms.MenuItem
$menuItemShow.Text = "Show/Hide Console"
$menuItemShow.add_Click($ToggleAction)

$menuItemExit = New-Object System.Windows.Forms.MenuItem
$menuItemExit.Text = "Exit Bridge"
$menuItemExit.add_Click({
        $res = [System.Windows.Forms.MessageBox]::Show("Are you sure you want to completely stop the bridge?", "Exit", [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Question)
    
        if ($res -eq "Yes") {
            $global:manualExit = $true
            $timer.Stop()
            $notifyIcon.Visible = $false
        
            # Kill tracked process
            if ($global:currentBridgeProcess -and -not $global:currentBridgeProcess.HasExited) {
                Stop-Process -Id $global:currentBridgeProcess.Id -Force -ErrorAction SilentlyContinue
            }
            # Cleanup any stragglers by title
            Get-Process | Where-Object { $_.MainWindowTitle -match $UNIQUE_TITLE } | Stop-Process -Force -ErrorAction SilentlyContinue
            Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue 
        
            $mutex.ReleaseMutex()
            $mutex.Dispose()
            [System.Windows.Forms.Application]::Exit()
        }
    })

$contextMenu.MenuItems.Add($menuItemShow)
$contextMenu.MenuItems.Add("-")
$contextMenu.MenuItems.Add($menuItemExit)
$notifyIcon.ContextMenu = $contextMenu
$notifyIcon.add_DoubleClick($ToggleAction)

# ---------------------------------------------------------
# Watchdog Timer
# ---------------------------------------------------------
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 10000 # Check every 10 seconds (reduced from 1s)
$timer.add_Tick({
        if ($global:manualExit) { return }

        # Use process-based check - pythonw is headless
        if (-not (Test-BridgeRunning)) {
            Write-Host "[Watchdog] Bridge not detected... attempting restart."
            Start-BridgeProcess -StartVisible $false
        }
    })
$timer.Start()

[System.Windows.Forms.Application]::Run()
