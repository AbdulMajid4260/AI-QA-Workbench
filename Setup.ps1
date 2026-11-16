$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (Get-Command py -ErrorAction SilentlyContinue) { & py -3 scripts/setup.py }
elseif (Get-Command python -ErrorAction SilentlyContinue) { & python scripts/setup.py }
else { throw 'Python was not found. Install Python 3.12 and add it to PATH.' }
if ($LASTEXITCODE -ne 0) { throw 'Setup failed. Review the error above.' }
