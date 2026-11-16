"""Local readiness checks; never prints credentials."""

import importlib.metadata
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")
from backend.app import ai, jira
from playwright.sync_api import sync_playwright

print("Python:", sys.version.split()[0])
print("UI build:", (ROOT / "frontend/dist/index.html").exists())
for name in ["fastapi", "playwright", "pydantic", "httpx"]:
    print(name + ":", importlib.metadata.version(name))
with sync_playwright() as p:
    path = Path(os.getenv("BROWSER_EXECUTABLE_PATH") or p.chromium.executable_path)
    print("Browser installed:", path.is_file())
for provider in ["ollama", "groq"]:
    try:
        print(provider + " available models:", json.dumps(ai.model_list(provider)))
    except Exception as exc:
        print(provider + ":", ai.clean_error(exc))
if all(os.getenv(k) for k in ["JIRA_API_TOKEN", "JIRA_EMAIL", "JIRA_PROJECT_KEY"]):
    try:
        print("Jira:", json.dumps(jira.check()))
    except Exception as exc:
        print("Jira:", ai.clean_error(exc))
else:
    print("Jira: not configured yet")
print(
    "A successful model list is connectivity only. Generate one analysis to verify inference."
)
