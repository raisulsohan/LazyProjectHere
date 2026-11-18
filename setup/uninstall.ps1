# Removes LazyProjectHere: both right-click menu entries and the tool folder
# %USERPROFILE%\Tools\LazyProjectHere. Projects made with it stay.
# Premiere's prefs backup stays too: "Adobe Premiere Pro Prefs.premierehere.bak".
param([string]$Target = (Join-Path $env:USERPROFILE 'Tools\LazyProjectHere'))

foreach ($place in 'Directory\Background', 'Directory', 'Drive') {
    foreach ($name in 'PremiereHere', 'PremiereHere_AE', 'AEHere') {
        $key = "HKCU:\Software\Classes\$place\shell\$name"
        if (Test-Path $key) { Remove-Item -Path $key -Recurse -Force; Write-Output "Removed menu: $key" }
    }
}
if (Test-Path -LiteralPath $Target) {
    Remove-Item -LiteralPath $Target -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $Target) { Write-Output "Could not remove all of $Target (a file is in use)." }
    else { Write-Output "Removed folder: $Target" }
}
