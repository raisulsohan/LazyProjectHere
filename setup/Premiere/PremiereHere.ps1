# PremiereHere.ps1
# Makes a new Premiere Pro project in a folder, points the Import dialog
# at that folder, then opens the project in Premiere Pro.
#
# Usage: PremiereHere.ps1 "<folder>" [-NoOpen]
# Template: template.prproj next to this script. If that template is from a
# newer Premiere than the one installed, Adobe's own "Standard Template
# Project.prproj" is used instead, changed to the same sequences
# (1920x1080 30fps, open + 1080x1920 30fps).

param(
    [Parameter(Mandatory = $true)][string]$Folder,
    [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'
$ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $ToolDir 'PremiereHere.log'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-Log([string]$msg) {
    try { Add-Content -Path $LogFile -Value ("{0}  {1}" -f (Get-Date -Format 's'), $msg) -Encoding UTF8 } catch {}
}

function Show-Error([string]$msg) {
    Write-Log "ERROR: $msg"
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($msg, 'New Premiere Pro project here', 'OK', 'Error') | Out-Null
    } catch {}
}

function Read-Prproj([string]$path) {
    $sr = $null
    $in = [IO.File]::OpenRead($path)
    try {
        $gz = New-Object IO.Compression.GZipStream($in, [IO.Compression.CompressionMode]::Decompress)
        $sr = New-Object IO.StreamReader($gz, $Utf8)
        return $sr.ReadToEnd()
    } finally { if ($sr) { $sr.Close() }; $in.Close() }
}

function Write-Prproj([string]$path, [string]$xml) {
    $out = [IO.File]::Create($path)
    try {
        $gzo = New-Object IO.Compression.GZipStream($out, [IO.Compression.CompressionMode]::Compress)
        $bytes = $Utf8.GetBytes($xml)
        $gzo.Write($bytes, 0, $bytes.Length)
        $gzo.Close()
    } finally { $out.Close() }
}

function Set-Tag([string]$xml, [string]$tag, [string]$value) {
    $line = "<$tag>$([Security.SecurityElement]::Escape($value))</$tag>"
    $rx = "<$([regex]::Escape($tag))>[^<]*</$([regex]::Escape($tag))>"
    if ([regex]::IsMatch($xml, $rx)) { return [regex]::Replace($xml, $rx, { param($m) $line }) }
    $i = $xml.IndexOf('<project.settings.lastknowngoodprojectpath>')
    if ($i -lt 0) { $i = $xml.IndexOf('</Properties>') }
    if ($i -ge 0) { return $xml.Insert($i, "$line`n`t`t`t`t") }
    return $xml
}

# Adobe "Standard Template Project" -> 1920x1080 30fps (open) + 1080x1920 30fps.
function Convert-AdobeTemplate([string]$x) {
    $x = $x.Replace('<FrameRate>10594584000</FrameRate>', '<FrameRate>8467200000</FrameRate>')   # 23.976 -> 30 fps
    $x = $x.Replace('<MZ.Sequence.VideoTimeDisplayFormat>110</MZ.Sequence.VideoTimeDisplayFormat>',
                    '<MZ.Sequence.VideoTimeDisplayFormat>104</MZ.Sequence.VideoTimeDisplayFormat>')
    $x = $x.Replace('<Name>1080p 23.98</Name>', '<Name>1920x1080 30fps</Name>')
    $x = $x.Replace('<FrameRect>0,0,3840,2160</FrameRect>', '<FrameRect>0,0,1080,1920</FrameRect>')
    # the UHD sequence block: preview size, then its name
    $m = [regex]::Match($x, '<Sequence ObjectUID="([^"]+)"[^>]*>(?:(?!</Sequence>)[\s\S])*?<Name>UHD 4K 23\.98</Name>')
    if ($m.Success) {
        $blk = $m.Value.Replace('<MZ.Sequence.PreviewFrameSizeWidth>1920</MZ.Sequence.PreviewFrameSizeWidth>',
                                '<MZ.Sequence.PreviewFrameSizeWidth>1080</MZ.Sequence.PreviewFrameSizeWidth>').Replace(
                                '<MZ.Sequence.PreviewFrameSizeHeight>1080</MZ.Sequence.PreviewFrameSizeHeight>',
                                '<MZ.Sequence.PreviewFrameSizeHeight>1920</MZ.Sequence.PreviewFrameSizeHeight>')
        $x = $x.Substring(0, $m.Index) + $blk + $x.Substring($m.Index + $m.Length)
        # keep only the 1920x1080 sequence open
        $uhd = $m.Groups[1].Value
        $x = [regex]::Replace($x, "\s*<MZ\.PrefixKey\.OpenSequenceGuidList\.\d+>$([regex]::Escape($uhd))</MZ\.PrefixKey\.OpenSequenceGuidList\.\d+>", '')
    }
    $x = $x.Replace('<Name>UHD 4K 23.98</Name>', '<Name>1080x1920 30fps</Name>')
    return $x
}

# Objects that make up one sequence: its bin item and everything it points to.
function Get-SequenceObjects($root, $top, [string]$name) {
    $start = $null
    foreach ($n in $root.ChildNodes) {
        if ($n -is [Xml.XmlElement] -and $n.LocalName -eq 'ClipProjectItem') {
            $nm = $n.SelectSingleNode('ProjectItem/Name')
            if ($nm -and $nm.InnerText -eq $name) { $start = $n; break }
        }
    }
    if (-not $start) { return $null }
    $seen = [ordered]@{}
    $q = New-Object System.Collections.Queue
    $q.Enqueue('u' + $start.GetAttribute('ObjectUID'))
    while ($q.Count) {
        $k = $q.Dequeue()
        if ($seen.Contains($k) -or -not $top.ContainsKey($k)) { continue }
        $seen[$k] = $top[$k]
        foreach ($e in $top[$k].SelectNodes('.//*[@ObjectRef or @ObjectURef]')) {
            if ($e.GetAttribute('ObjectRef')) { $q.Enqueue('i' + $e.GetAttribute('ObjectRef')) }
            else { $q.Enqueue('u' + $e.GetAttribute('ObjectURef')) }
        }
    }
    return $seen
}

# Copies the sequence $srcName as $newName with a new frame size. All object
# IDs and the GUIDs that belong only to that sequence get new values; GUIDs it
# shares with $refName (type IDs) stay.
function Add-SequenceCopy([string]$xml, [string]$srcName, [string]$refName, [string]$newName, [int]$w, [int]$h) {
    $d = New-Object Xml.XmlDocument
    $d.PreserveWhitespace = $true
    $d.LoadXml($xml)
    $root = $d.DocumentElement
    $top = @{}; $maxId = 0
    foreach ($n in $root.ChildNodes) {
        if ($n -isnot [Xml.XmlElement]) { continue }
        $id = $n.GetAttribute('ObjectID'); $uid = $n.GetAttribute('ObjectUID')
        if ($id) { $top["i$id"] = $n; if ([int]$id -gt $maxId) { $maxId = [int]$id } }
        elseif ($uid) { $top["u$uid"] = $n }
    }
    $src = Get-SequenceObjects $root $top $srcName
    if (-not $src) { return $xml }
    $ref = Get-SequenceObjects $root $top $refName

    $guidRx = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
    $shared = @{}
    if ($ref) { foreach ($n in $ref.Values) { foreach ($m in [regex]::Matches($n.OuterXml, $guidRx)) { $shared[$m.Value.ToLower()] = 1 } } }
    $guidMap = @{}; $idMap = @{}
    foreach ($k in $src.Keys) { if ($k.StartsWith('i')) { $maxId++; $idMap[$k.Substring(1)] = [string]$maxId } }

    $sb = New-Object System.Text.StringBuilder
    foreach ($n in $src.Values) {
        $t = $n.OuterXml
        $t = [regex]::Replace($t, '(ObjectID|ObjectRef)="(\d+)"', {
            param($m) if ($idMap.ContainsKey($m.Groups[2].Value)) { '{0}="{1}"' -f $m.Groups[1].Value, $idMap[$m.Groups[2].Value] } else { $m.Value } })
        $t = [regex]::Replace($t, '(?<!ClassID=")' + $guidRx, {
            param($m)
            $g = $m.Value.ToLower()
            if ($shared.ContainsKey($g)) { return $m.Value }
            if (-not $guidMap.ContainsKey($g)) { $guidMap[$g] = [guid]::NewGuid().ToString() }
            return $guidMap[$g] })
        [void]$sb.Append("`n`t").Append($t)
    }
    $clone = $sb.ToString()
    $clone = $clone.Replace("<Name>$srcName</Name>", "<Name>$newName</Name>")
    $clone = [regex]::Replace($clone, '<FrameRect>[^<]*</FrameRect>', "<FrameRect>0,0,$w,$h</FrameRect>")
    $clone = [regex]::Replace($clone, '<MZ\.Sequence\.PreviewFrameSizeWidth>\d+<', "<MZ.Sequence.PreviewFrameSizeWidth>$w<")
    $clone = [regex]::Replace($clone, '<MZ\.Sequence\.PreviewFrameSizeHeight>\d+<', "<MZ.Sequence.PreviewFrameSizeHeight>$h<")

    # put the copy in the root bin, after the other items
    $srcUid = $src.Keys | Where-Object { $_.StartsWith('u') } | Select-Object -First 1
    $newUid = $guidMap[$srcUid.Substring(1).ToLower()]
    # the bin that holds the source sequence
    $srcItem = [regex]::Match($xml, '<Item Index="\d+" ObjectURef="' + [regex]::Escape($srcUid.Substring(1)) + '"\s*/>')
    if (-not $srcItem.Success -or -not $newUid) { return $xml }
    $iEnd = $xml.IndexOf('</Items>', $srcItem.Index)
    $iStart = $xml.LastIndexOf('<Items', $srcItem.Index)
    $items = [regex]::Matches($xml.Substring($iStart, $iEnd - $iStart), '<Item Index="(\d+)"')
    $next = 1 + ($items | ForEach-Object { [int]$_.Groups[1].Value } | Measure-Object -Maximum).Maximum
    $lineEnd = $xml.IndexOf('>', $srcItem.Index + $srcItem.Length - 1) + 1
    $lastItem = [regex]::Matches($xml.Substring(0, $iEnd), '<Item Index="\d+" ObjectURef="[^"]+"\s*/>')
    $after = $lastItem[$lastItem.Count - 1]
    $xml = $xml.Insert($after.Index + $after.Length, "`n`t`t`t`t<Item Index=`"$next`" ObjectURef=`"$newUid`"/>")
    $xml = [regex]::Replace($xml, '<NextSequenceID>(\d+)</NextSequenceID>', { param($m) '<NextSequenceID>{0}</NextSequenceID>' -f (1 + [int]$m.Groups[1].Value) })
    $end = $xml.LastIndexOf('</PremiereData>')
    return $xml.Insert($end, $clone.TrimStart() + "`n")
}

try {
    # --- 1. Clean the folder path (Explorer gives "D:\" as  D:"  sometimes) ---
    $Folder = $Folder.Trim().Trim('"').TrimEnd('\')
    if ($Folder -match '^[A-Za-z]:$') { $Folder += '\' }
    if (-not (Test-Path -LiteralPath $Folder -PathType Container)) {
        throw "Folder not found: $Folder"
    }
    $Folder = (Get-Item -LiteralPath $Folder).FullName

    # --- 2. Find Premiere Pro: the .prproj file type first, then Program Files ---
    $candidates = @()
    try {
        $progId = (Get-ItemProperty 'Registry::HKEY_CLASSES_ROOT\.prproj' -ErrorAction Stop).'(default)'
        $cmd = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\$progId\shell\open\command" -ErrorAction Stop).'(default)'
        if ($cmd -match '^\s*"([^"]+\.exe)"') { $candidates += $Matches[1] }
    } catch {}
    foreach ($pf in @($env:ProgramFiles, 'C:\Program Files') | Select-Object -Unique) {
        $candidates += Get-ChildItem (Join-Path $pf 'Adobe') -Directory -Filter 'Adobe Premiere Pro*' -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'Adobe Premiere Pro.exe' }
    }
    $exe = $candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique |
        Sort-Object { [version](Get-Item -LiteralPath $_).VersionInfo.FileVersion } -Descending |
        Select-Object -First 1
    if (-not $exe) { throw 'Adobe Premiere Pro was not found on this PC.' }
    $major = ([version](Get-Item -LiteralPath $exe).VersionInfo.FileVersion).Major

    # --- 3. Pick the template ---
    $template = Join-Path $ToolDir 'template.prproj'
    $useAdobe = -not (Test-Path -LiteralPath $template)
    if (-not $useAdobe) {
        $tv = [regex]::Match((Read-Prproj $template), '<MZ\.BuildVersion\.Modified>(\d+)\.')
        if ($tv.Success -and [int]$tv.Groups[1].Value -gt $major) {
            Write-Log "template.prproj is from Premiere $($tv.Groups[1].Value), this PC has ${major}: using Adobe's template."
            $useAdobe = $true
        }
    }
    if ($useAdobe) {
        $tplRoot = Join-Path (Split-Path -Parent $exe) 'TemplateProjects'
        $template = Join-Path $tplRoot 'en_US\Standard Template Project.prproj'
        if (-not (Test-Path -LiteralPath $template)) {
            $template = Get-ChildItem $tplRoot -Recurse -Filter 'Standard Template Project.prproj' -ErrorAction SilentlyContinue |
                Select-Object -First 1 -ExpandProperty FullName
        }
        if (-not $template -or -not (Test-Path -LiteralPath $template)) {
            throw 'No template project found. Save a blank project as template.prproj next to PremiereHere.ps1.'
        }
    }

    # --- 4. Project name = folder name; add _2, _3 ... if it exists ---
    $base = Split-Path -Leaf $Folder
    if ([string]::IsNullOrWhiteSpace($base) -or $base -match '^[A-Za-z]:\\?$') { $base = 'Project' }
    foreach ($c in [IO.Path]::GetInvalidFileNameChars()) { $base = $base.Replace([string]$c, '_') }
    $proj = Join-Path $Folder "$base.prproj"
    $n = 2
    while (Test-Path -LiteralPath $proj) {
        $proj = Join-Path $Folder ("{0}_{1}.prproj" -f $base, $n)
        $n++
    }

    # Write the new location into the project. A wrong stored path makes
    # Premiere say "This file path does not exist on disk at this location".
    $xml = Read-Prproj $template
    if ($useAdobe) { $xml = Convert-AdobeTemplate $xml }
    # 4:5 sequence: a copy of the 9:16 one at 1080x1350
    if ($xml.Contains('<Name>1080x1920 30fps</Name>') -and -not $xml.Contains('<Name>1080x1350 30fps</Name>')) {
        $xml = Add-SequenceCopy $xml '1080x1920 30fps' '1920x1080 30fps' '1080x1350 30fps' 1080 1350
    }
    # sequence names follow the folder: "<folder>_16X9", "_9X16", "_4X5"
    $seqBase = [Security.SecurityElement]::Escape($base)
    $xml = $xml.Replace('<Name>1920x1080 30fps</Name>', "<Name>${seqBase}_16X9</Name>")
    $xml = $xml.Replace('<Name>1080x1920 30fps</Name>', "<Name>${seqBase}_9X16</Name>")
    $xml = $xml.Replace('<Name>1080x1350 30fps</Name>', "<Name>${seqBase}_4X5</Name>")
    $parent = Split-Path -Parent $Folder
    if (-not $parent) { $parent = $Folder }
    $xml = Set-Tag $xml 'project.settings.lastknowngoodprojectpath' ('\\?\' + $proj)
    $xml = Set-Tag $xml 'project.settings.lastknownparentdirectorypathaboveprojectpath' $parent
    Write-Prproj $proj $xml
    Write-Log "Created $proj (template: $template)"

    # --- 5. Point the Import dialog at the folder (only while Premiere is closed) ---
    $running = @(Get-Process -Name 'Adobe Premiere Pro' -ErrorAction SilentlyContinue).Count -gt 0
    if ($NoOpen) {
        Write-Log 'NoOpen (test mode): Import folder not changed.'
    } elseif ($running) {
        Write-Log 'Premiere Pro is already running: Import folder not changed.'
    } else {
        $docs = [Environment]::GetFolderPath('MyDocuments')
        $verDir = Join-Path $docs ("Adobe\Premiere Pro\{0}.0" -f $major)
        $prefsFiles = Get-ChildItem $verDir -Directory -Filter 'Profile-*' -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'Adobe Premiere Pro Prefs' } |
            Where-Object { Test-Path -LiteralPath $_ }
        $esc = [Security.SecurityElement]::Escape($Folder)
        $tag = 'be.prefs.last.used.directory'
        foreach ($pf in $prefsFiles) {
            $bak = "$pf.premierehere.bak"
            if (-not (Test-Path -LiteralPath $bak)) { Copy-Item -LiteralPath $pf -Destination $bak }
            $text = [IO.File]::ReadAllText($pf, $Utf8)
            $line = "<$tag>$esc</$tag>"
            $rx = "<$([regex]::Escape($tag))>[^<]*</$([regex]::Escape($tag))>"
            if ([regex]::IsMatch($text, $rx)) {
                $text = [regex]::Replace($text, $rx, { param($m) $line })
            } elseif ($text.Contains('</Properties>')) {
                $i = $text.LastIndexOf('</Properties>')
                $text = $text.Insert($i, "`t$line`n`t`t")
            } else {
                Write-Log "Unknown prefs format, skipped: $pf"
                continue
            }
            [IO.File]::WriteAllText($pf, $text, $Utf8)
            Write-Log "Import folder set in $pf"
        }
    }

    # --- 6. Open the project ---
    # Open it the way a double-click does. Starting the .exe with the path as
    # an argument makes Premiere 2027 say "This file path does not exist on disk".
    if ($NoOpen) { Write-Log 'NoOpen (test mode): project not opened.'; return }
    try {
        Start-Process -FilePath $proj -WorkingDirectory $Folder
    } catch {
        Start-Process -FilePath $exe -ArgumentList ('"{0}"' -f $proj) -WorkingDirectory $Folder
    }
    Write-Log "Opened $proj"
}
catch {
    Show-Error $_.Exception.Message
    exit 1
}
