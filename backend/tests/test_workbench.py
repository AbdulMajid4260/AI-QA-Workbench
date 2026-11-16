"""Offline contracts and API integration checks. Provider responses are test fixtures, not live AI."""

import io
import json
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from docx import Document
from backend.app import store, ai, rag, automation, reports, jira
from backend.app.main import app
from backend.app.models import ModelConfig, Analysis, TestCase, RunRequest

SOURCE = "A shopper using standard_user and secret_sauce can sign in. Successful sign-in navigates to inventory.html and displays six products."
ANALYSIS = {
    "summary": "Login acceptance",
    "requirements": [
        {
            "title": "Successful login",
            "statement": SOURCE,
            "source_quote": SOURCE,
            "acceptance_criteria": ["Inventory displays six products"],
            "risks": [],
        }
    ],
    "ambiguities": ["Password policy not specified"],
    "missing_information": ["Response-time target"],
    "scenarios": [
        {
            "title": "Valid login",
            "category": "Positive",
            "rationale": "Stated acceptance",
        }
    ],
    "suggested_additions": ["Confirm invalid credential behavior"],
}
PROV = {
    "provider": "test-fixture",
    "model": "offline-contract-fixture",
    "latency_ms": 1,
    "prompt_version": "unit-test",
}


def case_data(req="REQ-1"):
    return {
        "requirement_ids": [req],
        "title": "Successful login with valid credentials",
        "module": "Login",
        "scenario": "User signs in with public demo credentials",
        "category": "Positive",
        "test_type": "Smoke",
        "priority": "High",
        "severity": "Major",
        "preconditions": ["Login page is open"],
        "steps": [
            {
                "action": "Enter standard_user and secret_sauce",
                "expected": "Fields accept values",
            },
            {"action": "Submit login", "expected": "Inventory contains six products"},
        ],
        "test_data": {"username": "standard_user", "password": "secret_sauce"},
        "expected_result": "Inventory page displays six products",
        "postconditions": ["User is signed in"],
        "automation_key": "login_valid",
        "source_quote": SOURCE,
        "assumptions": [],
        "tags": ["smoke"],
    }


DEFECT = {
    "title": "Checkout assertion mismatch",
    "description": "The observed assertion failed.",
    "steps_to_reproduce": ["Complete checkout"],
    "expected_result": "Expected text",
    "actual_result": "Different text",
    "severity": "Minor",
    "priority": "Low",
    "classification": "Test defect hypothesis",
    "possible_root_cause": "Possibly an incorrect assertion",
    "evidence_reasoning": "Based on the failure log",
    "regression_scenarios": ["Normal checkout"],
    "uncertainties": ["No visual analysis performed"],
}


class WorkbenchTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.previous = store.DATA
        store.DATA = Path(self.tmp.name)
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        store.DATA = self.previous
        self.tmp.cleanup()

    def seed(self, approved=False):
        a = store.put(
            "analyses",
            {
                **ANALYSIS,
                "id": "ANA-1",
                "title": "Fixture",
                "source": SOURCE,
                "requirements": [{"id": "REQ-1", **ANALYSIS["requirements"][0]}],
            },
        )
        c = store.put(
            "cases",
            {
                **case_data(),
                "id": "TC-1",
                "analysis_id": a["id"],
                "review_status": "approved" if approved else "draft",
                "validation_issues": [],
                "execution_status": "not_run",
                "actual_result": "",
                "origin": "offline fixture",
                "reviewer": "",
                "review_note": "",
                "defect_ids": [],
            },
        )
        return a, c

    def wait(self, jid):
        for _ in range(200):
            j = self.client.get("/api/jobs/" + jid).json()
            if j["status"] not in ("queued", "running"):
                return j
            time.sleep(0.01)
        self.fail("Background job did not finish")

    def test_health(self):
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")

    def test_unknown_record_404(self):
        self.assertEqual(self.client.get("/api/runs/missing").status_code, 404)

    def test_cross_origin_write_rejected(self):
        r = self.client.post(
            "/api/analyses", headers={"Origin": "https://untrusted.example"}, json={}
        )
        self.assertEqual(r.status_code, 403)

    def test_secret_settings_redacted(self):
        with patch.dict(
            os.environ,
            {"GROQ_API_KEY": "never-expose", "JIRA_API_TOKEN": "never-expose"},
        ):
            r = self.client.get("/api/settings")
            self.assertNotIn("never-expose", r.text)
            self.assertTrue(r.json()["groq_configured"])

    def test_short_requirement_rejected(self):
        self.assertEqual(
            self.client.post(
                "/api/analyses", json={"text": "short", "config": {}}
            ).status_code,
            422,
        )

    def test_analysis_job_persistence(self):
        with patch(
            "backend.app.ai.generate",
            return_value=(json.loads(json.dumps(ANALYSIS)), PROV),
        ):
            r = self.client.post("/api/analyses", json={"text": SOURCE, "config": {}})
            j = self.wait(r.json()["id"])
        self.assertEqual(j["status"], "completed")
        a = store.get("analyses", j["result"]["analysis_id"])
        self.assertTrue(a["requirements"][0]["grounded"])

    def test_provider_failure_not_fake_success(self):
        with patch(
            "backend.app.ai.generate", side_effect=ai.AIError("provider unavailable")
        ):
            j = self.wait(
                self.client.post(
                    "/api/analyses", json={"text": SOURCE, "config": {}}
                ).json()["id"]
            )
        self.assertEqual(j["status"], "error")
        self.assertEqual(store.all_records("analyses"), [])

    def test_case_generation_defaults_draft(self):
        self.seed()
        with patch(
            "backend.app.ai.generate",
            return_value=({"test_cases": [case_data()]}, PROV),
        ):
            j = self.wait(
                self.client.post(
                    "/api/cases/generate",
                    json={"analysis_id": "ANA-1", "count": 4, "config": {}},
                ).json()["id"]
            )
        self.assertEqual(j["result"]["shortfall"], 3)
        c = store.get("cases", j["result"]["case_ids"][0])
        self.assertEqual(c["review_status"], "draft")

    def test_approval_requires_review_note(self):
        self.seed()
        r = self.client.put(
            "/api/cases/TC-1",
            json={"case": case_data(), "approve": True, "reviewer": "QA"},
        )
        self.assertEqual(r.status_code, 409)

    def test_ungrounded_quote_blocks_approval(self):
        self.seed()
        c = case_data()
        c["source_quote"] = "invented unavailable policy"
        r = self.client.put(
            "/api/cases/TC-1",
            json={
                "case": c,
                "approve": True,
                "reviewer": "QA",
                "review_note": "checked",
            },
        )
        self.assertEqual(r.status_code, 409)

    def test_unknown_requirement_blocks_approval(self):
        self.seed()
        c = case_data("REQ-unknown")
        r = self.client.put(
            "/api/cases/TC-1",
            json={
                "case": c,
                "approve": True,
                "reviewer": "QA",
                "review_note": "checked",
            },
        )
        self.assertEqual(r.status_code, 409)

    def test_edit_resets_execution_and_keeps_revision(self):
        _, c = self.seed(True)
        c.update(execution_status="passed", actual_result="old")
        store.put("cases", c)
        changed = case_data()
        changed["title"] = "Revised login scenario"
        r = self.client.put(
            "/api/cases/TC-1",
            json={"case": changed, "approve": False, "reviewer": "QA"},
        ).json()
        self.assertEqual(r["execution_status"], "not_run")
        self.assertEqual(r["review_status"], "draft")
        self.assertEqual(len(store.all_records("case_revisions")), 1)

    def test_review_and_plan_approved_case(self):
        self.seed()
        r = self.client.put(
            "/api/cases/TC-1",
            json={
                "case": case_data(),
                "approve": True,
                "reviewer": "QA",
                "review_note": "Source and contract checked",
            },
        )
        self.assertEqual(r.status_code, 200)
        p = automation.plan(RunRequest(suite="approved", case_ids=["TC-1"]))
        self.assertEqual(p[0]["snapshot"]["review_status"], "approved")
        self.assertEqual(p[0]["data"]["username"], "standard_user")

    def test_draft_cannot_execute(self):
        self.seed()
        with self.assertRaises(ValueError):
            automation.plan(RunRequest(suite="approved", case_ids=["TC-1"]))

    def test_manual_cannot_execute(self):
        _, c = self.seed(True)
        c["automation_key"] = "manual"
        store.put("cases", c)
        with self.assertRaises(ValueError):
            automation.plan(RunRequest(suite="approved", case_ids=["TC-1"]))

    def test_document_case_cannot_gain_browser_adapter(self):
        _, c = self.seed()
        c["document_id"] = "DOC-1"
        store.put("cases", c)
        r = self.client.put(
            "/api/cases/TC-1",
            json={
                "case": case_data(),
                "approve": True,
                "reviewer": "QA",
                "review_note": "checked",
            },
        )
        self.assertEqual(r.status_code, 409)

    def test_csv_upload_and_plan_each_row(self):
        content = "case_id,username,password,expected,expected_error\none,standard_user,secret_sauce,success,\ntwo,,,failure,Username is required\n"
        r = self.client.post(
            "/api/datasets", files={"file": ("login.csv", content, "text/csv")}
        )
        self.assertEqual(r.status_code, 200)
        plan = automation.plan(
            RunRequest(suite="data_driven", dataset_id=r.json()["id"])
        )
        self.assertEqual(len(plan), 2)
        self.assertEqual(plan[1]["key"], "login_invalid")

    def test_duplicate_dataset_ids_rejected(self):
        rows = [automation.LOGIN_DATA[0]] * 2
        self.assertEqual(
            self.client.post(
                "/api/datasets",
                files={"file": ("x.json", json.dumps(rows), "application/json")},
            ).status_code,
            422,
        )

    def test_invalid_expected_value_rejected(self):
        row = {**automation.LOGIN_DATA[0], "expected": "maybe"}
        self.assertEqual(
            self.client.post(
                "/api/datasets",
                files={"file": ("x.json", json.dumps([row]), "application/json")},
            ).status_code,
            422,
        )

    def test_missing_dataset_not_silent_fallback(self):
        with self.assertRaises(ValueError):
            automation.plan(RunRequest(suite="data_driven", dataset_id="missing"))

    def test_failure_demo_explicitly_injected(self):
        self.assertTrue(
            automation.plan(RunRequest(suite="failure_demo"))[0]["injected"]
        )

    def test_rtm_does_not_call_designed_tests_passed(self):
        self.seed()
        r = reports.rtm()[0]
        self.assertEqual(
            (r["designed"], r["approved"], r["executed"], r["passed"]), (1, 0, 0, 0)
        )

    def test_csv_formula_escaping(self):
        self.assertIn(
            "'=HYPERLINK", reports.csv_text([{"title": '=HYPERLINK("bad")'}], ["title"])
        )

    def test_html_escapes_untrusted_text(self):
        self.assertNotIn(
            "<script>",
            reports.document("<script>", [("Data", "<script>alert(1)</script>")]),
        )

    def test_markdown_document_upload(self):
        r = self.client.post(
            "/api/documents",
            files={
                "file": (
                    "policy.md",
                    "Visitors may enter between 16:00 and 18:00. Only two visitors are allowed.",
                    "text/markdown",
                )
            },
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ready")

    def test_docx_table_extraction(self):
        doc = Document()
        doc.add_paragraph("Synthetic training hospital policy.")
        t = doc.add_table(rows=1, cols=2)
        t.cell(0, 0).text = "Visitor limit"
        t.cell(0, 1).text = "Two concurrent visitors"
        b = io.BytesIO()
        doc.save(b)
        chunks = rag.extract("policy.docx", b.getvalue())
        self.assertIn("Two concurrent visitors", chunks[0]["text"])

    def test_unsupported_document_rejected(self):
        self.assertEqual(
            self.client.post(
                "/api/documents", files={"file": ("x.exe", b"not-a-document")}
            ).status_code,
            422,
        )

    def test_retrieval_selects_relevant_excerpt(self):
        cs = [
            {
                "id": "C1",
                "page": 1,
                "text": "Visitors visiting hours are 16:00 to 18:00.",
            },
            {"id": "C2", "page": 2, "text": "Laboratory CBC reports take six hours."},
        ]
        self.assertEqual(rag.retrieve(cs, "CBC laboratory", 1)[0]["id"], "C2")

    def test_no_evidence_abstains_without_ai_call(self):
        doc = store.put(
            "documents",
            {
                "name": "d",
                "chunks": [{"id": "C1", "page": 1, "text": "visitors two slots"}],
            },
        )
        with patch("backend.app.ai.generate") as mock:
            j = self.wait(
                self.client.post(
                    "/api/chat",
                    json={
                        "document_id": doc["id"],
                        "question": "quantum unicorns?",
                        "config": {},
                    },
                ).json()["id"]
            )
            mock.assert_not_called()
        self.assertTrue(
            store.get("chats", j["result"]["chat_id"])["insufficient_evidence"]
        )

    def test_fabricated_citation_withheld(self):
        doc = store.put(
            "documents",
            {
                "name": "d",
                "chunks": [
                    {
                        "id": "C1",
                        "page": 1,
                        "text": "Visitors allowed from 16:00 until 18:00",
                    }
                ],
            },
        )
        answer = {
            "answer": "Unsupported claim",
            "citations": ["C9999"],
            "insufficient_evidence": False,
            "caveats": [],
        }
        with patch("backend.app.ai.generate", return_value=(answer, PROV)):
            j = self.wait(
                self.client.post(
                    "/api/chat",
                    json={
                        "document_id": doc["id"],
                        "question": "When are visitors allowed?",
                        "config": {},
                    },
                ).json()["id"]
            )
        c = store.get("chats", j["result"]["chat_id"])
        self.assertTrue(c["insufficient_evidence"])
        self.assertNotIn("Unsupported claim", c["answer"])

    def test_evidence_traversal_rejected(self):
        store.put("runs", {"id": "run-1", "status": "completed", "results": []})
        self.assertEqual(
            self.client.get("/api/evidence/run-1/not-a-valid-file.env").status_code, 404
        )

    def test_ai_requires_actual_groq_key(self):
        with patch.dict(os.environ, {"GROQ_API_KEY": ""}):
            with self.assertRaises(ai.AIError):
                ai.generate(
                    "test", {}, Analysis, ModelConfig(provider="groq", model="test")
                )

    def test_ollama_wire_contract_and_provenance(self):
        def respond(req):
            body = json.loads(req.content)
            self.assertFalse(body["stream"])
            self.assertIn("$defs", body["format"])
            self.assertEqual(req.url.path, "/api/chat")
            return httpx.Response(
                200, json={"message": {"content": json.dumps(ANALYSIS)}}
            )

        real = httpx.Client
        with patch(
            "backend.app.ai.httpx.Client",
            side_effect=lambda **kw: real(transport=httpx.MockTransport(respond)),
        ):
            result, prov = ai.generate(
                "analyze", {"source": SOURCE}, Analysis, ModelConfig()
            )
        self.assertEqual(result["summary"], "Login acceptance")
        self.assertIn("call_id", prov)
        self.assertEqual(len(store.all_records("ai_calls")), 1)

    def test_groq_wire_contract(self):
        def respond(req):
            self.assertEqual(req.headers["Authorization"], "Bearer fixture-key")
            self.assertEqual(req.url.host, "api.groq.com")
            self.assertEqual(
                json.loads(req.content)["response_format"], {"type": "json_object"}
            )
            return httpx.Response(
                200, json={"choices": [{"message": {"content": json.dumps(ANALYSIS)}}]}
            )

        real = httpx.Client
        with patch.dict(os.environ, {"GROQ_API_KEY": "fixture-key"}), patch(
            "backend.app.ai.httpx.Client",
            side_effect=lambda **kw: real(transport=httpx.MockTransport(respond)),
        ):
            _, prov = ai.generate(
                "analyze",
                {},
                Analysis,
                ModelConfig(provider="groq", model="fixture-model"),
            )
        self.assertEqual(prov["provider"], "groq")

    def test_invalid_json_repair_bounded(self):
        calls = []

        def respond(req):
            calls.append(req)
            return httpx.Response(200, json={"message": {"content": "bad json"}})

        real = httpx.Client
        with patch(
            "backend.app.ai.httpx.Client",
            side_effect=lambda **kw: real(transport=httpx.MockTransport(respond)),
        ):
            with self.assertRaises(ai.AIError):
                ai.generate("analyze", {}, Analysis, ModelConfig())
        self.assertEqual(len(calls), 2)
        self.assertEqual(store.all_records("ai_calls"), [])

    def test_jira_requires_review(self):
        d = store.put(
            "defects",
            {
                **DEFECT,
                "review_status": "draft",
                "jira_status": "not_published",
                "jira": None,
            },
        )
        self.assertEqual(
            self.client.post(
                "/api/defects/" + d["id"] + "/publish", json={"confirm": True}
            ).status_code,
            409,
        )

    def test_jira_publish_idempotent(self):
        d = store.put(
            "defects",
            {
                **DEFECT,
                "review_status": "approved",
                "jira_status": "not_published",
                "jira": None,
            },
        )
        with patch("backend.app.jira.payload", return_value={}), patch(
            "backend.app.jira.publish",
            return_value={
                "key": "QA-1",
                "url": "https://example.atlassian.net/browse/QA-1",
            },
        ) as mock:
            self.client.post(
                "/api/defects/" + d["id"] + "/publish", json={"confirm": True}
            )
            self.client.post(
                "/api/defects/" + d["id"] + "/publish", json={"confirm": True}
            )
            self.assertEqual(mock.call_count, 1)

    def test_jira_timeout_locks_ambiguous_retry(self):
        d = store.put(
            "defects",
            {
                **DEFECT,
                "review_status": "approved",
                "jira_status": "not_published",
                "jira": None,
            },
        )
        with patch("backend.app.jira.payload", return_value={}), patch(
            "backend.app.jira.publish", side_effect=httpx.ReadTimeout("timeout")
        ) as mock:
            first = self.client.post(
                "/api/defects/" + d["id"] + "/publish", json={"confirm": True}
            )
            second = self.client.post(
                "/api/defects/" + d["id"] + "/publish", json={"confirm": True}
            )
            self.assertEqual(first.status_code, 502)
            self.assertEqual(second.status_code, 409)
            self.assertEqual(mock.call_count, 1)

    def test_jira_uses_adf_description(self):
        with patch.dict(
            os.environ,
            {
                "JIRA_BASE_URL": "https://example.atlassian.net",
                "JIRA_EMAIL": "demo@example.com",
                "JIRA_API_TOKEN": "fixture",
                "JIRA_PROJECT_KEY": "QA",
            },
        ):
            p = jira.payload(DEFECT)
            self.assertEqual(p["fields"]["description"]["type"], "doc")
            self.assertEqual(p["fields"]["description"]["version"], 1)

    def test_injected_defect_label_preserved(self):
        d = store.put(
            "defects",
            {
                **DEFECT,
                "injected": True,
                "jira_status": "not_published",
                "review_status": "draft",
            },
        )
        r = self.client.put(
            "/api/defects/" + d["id"], json={"defect": DEFECT, "reviewer": "QA"}
        ).json()
        self.assertEqual(r["classification"], "Injected demonstration failure")
        self.assertTrue(r["title"].startswith("[DEMO"))

    def test_restart_marks_interrupted(self):
        j = store.put("jobs", {"status": "running"})
        r = store.put("runs", {"status": "queued"})
        store.init()
        self.assertEqual(store.get("jobs", j["id"])["status"], "interrupted")
        self.assertEqual(store.get("runs", r["id"])["status"], "interrupted")

    def test_unknown_inline_citation_withheld(self):
        doc = store.put(
            "documents",
            {
                "name": "d",
                "chunks": [
                    {
                        "id": "C1",
                        "page": 1,
                        "text": "Visitors allowed from 16:00 until 18:00",
                    }
                ],
            },
        )
        answer = {
            "answer": "Visitors enter at 16:00 [C9999]",
            "citations": ["C1"],
            "insufficient_evidence": False,
            "caveats": [],
        }
        with patch("backend.app.ai.generate", return_value=(answer, PROV)):
            j = self.wait(
                self.client.post(
                    "/api/chat",
                    json={
                        "document_id": doc["id"],
                        "question": "When are visitors allowed?",
                        "config": {},
                    },
                ).json()["id"]
            )
        self.assertTrue(
            store.get("chats", j["result"]["chat_id"])["insufficient_evidence"]
        )

    def test_passed_result_cannot_generate_defect(self):
        r = store.put(
            "runs",
            {"results": [{"id": "R001", "status": "passed"}], "status": "completed"},
        )
        response = self.client.post(
            "/api/failures/analyze",
            json={"run_id": r["id"], "result_id": "R001", "config": {}},
        )
        self.assertEqual(response.status_code, 400)

    def test_failed_result_generates_traceable_draft(self):
        r = store.put(
            "runs",
            {
                "results": [
                    {
                        "id": "R001",
                        "status": "failed",
                        "injected": True,
                        "evidence": {},
                        "actual": "Wrong assertion",
                    }
                ],
                "status": "completed",
                "suite": "failure_demo",
                "aut": automation.AUT,
            },
        )
        with patch("backend.app.ai.generate", return_value=(dict(DEFECT), PROV)):
            j = self.wait(
                self.client.post(
                    "/api/failures/analyze",
                    json={"run_id": r["id"], "result_id": "R001", "config": {}},
                ).json()["id"]
            )
        d = store.get("defects", j["result"]["defect_id"])
        self.assertEqual(d["run_id"], r["id"])
        self.assertEqual(d["classification"], "Injected demonstration failure")
        self.assertEqual(d["review_status"], "draft")

    def test_complete_html_report_endpoint(self):
        self.seed()
        r = self.client.get("/api/export/report.html")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Requirement traceability", r.text)
        self.assertIn("TC-1", r.text)

    def test_testcase_export_includes_senior_qa_columns(self):
        self.seed()
        header = self.client.get("/api/export/cases.csv").text.splitlines()[0]
        for field in [
            "owner",
            "environment",
            "build_version",
            "steps",
            "severity",
            "source_quote",
            "actual_result",
            "defect_ids",
        ]:
            self.assertIn(field, header)


if __name__ == "__main__":
    unittest.main(verbosity=2)
