"""Actual SauceDemo verification. No AI credentials needed. Writes real reports."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")
from backend.app import store, automation, reports
from backend.app.models import RunRequest

p = argparse.ArgumentParser()
p.add_argument("--live", action="store_true")
p.add_argument("--suites", nargs="+", default=["smoke", "data_driven", "failure_demo"])
args = p.parse_args()
if not args.live:
    raise SystemExit(
        "Pass --live to run real browser tests against https://www.saucedemo.com/."
    )
store.init()
out = ROOT / "evidence"
out.mkdir(exist_ok=True)
summary = []
for suite in args.suites:
    req = RunRequest(suite=suite)
    plan = automation.plan(req)
    run = store.put(
        "runs",
        {
            "suite": suite,
            "status": "queued",
            "headless": True,
            "aut": automation.AUT,
            "browser": "Chromium",
            "plan": plan,
            "results": [],
            "counts": {},
        },
    )
    print("Starting", suite, run["id"], flush=True)
    run = automation.run_browser(run["id"])
    (out / (run["id"] + ".html")).write_text(reports.run_report(run), encoding="utf-8")
    (out / (run["id"] + ".json")).write_text(
        json.dumps(run, indent=2), encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "suite": suite,
                "status": run["status"],
                "counts": run["counts"],
                "error": run.get("error"),
            }
        ),
        flush=True,
    )
    summary.append(
        {
            "id": run["id"],
            "suite": suite,
            "status": run["status"],
            "counts": run["counts"],
            "browser_version": run.get("browser_version"),
            "browser_source": run.get("browser_source"),
        }
    )
(out / "live_verification_summary.json").write_text(json.dumps(summary, indent=2))
expected = all(
    r["status"] == "completed"
    and r["counts"]["not_run"] == 0
    and (
        (r["suite"] == "failure_demo" and r["counts"]["failed"] == 1)
        or (r["suite"] != "failure_demo" and r["counts"]["failed"] == 0)
    )
    for r in summary
)
raise SystemExit(0 if expected else 1)
