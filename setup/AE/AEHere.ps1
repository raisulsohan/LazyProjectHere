# AEHere.ps1
# Makes a new After Effects project in a folder, opens it in After Effects
# and points the Import dialog (Ctrl+I) at that folder.
#
# Usage: AEHere.ps1 "<folder>" [-NoOpen]
#   -NoOpen  test mode: After Effects makes and saves the project, then
#            closes it again.
# The project itself is built by AEHere.jsx inside After Effects. It works
# with After Effects closed or open (an open project with unsaved changes
# makes After Effects ask to save it first).

param(
    [Parameter(Mandatory = $true)][string]$Folder,
    [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'
$ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $ToolDir 'AEHere.log'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

# Comp settings
$Duration = 30          # seconds
$Fps = 30
$Bg = '[0, 0, 0]'       # black, 0-1 per channel

function Write-Log([string]$msg) {
    try { Add-Content -Path $LogFile -Value ("{0}  {1}" -f (Get-Date -Format 's'), $msg) -Encoding UTF8 } catch {}
}

function Show-Error([string]$msg) {
    Write-Log "ERROR: $msg"
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($msg, 'New After Effects project here', 'OK', 'Error') | Out-Null
    } catch {}
}

# A JavaScript string literal that is pure ASCII (any name, any script).
function ConvertTo-JsString([string]$s) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append('"')
    foreach ($ch in $s.ToCharArray()) {
        $c = [int]$ch
        if ($c -ge 32 -and $c -lt 127 -and $ch -ne '"' -and $ch -ne '\') { [void]$sb.Append($ch) }
        else { [void]$sb.AppendFormat('\u{0:x4}', $c) }
    }
    [void]$sb.Append('"')
    return $sb.ToString()
}

# The Import dialog (Ctrl+I) of After Effects is a Windows file dialog with
# its own ID. Windows keeps its last folder in LastVisitedPidlMRU under that
# ID (AE 2027) or under the exe name (older AE), and reads it every time the
# dialog opens, so this works while After Effects is running.
$AEDialogIds = @('{00D69B5B-2C33-4FDF-A969-633D2B897957}', 'AfterFX.exe')

function Set-ImportFolder([string]$path) {
    if (-not ('AEHere.Pidl' -as [type])) {
        Add-Type -Namespace AEHere -Name Pidl -MemberDefinition @'
[DllImport("shell32.dll", CharSet = CharSet.Unicode)]
static extern int SHParseDisplayName(string name, IntPtr bc, out IntPtr pidl, uint sfgao, out uint attrs);
[DllImport("shell32.dll")] static extern uint ILGetSize(IntPtr pidl);
public static byte[] Get(string path) {
    IntPtr p; uint a;
    int hr = SHParseDisplayName(path, IntPtr.Zero, out p, 0, out a);
    if (hr != 0) throw new Exception("SHParseDisplayName failed: " + hr);
    int n = (int)ILGetSize(p); byte[] b = new byte[n];
    Marshal.Copy(p, b, 0, n); Marshal.FreeCoTaskMem(p); return b;
}
'@
    }
    $pidl = [AEHere.Pidl]::Get($path)
    $key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\ComDlg32\LastVisitedPidlMRU'
    if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
    $props = Get-ItemProperty -Path $key
    # who owns which numbered value
    $owner = @{}
    foreach ($pr in $props.PSObject.Properties) {
        if ($pr.Name -match '^\d+$' -and $pr.Value -is [byte[]]) {
            $s = [Text.Encoding]::Unicode.GetString($pr.Value)
            $z = $s.IndexOf([char]0)
            if ($z -gt 0) { $owner[$s.Substring(0, $z).ToLower()] = [int]$pr.Name }
        }
    }
    $order = New-Object System.Collections.Generic.List[int]
    $raw = [byte[]]$props.MRUListEx
    if ($raw) {
        for ($i = 0; $i + 3 -lt $raw.Length; $i += 4) {
            $v = [BitConverter]::ToInt32($raw, $i)
            if ($v -ge 0 -and -not $order.Contains($v)) { $order.Add($v) }
        }
    }
    $used = @($owner.Values)
    foreach ($id in $AEDialogIds) {
        if ($owner.ContainsKey($id.ToLower())) { $slot = $owner[$id.ToLower()] }
        else {
            $slot = 0
            while ($used -contains $slot -or $order.Contains($slot)) { $slot++ }
            $used += $slot
        }
        $bytes = [Text.Encoding]::Unicode.GetBytes($id + [char]0) + $pidl
        Set-ItemProperty -Path $key -Name ([string]$slot) -Value ([byte[]]$bytes) -Type Binary
        [void]$order.Remove($slot)
        $order.Insert(0, $slot)
    }
    $out = New-Object System.Collections.Generic.List[byte]
    foreach ($v in $order) { $out.AddRange([BitConverter]::GetBytes([int]$v)) }
    $out.AddRange([BitConverter]::GetBytes([int]-1))
    Set-ItemProperty -Path $key -Name 'MRUListEx' -Value ([byte[]]$out.ToArray()) -Type Binary
}

function Get-AEWindow {
    Get-Process -Name 'AfterFX' -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle -match 'After Effects' } |
        Select-Object -First 1
}

