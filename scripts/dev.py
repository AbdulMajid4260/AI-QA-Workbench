"""Combined local development preview; accepts conventional frontend dev flags."""

import argparse
import os
import sys
from pathlib import Path
import uvicorn

root = Path(__file__).resolve().parents[1]
os.chdir(root)
sys.path.insert(0, str(root))
p = argparse.ArgumentParser()
p.add_argument("--host", default="127.0.0.1")
p.add_argument("--port", type=int, default=4173)
p.add_argument(
    "--strictPort",
    action="store_true",
    help="Uvicorn fails if the requested port is occupied.",
)
a = p.parse_args()
uvicorn.run("backend.app.main:app", host=a.host, port=a.port)
