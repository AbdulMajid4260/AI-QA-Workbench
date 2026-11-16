$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$WorkbenchPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $WorkbenchPython)) { throw 'Run Setup.ps1 first.' }
& $WorkbenchPython scripts/start.py
