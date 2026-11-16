"""Small local SQLite repository. Every connection is short-lived and thread safe."""

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(os.getenv("QA_DATA_DIR", ROOT / "runtime")).resolve()
DATA.mkdir(parents=True, exist_ok=True)


def now():
    return datetime.now(timezone.utc).isoformat()


def uid(prefix):
    return f"{prefix}-{uuid4().hex[:10]}"


def connect():
    c = sqlite3.connect(DATA / "workbench.db", timeout=20)
    c.execute("PRAGMA journal_mode=WAL")
    return c


def init():
    with connect() as c:
        c.execute(
            "CREATE TABLE IF NOT EXISTS records (kind TEXT, id TEXT, data TEXT, created TEXT, PRIMARY KEY(kind,id))"
        )
    for job in all_records("jobs"):
        if job["status"] in ("queued", "running"):
            job.update(
                status="interrupted",
                error="Server restarted. This task was interrupted; start a new task.",
            )
            put("jobs", job)
    for run in all_records("runs"):
        if run["status"] in ("queued", "running"):
            run.update(
                status="interrupted", error="Server restarted before the run completed."
            )
            put("runs", run)


def put(kind, data):
    data = dict(data)
    data.setdefault("id", uid(kind[:3]))
    data.setdefault("created_at", now())
    data["updated_at"] = now()
    with connect() as c:
        c.execute(
            "INSERT INTO records VALUES (?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data",
            (
                kind,
                data["id"],
                json.dumps(data, ensure_ascii=False),
                data["created_at"],
            ),
        )
    return data


def get(kind, ident):
    with connect() as c:
        row = c.execute(
            "SELECT data FROM records WHERE kind=? AND id=?", (kind, ident)
        ).fetchone()
    return json.loads(row[0]) if row else None


def all_records(kind):
    with connect() as c:
        rows = c.execute(
            "SELECT data FROM records WHERE kind=? ORDER BY created DESC", (kind,)
        ).fetchall()
    return [json.loads(r[0]) for r in rows]


def audit(action, target, detail=""):
    return put("audit", {"action": action, "target": target, "detail": detail})
