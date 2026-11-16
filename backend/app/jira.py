"""Jira Cloud REST v3. Review locally, explicitly publish, preserve uncertain outcomes."""

import os
import re
import httpx
from .ai import clean_error


def configuration():
    base = os.getenv("JIRA_BASE_URL", "").rstrip("/")
    if not re.fullmatch(r"https://[a-zA-Z0-9-]+\.atlassian\.net", base):
        raise ValueError(
            "Set JIRA_BASE_URL to https://your-team.atlassian.net (Jira Cloud)."
        )
    email = os.getenv("JIRA_EMAIL", "")
    token = os.getenv("JIRA_API_TOKEN", "")
    project = os.getenv("JIRA_PROJECT_KEY", "")
    if not email or not token or not project:
        raise ValueError(
            "Set JIRA_EMAIL, JIRA_API_TOKEN and JIRA_PROJECT_KEY in .env, then restart."
        )
    return base, email, token, project


def description(defect):
    chunks = [
        ("Description", defect["description"]),
        (
            "Steps to reproduce",
            "\n".join(
                f"{i+1}. {s}" for i, s in enumerate(defect["steps_to_reproduce"])
            ),
        ),
        ("Expected", defect["expected_result"]),
        ("Actual", defect["actual_result"]),
        ("Severity / priority", defect["severity"] + " / " + defect["priority"]),
        ("Classification", defect["classification"]),
        ("Possible root cause — hypothesis", defect["possible_root_cause"]),
        ("Evidence reasoning", defect["evidence_reasoning"]),
        ("Regression scenarios", "\n".join(defect["regression_scenarios"])),
        ("Uncertainties", "\n".join(defect["uncertainties"])),
        (
            "Workbench reference",
            defect.get("id", "")
            + "; run "
            + defect.get("run_id", "")
            + "; result "
            + defect.get("result_id", ""),
        ),
    ]
    return {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": title + ": " + (body or "None recorded")}
                ],
            }
            for title, body in chunks
        ],
    }


def payload(defect):
    _, _, _, project = configuration()
    issue_type = (
        {"id": os.getenv("JIRA_ISSUE_TYPE_ID")}
        if os.getenv("JIRA_ISSUE_TYPE_ID")
        else {"name": os.getenv("JIRA_ISSUE_TYPE", "Bug")}
    )
    return {
        "fields": {
            "project": {"key": project},
            "summary": defect["title"][:250],
            "description": description(defect),
            "issuetype": issue_type,
            "labels": ["ai-qa-workbench", "human-reviewed"],
        }
    }


def check():
    base, email, token, project = configuration()
    with httpx.Client(auth=(email, token), timeout=20, follow_redirects=False) as c:
        r = c.get(base + "/rest/api/3/myself")
        r.raise_for_status()
        p = c.get(base + "/rest/api/3/project/" + project)
        p.raise_for_status()
        return {
            "connected": True,
            "project": p.json()["key"],
            "issue_types": [
                {"id": i["id"], "name": i["name"]}
                for i in p.json().get("issueTypes", [])
            ],
        }


def publish(defect):
    base, email, token, _ = configuration()
    with httpx.Client(auth=(email, token), timeout=30, follow_redirects=False) as c:
        r = c.post(base + "/rest/api/3/issue", json=payload(defect))
        if r.status_code >= 400:
            raise ValueError(
                f"Jira HTTP {r.status_code}: " + clean_error(r.text[:1200])
            )
        key = r.json()["key"]
    return {"key": key, "url": base + "/browse/" + key}
