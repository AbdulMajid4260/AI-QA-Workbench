"""Cross-platform setup. Run with Python 3.11–3.13; no keys are required."""

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
if sys.version_info < (3, 11):
    raise SystemExit("Python 3.11 or newer is required. Python 3.12 is recommended.")
venv = ROOT / ".venv"
py = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def run(args):
    print("Running:", " ".join(map(str, args)), flush=True)
    subprocess.run(list(map(str, args)), check=True, cwd=ROOT)


try:
    if not py.exists():
        run([sys.executable, "-m", "venv", venv])
    run([py, "-m", "pip", "install", "-r", ROOT / "requirements.txt"])
    run([py, "-m", "playwright", "install", "chromium"])
    if not (ROOT / ".env").exists():
        shutil.copyfile(ROOT / ".env.example", ROOT / ".env")
    if not (ROOT / "frontend/dist/index.html").exists():
        npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
        if not npm:
            raise SystemExit(
                "Frontend build missing. Install Node.js 20.19+ then run npm ci and npm run build inside frontend."
            )
        run([npm, "--prefix", "frontend", "ci"])
        run([npm, "--prefix", "frontend", "run", "build"])
    print(
        "\nSetup complete. Add credentials to .env when ready, then run Start.ps1 or .venv/bin/python scripts/start.py."
    )
except subprocess.CalledProcessError as exc:
    raise SystemExit(
        f"Setup stopped with exit code {exc.returncode}. Fix the reported error and run setup again; existing data is preserved."
    )
