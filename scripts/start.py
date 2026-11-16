"""One local server serves the prebuilt React UI and API."""

import os
import socket
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")
port = int(os.getenv("PORT", "8000"))
if not (ROOT / "frontend/dist/index.html").exists():
    raise SystemExit(
        "Frontend build missing. Run npm ci && npm run build inside frontend."
    )
with socket.socket() as s:
    try:
        s.bind(("127.0.0.1", port))
    except OSError:
        raise SystemExit(
            f"Port {port} is in use. Stop the previous server yourself or change PORT in .env. No process has been killed."
        )
print(
    f"\nQA Workbench: http://127.0.0.1:{port}\nAPI docs: http://127.0.0.1:{port}/docs\nKeep this terminal open. Ctrl+C stops the server.\n",
    flush=True,
)
subprocess.run(
    [
        sys.executable,
        "-m",
        "uvicorn",
        "backend.app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
    ],
    cwd=ROOT,
)
