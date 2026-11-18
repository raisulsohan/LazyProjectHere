# Makes LazyProjectHere.zip (the download for GitHub Releases) next to this
# folder: Install.cmd, Uninstall.cmd, README.txt, LICENSE and setup\.
param([string]$Out = (Join-Path (Split-Path -Parent $PSScriptRoot) 'LazyProjectHere.zip'))

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$root = $PSScriptRoot
$files = @('Install.cmd', 'Uninstall.cmd', 'README.txt', 'LICENSE') | ForEach-Object { Get-Item -LiteralPath (Join-Path $root $_) }
$files += Get-ChildItem -LiteralPath (Join-Path $root 'setup') -Recurse -File |
    Where-Object { $_.Extension -ne '.log' -and $_.FullName -notmatch '\\jobs\\' }

if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }
$zip = [IO.Compression.ZipFile]::Open($Out, 'Create')
try {
    foreach ($f in $files) {
        $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')   # forward slashes for every unzip tool
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $rel)
    }
} finally { $zip.Dispose() }
Write-Output ("{0} ({1} files)" -f $Out, $files.Count)
Write-Output ('SHA-256: ' + (Get-FileHash -LiteralPath $Out -Algorithm SHA256).Hash.ToLower())
