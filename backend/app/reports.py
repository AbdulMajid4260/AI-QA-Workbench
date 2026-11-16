import base64
import csv
import html
import io
import json
from . import store

CASE_COLUMNS = [
    "id",
    "requirement_ids",
    "title",
    "module",
    "scenario",
    "category",
    "test_type",
    "priority",
    "severity",
    "preconditions",
    "steps",
    "test_data",
    "expected_result",
    "postconditions",
    "automation_key",
    "source_quote",
    "assumptions",
    "tags",
    "owner",
    "environment",
    "build_version",
    "origin",
    "review_status",
    "reviewer",
    "review_note",
    "validation_issues",
    "execution_status",
    "actual_result",
    "last_run_id",
    "executed_at",
    "evidence",
    "defect_ids",
]


def csv_text(rows, columns):
    out = io.StringIO(newline="")
    writer = csv.DictWriter(out, fieldnames=columns)
    writer.writeheader()
    for row in rows:
        safe = {}
        for key in columns:
            value = row.get(key, "")
            value = (
                json.dumps(value, ensure_ascii=False)
                if isinstance(value, (list, dict))
                else str(value)
            )
            # Prevent spreadsheet formula execution on user-controlled cell contents.
            if value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")):
                value = "'" + value
            safe[key] = value
        writer.writerow(safe)
    return "\ufeff" + out.getvalue()


def rtm():
    cases = store.all_records("cases")
    rows = []
    for a in store.all_records("analyses"):
        for req in a["requirements"]:
            linked = [c for c in cases if req["id"] in c["requirement_ids"]]
            rows.append(
                {
                    "requirement_id": req["id"],
                    "requirement": req["title"],
                    "analysis": a["title"],
                    "test_ids": [c["id"] for c in linked],
                    "designed": len(linked),
                    "approved": sum(c["review_status"] == "approved" for c in linked),
                    "automatable": sum(c["automation_key"] != "manual" for c in linked),
                    "executed": sum(
                        c.get("execution_status") in ("passed", "failed")
                        for c in linked
                    ),
                    "passed": sum(
                        c.get("execution_status") == "passed" for c in linked
                    ),
                    "gap": (
                        "No test cases"
                        if not linked
                        else (
                            "No approved tests"
                            if not any(c["review_status"] == "approved" for c in linked)
                            else "Covered by design"
                        )
                    ),
                }
            )
    return rows


def document(title, sections):
    esc = lambda v: html.escape(str(v))
    body = ""
    for name, content in sections:
        body += f"<section><h2>{esc(name)}</h2>"
        if isinstance(content, list) and content and isinstance(content[0], dict):
            keys = list(dict.fromkeys(k for row in content for k in row))
            body += (
                '<div class="scroll"><table><thead><tr>'
                + "".join(f'<th>{esc(k.replace("_"," "))}</th>' for k in keys)
                + "</tr></thead><tbody>"
            )
            for row in content:
                body += (
                    "<tr>"
                    + "".join(
                        "<td>"
                        + esc(
                            json.dumps(row.get(k, ""), ensure_ascii=False)
                            if isinstance(row.get(k), (dict, list))
                            else row.get(k, "")
                        )
                        + "</td>"
                        for k in keys
                    )
                    + "</tr>"
                )
            body += "</tbody></table></div>"
        else:
            body += (
                "<pre>"
                + esc(
                    json.dumps(content, indent=2, ensure_ascii=False)
                    if not isinstance(content, str)
                    else content
                )
                + "</pre>"
            )
        body += "</section>"
    return (
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'
        + esc(title)
        + "</title><style>body{font:15px system-ui;color:#16223b;background:#f3f5fa;margin:0;padding:40px}header{padding:30px;background:#13233d;color:white;border-radius:16px}section{background:white;padding:25px;margin:22px 0;border-radius:14px}table{border-collapse:collapse;font-size:13px}th,td{padding:12px;border:1px solid #dce3ee;text-align:left;vertical-align:top;min-width:130px;max-width:550px;overflow-wrap:anywhere}th{background:#eaf0f9}.scroll{overflow:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px system-ui;line-height:1.7}h1{font-size:30px}@media print{body{padding:0;background:white}.scroll{overflow:visible}table{font-size:9px}th,td{min-width:0;padding:4px}}</style><header><small>QA WORKBENCH / REVIEWABLE EVIDENCE</small><h1>"
        + esc(title)
        + "</h1><p>Generated "
        + esc(store.now())
        + " · AI suggestions require human review</p></header>"
        + body
        + "</html>"
    )


def run_report(run):
    content = document(
        "Execution report · " + run["id"],
        [
            (
                "Run summary",
                {k: v for k, v in run.items() if k not in ("plan", "results")},
            ),
            ("Individual results", run["results"]),
            ("Execution plan and approved snapshots", run["plan"]),
        ],
    )
    images = ""
    for result in run["results"]:
        path = store.DATA / "evidence" / run["id"] / (result["id"] + ".png")
        if path.exists():
            images += (
                "<section><h2>"
                + html.escape(result["title"])
                + '</h2><img style="max-width:100%" alt="Captured browser evidence" src="data:image/png;base64,'
                + base64.b64encode(path.read_bytes()).decode()
                + '"></section>'
            )
    return content.replace("</html>", images + "</html>")