$job = $null
try {
    # --- 1. Clean the folder path (Explorer gives "D:\" as  D:"  sometimes) ---
    $Folder = $Folder.Trim().Trim('"').TrimEnd('\')
    if ($Folder -match '^[A-Za-z]:$') { $Folder += '\' }
    if ($Folder.EndsWith('\.')) { $Folder = $Folder.Substring(0, $Folder.Length - 1) }
    if (-not (Test-Path -LiteralPath $Folder -PathType Container)) {
        throw "Folder not found: $Folder"
    }
    $Folder = (Get-Item -LiteralPath $Folder).FullName

    # --- 2. Find After Effects: the .aep file type first, then Program Files ---
    $candidates = @()
    try {
        $progId = (Get-ItemProperty 'Registry::HKEY_CLASSES_ROOT\.aep' -ErrorAction Stop).'(default)'
        $cmd = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\$progId\shell\open\command" -ErrorAction Stop).'(default)'
        if ($cmd -match '^\s*"([^"]+\.exe)"') { $candidates += $Matches[1] }
    } catch {}
    foreach ($pf in @($env:ProgramFiles, 'C:\Program Files') | Select-Object -Unique) {
        $candidates += Get-ChildItem (Join-Path $pf 'Adobe') -Directory -Filter 'Adobe After Effects*' -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'Support Files\AfterFX.exe' }
    }
    $exe = $candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique |
        Sort-Object { [version](Get-Item -LiteralPath $_).VersionInfo.FileVersion } -Descending |
        Select-Object -First 1
    if (-not $exe) { throw 'Adobe After Effects was not found on this PC.' }

    # --- 3. Project name = folder name; add _2, _3 ... if it exists ---
    $base = Split-Path -Leaf $Folder
    if ([string]::IsNullOrWhiteSpace($base) -or $base -match '^[A-Za-z]:\\?$') { $base = 'Project' }
    foreach ($c in [IO.Path]::GetInvalidFileNameChars()) { $base = $base.Replace([string]$c, '_') }
    $proj = Join-Path $Folder "$base.aep"
    $n = 2
    while (Test-Path -LiteralPath $proj) {
        $proj = Join-Path $Folder ("{0}_{1}.aep" -f $base, $n)
        $n++
    }

    # --- 4. The job for After Effects: settings + AEHere.jsx ---
    $jobDir = Join-Path $ToolDir 'jobs'
    New-Item -ItemType Directory -Force -Path $jobDir | Out-Null
    Get-ChildItem -LiteralPath $jobDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -Force -ErrorAction SilentlyContinue
    $id = [guid]::NewGuid().ToString('N').Substring(0, 12)
    $job = Join-Path $jobDir "job-$id.jsx"
    $result = Join-Path $jobDir "job-$id.txt"
    $mainJsx = Join-Path $ToolDir 'AEHere.jsx'
    if (-not (Test-Path -LiteralPath $mainJsx)) { throw "Missing file: $mainJsx" }
    $js = @(
        'var AEHERE = {'
        '    folder: ' + (ConvertTo-JsString $Folder) + ','
        '    project: ' + (ConvertTo-JsString $proj) + ','
        '    base: ' + (ConvertTo-JsString $base) + ','
        '    result: ' + (ConvertTo-JsString $result) + ','
        "    duration: $Duration, fps: $Fps, bg: $Bg,"
        '    close: ' + $(if ($NoOpen) { 'true' } else { 'false' })
        '};'
        '$.evalFile(new File(' + (ConvertTo-JsString $mainJsx) + '));'
    ) -join "`r`n"
    [IO.File]::WriteAllText($job, $js, $Utf8)
    Write-Log "Folder: $Folder -> $proj (After Effects: $exe)"

    # --- 5. Start After Effects if needed, then hand it the job ---
    # A cold start with a script on the command line can quit, so After
    # Effects is started plain and gets the script when its window is up.
    if (-not (Get-AEWindow)) {
        Write-Log 'Starting After Effects.'
        Start-Process -FilePath $exe -WorkingDirectory $Folder
        $t0 = Get-Date
        while (-not (Get-AEWindow)) {
            if (((Get-Date) - $t0).TotalSeconds -gt 300) { throw 'After Effects did not start within 5 minutes.' }
            Start-Sleep -Seconds 2
        }
        Start-Sleep -Seconds 5
    }
    $send = '$.evalFile(new File(' + (ConvertTo-JsString $job).Replace('"', "'") + '))'
    $started = "$result.started"
    $tries = 0
    while (-not (Test-Path -LiteralPath $started)) {
        if ($tries -ge 10) { throw 'After Effects did not take the script. Is a dialog open in After Effects?' }
        Start-Process -FilePath $exe -ArgumentList @('-s', ('"{0}"' -f $send)) -WorkingDirectory $Folder
        $tries++
        $t0 = Get-Date
        while (-not (Test-Path -LiteralPath $started) -and ((Get-Date) - $t0).TotalSeconds -lt 20) { Start-Sleep -Milliseconds 500 }
    }

    # --- 6. Wait for the answer (a "Save changes?" question can take a while) ---
    $t0 = Get-Date
    while (-not (Test-Path -LiteralPath $result)) {
        if (((Get-Date) - $t0).TotalMinutes -gt 30) { throw 'After Effects gave no answer within 30 minutes.' }
        Start-Sleep -Milliseconds 500
    }
    Start-Sleep -Milliseconds 300
    $answer = ([IO.File]::ReadAllText($result, $Utf8)).TrimStart([char]0xFEFF) -split "`r?`n", 2
    switch ($answer[0].Trim()) {
        'OK'        {
            Write-Log $(if ($NoOpen) { "Created (NoOpen: closed again) $proj" } else { "Created and opened $proj" })
            # --- 7. Point the Import dialog (Ctrl+I) at the folder ---
            try { Set-ImportFolder $Folder; Write-Log "Import folder set: $Folder" }
            catch { Write-Log "Import folder not set: $($_.Exception.Message)" }
        }
        'CANCELLED' { Write-Log 'Cancelled in After Effects (the open project was not closed).' }
        default     { throw ("After Effects: " + ($answer -join ' ')) }
    }
}
catch {
    Show-Error $_.Exception.Message
    exit 1
}
finally {
    if ($job) {
        foreach ($f in @($job, $result, "$result.started")) {
            if ($f) { Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue }
        }
    }
}
