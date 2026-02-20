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
$bridgeScript = Join-Path $scriptPath "start_bridge.bat"
$UNIQUE_TITLE = "MailTrackerPro_Bridge_Process_V2"
$global:manualExit = $false
$lastRestartTime = [DateTime]::MinValue
$global:currentBridgeProcess = $null

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
    # 1. Try saved process object
    if ($global:currentBridgeProcess) {
        # Check if exited
        if ($global:currentBridgeProcess.HasExited) {
            $global:currentBridgeProcess = $null
        }
        else {
            $global:currentBridgeProcess.Refresh()
            $h = $global:currentBridgeProcess.MainWindowHandle
            if ($h -ne [IntPtr]::Zero) { return $h }
        }
    }
    
    # 2. Fallback: Search by title (Recovers lost handles or manual starts)
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
    if (($now - $lastRestartTime).TotalSeconds -lt 5) { return }
    $global:lastRestartTime = $now

    # 2. RUNNING CHECK
    $h = Get-CurrentHandle
    if ($h -ne [IntPtr]::Zero) { 
        if ($StartVisible) {
            # Force Restore
            [User32.Win32Utils]::ShowWindowAsync($h, 9) # SW_RESTORE
            [User32.Win32Utils]::SetForegroundWindow($h)
        }
        return
    }

    # 3. START IT
    # Start minimized. cmd /k keeps it alive if script finishes fast (debug), but /c is better for auto-restart on crash.
    # We stick with /c and rely on Cooldown.
    $p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bridgeScript`"" -WindowStyle Minimized -PassThru
    $global:currentBridgeProcess = $p

    # 4. Handle Window Visibility
    # Wait loop strictly for handle creation
    $attempts = 0
    while ($attempts -lt 20) {
        # 5s max
        Start-Sleep -Milliseconds 250
        $p.Refresh()
        $h = $p.MainWindowHandle
        if ($h -ne [IntPtr]::Zero) {
            if ($StartVisible) {
                # SW_RESTORE (9) is crucial to un-minimize
                [User32.Win32Utils]::ShowWindow($h, 9)
                [User32.Win32Utils]::SetForegroundWindow($h)
            }
            else {
                # Ensure hidden startup
                [User32.Win32Utils]::ShowWindow($h, 0)
            }
            break
        }
        $attempts++
    }
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
$timer.Interval = 1000 # Check every 1 second
$timer.add_Tick({
        if ($global:manualExit) { return }

        $handle = Get-CurrentHandle
    
        # 1. RESTART IF MISSING
        if ($handle -eq [IntPtr]::Zero) {
            $now = Get-Date
            if (($now - $global:lastRestartTime).TotalSeconds -gt 5) {
                Start-BridgeProcess -StartVisible $false
            }
        }
        # 2. HIDE IF MINIMIZED
        elseif ([User32.Win32Utils]::IsIconic($handle)) {
            [User32.Win32Utils]::ShowWindow($handle, 0)
        }
    })
$timer.Start()

[System.Windows.Forms.Application]::Run()
