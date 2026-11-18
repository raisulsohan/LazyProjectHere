# LazyProjectHere - installs two right-click menu entries for the current
# Windows user (no admin rights needed):
#   "New After Effects project here"  (AE\AEHere.*)
#   "New Premiere Pro project here"   (Premiere\PremiereHere.*)
# Each entry is added only if that app is on this PC.
# Copies the tool to %USERPROFILE%\Tools\LazyProjectHere and removes the old
# one-app versions (Tools\PremiereHere, Tools\AEHere) if they are there.
param([string]$Target = (Join-Path $env:USERPROFILE 'Tools\LazyProjectHere'))

$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$oldPremiere = Join-Path $env:USERPROFILE 'Tools\PremiereHere'
$oldAE = Join-Path $env:USERPROFILE 'Tools\AEHere'

function Find-App([string]$ext, [string]$dirFilter, [string]$exeRel) {
    $list = @()
    try {
        $progId = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\$ext" -ErrorAction Stop).'(default)'
        $cmd = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\$progId\shell\open\command" -ErrorAction Stop).'(default)'
        if ($cmd -match '^\s*"([^"]+\.exe)"') { $list += $Matches[1] }
    } catch {}
    $list += Get-ChildItem (Join-Path $env:ProgramFiles 'Adobe') -Directory -Filter $dirFilter -ErrorAction SilentlyContinue |
        ForEach-Object { Join-Path $_.FullName $exeRel }
    return $list | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
}

# 1. Copy the files
New-Item -ItemType Directory -Force -Path (Join-Path $Target 'Premiere'), (Join-Path $Target 'AE') | Out-Null
if ((Resolve-Path $src).Path -ne (Resolve-Path $Target).Path) {
    foreach ($f in 'install.ps1', 'uninstall.ps1', 'Premiere\PremiereHere.ps1', 'Premiere\PremiereHere.vbs',
                   'AE\AEHere.ps1', 'AE\AEHere.vbs', 'AE\AEHere.jsx') {
        Copy-Item -LiteralPath (Join-Path $src $f) -Destination (Join-Path $Target $f) -Force
    }
    # Premiere template: keep the user's own (here, or from the old PremiereHere folder)
    $tpl = Join-Path $Target 'Premiere\template.prproj'
    $oldTpl = Join-Path $oldPremiere 'template.prproj'
    if (Test-Path -LiteralPath $tpl) {
        Write-Output "Kept your Premiere template: $tpl"
    } elseif (Test-Path -LiteralPath $oldTpl) {
        Copy-Item -LiteralPath $oldTpl -Destination $tpl
        Write-Output "Kept your Premiere template from $oldPremiere"
    } else {
        Copy-Item -LiteralPath (Join-Path $src 'Premiere\template.prproj') -Destination $tpl
    }
}
Get-ChildItem -LiteralPath $Target -File -Recurse | Unblock-File    # files from a downloaded zip

# 2. Menu entries. Explorer sorts them by key name, so "PremiereHere" and
#    "PremiereHere_AE" stay next to each other.
$apps = @(
    @{ Key = 'PremiereHere_AE'; Label = 'New After Effects project here'; Vbs = 'AE\AEHere.vbs'
       Exe = (Find-App '.aep' 'Adobe After Effects*' 'Support Files\AfterFX.exe'); Name = 'Adobe After Effects' },
    @{ Key = 'PremiereHere'; Label = 'New Premiere Pro project here'; Vbs = 'Premiere\PremiereHere.vbs'
       Exe = (Find-App '.prproj' 'Adobe Premiere Pro*' 'Adobe Premiere Pro.exe'); Name = 'Adobe Premiere Pro' }
)
$places = [ordered]@{
    'HKCU:\Software\Classes\Directory\Background\shell' = '%V'   # empty space inside a folder
    'HKCU:\Software\Classes\Directory\shell'            = '%1'   # on a folder icon
    'HKCU:\Software\Classes\Drive\shell'                = '%1'   # on a drive
}
foreach ($place in $places.Keys) {   # key name of the first AE version
    if (Test-Path "$place\AEHere") { Remove-Item -Path "$place\AEHere" -Recurse -Force }
}
Write-Output ''
foreach ($a in $apps) {
    foreach ($place in $places.Keys) {
        $key = "$place\$($a.Key)"
        if (-not $a.Exe) { if (Test-Path $key) { Remove-Item -Path $key -Recurse -Force }; continue }
        New-Item -Path "$key\command" -Force | Out-Null
        Set-ItemProperty -Path $key -Name '(default)' -Value $a.Label
        Set-ItemProperty -Path $key -Name 'Icon' -Value "`"$($a.Exe)`",0"
        Set-ItemProperty -Path "$key\command" -Name '(default)' -Value ('wscript.exe "{0}" "{1}"' -f (Join-Path $Target $a.Vbs), $places[$place])
    }
    if ($a.Exe) { Write-Output "Added:   '$($a.Label)'" }
    else        { Write-Output "Skipped: '$($a.Label)' ($($a.Name) was not found on this PC)" }
}

# 3. Remove the old one-app versions (their menu entries now point here)
foreach ($old in $oldPremiere, $oldAE) {
    if ((Test-Path -LiteralPath $old) -and ((Resolve-Path $old).Path -ne (Resolve-Path $Target).Path)) {
        foreach ($f in 'PremiereHere.ps1', 'PremiereHere.vbs', 'PremiereHere.log', 'template.prproj', 'template.adobe-standard.prproj',
                       'AEHere.ps1', 'AEHere.vbs', 'AEHere.jsx', 'AEHere.log', 'install.ps1', 'uninstall.ps1', 'jobs') {
            $p = Join-Path $old $f
            if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue }
        }
        if (-not (Get-ChildItem -LiteralPath $old -Force -ErrorAction SilentlyContinue)) { Remove-Item -LiteralPath $old -Force }
        Write-Output "Removed the old version: $old"
    }
}

Write-Output ''
Write-Output "Installed to: $Target"
Write-Output 'Right-click inside any folder -> "New After Effects project here" / "New Premiere Pro project here".'
Write-Output "(Windows 11: they may be under 'Show more options', or press Shift + right-click.)"
