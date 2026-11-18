<div align="center">

# LazyProjectHere

**Right-click any folder. Get a ready After Effects or Premiere Pro project named after it.**

A small Windows right-click tool for video editors and motion designers.

[বাংলায় পড়ুন](README.bn.md) · [Download](https://github.com/raisulsohan/LazyProjectHere/releases/latest)

![Windows 10/11](https://img.shields.io/badge/Windows-10%20%7C%2011-5B6CF0)
![After Effects](https://img.shields.io/badge/After%20Effects-2027-9999FF)
![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-2027-9999FF)
![License: MIT](https://img.shields.io/badge/license-MIT-2BA36B)

</div>

## What it does

Right-click inside a folder (or on a folder icon, or on a drive) and choose one of two entries:

- **New After Effects project here**
- **New Premiere Pro project here**

For a folder called `My Video` you get `My Video.aep` or `My Video.prproj` in that folder, with:

| Comp / sequence | Size | |
|---|---|---|
| `My Video_16X9` | 1920x1080 | open and ready |
| `My Video_9X16` | 1080x1920 | |
| `My Video_4X5` | 1080x1350 | |

All three are 30 fps. The project opens in the app, and **Import (Ctrl+I) opens in that folder**.

An existing project is never overwritten: the new one gets `_2`, `_3` ... at the end.

### After Effects

- Comps: 30 seconds, black background, square pixels.
- Folders: `00 Comps` (the three comps), `01 Footage`, `02 Audio`, `03 Graphics`, `04 Music`, `05 Photos`.
- **Your New Project Template is used** (Preferences > New Project). Its folders stay, the comps go into the folder that holds the template's comp, and empty template comps are replaced by the three new ones.
- Works with After Effects open or closed. With unsaved changes, After Effects asks to save first. Cancel changes nothing.
- The Import folder is set even while After Effects is open.
- Comp length, frame rate and colour: the `Comp settings` lines at the top of `AE\AEHere.ps1`.

### Premiere Pro

- Bins: `01 Footage`, `02 Audio`, `03 Graphics`, `04 Music`, `05 Photos`.
- The Import folder is set only while Premiere Pro is closed (Premiere rewrites its prefs on exit).
- Own template: save a blank project as `template.prproj` in the `Premiere` folder of the install.

## Install

1. Download `LazyProjectHere.zip` from [Releases](https://github.com/raisulsohan/LazyProjectHere/releases/latest) and extract it.
2. Double-click `Install.cmd`.
3. When the window shows "Installed to", press any key.

It installs to `%USERPROFILE%\Tools\LazyProjectHere` for the current user, with no admin rights. An entry is added only for an app that is installed. Old one-app versions (`Tools\PremiereHere`, `Tools\AEHere`) are removed, and your own `template.prproj` is kept.

On Windows 11 the entries can be under **Show more options** (or press Shift + right-click).

To remove: double-click `Uninstall.cmd`. Projects you made stay.

## How it works

- `AE\AEHere.ps1` finds `AfterFX.exe`, starts After Effects if needed and sends it `AE\AEHere.jsx` with `AfterFX.exe -s`. The script builds and saves the project inside After Effects.
- After Effects 2027's Import dialog keeps its last folder in Windows' own file-dialog memory (`ComDlg32\LastVisitedPidlMRU`, under the dialog's ID), not in the After Effects prefs. The tool writes the folder there, and Windows reads it every time the dialog opens.
- `Premiere\PremiereHere.ps1` writes the `.prproj` (gzipped XML) from `template.prproj`, adds the 4:5 sequence, renames the sequences and sets `be.prefs.last.used.directory` in the Premiere prefs.
- Small `.vbs` launchers start PowerShell without a console window. Errors show in a message box and in `AEHere.log` / `PremiereHere.log`.

## Build the zip

```powershell
powershell -ExecutionPolicy Bypass -File build-zip.ps1
```

It writes `LazyProjectHere.zip` next to this folder.

Tested on Windows 11 with After Effects 2027 (27.0) and Premiere Pro 2027 (27.0).

## License

[MIT](LICENSE)
