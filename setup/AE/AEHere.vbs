' Starts AEHere.ps1 with no console window.
' Usage: wscript.exe AEHere.vbs "<folder>"
Option Explicit
Dim sh, fso, dir, folder, cmd
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
If WScript.Arguments.Count = 0 Then WScript.Quit 1
folder = WScript.Arguments(0)
If Right(folder, 1) = "\" Then folder = folder & "."
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & _
      dir & "\AEHere.ps1"" """ & folder & """"
sh.Run cmd, 0, False
