# AI-Powered QA Workbench

A local, single-user workbench for Abdul's individual SauceDemo practical assessment. It connects requirement analysis, structured test design, human review, browser execution, evidence, AI defect analysis and reporting. It also includes document Q&A, source-linked document test generation and Jira Cloud issue creation.

**Read `docs/TESTING_STATUS.md` before presenting.** The source and production frontend build are included. Offline checks and UI checks were performed; live model inference, Jira creation and successful Playwright execution still require acceptance on your own computer. No static output is represented as a real AI response.

## Start on Windows — recommended

1. Extract this entire ZIP to a normal folder, for example `C:\Projects\AI_QA_Workbench`. Open that folder in VS Code.
2. Install Python 3.12 if needed. Run `py --version` to confirm. Node is optional because the built frontend is included.
3. Open the VS Code PowerShell terminal in the extracted project folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\Setup.ps1
powershell -ExecutionPolicy Bypass -File .\Start.ps1
```

`-ExecutionPolicy Bypass` applies to that one PowerShell invocation. If your organization disallows script execution, use the Python commands below instead of changing organization policies.

```powershell
py -3 scripts\setup.py
.\.venv\Scripts\python.exe scripts\start.py
```

4. Open **http://127.0.0.1:8000**. API documentation is at **http://127.0.0.1:8000/docs**.
5. Keep the terminal open. Stop with Ctrl+C. Existing SQLite records survive restarts.

Setup creates `.venv`, installs Python dependencies and Chromium, and copies `.env.example` to `.env` only if it does not exist. The ZIP intentionally excludes installed dependencies and credentials. Internet access is needed for first-time installation and SauceDemo/Groq/Jira.

### Linux / macOS

```bash
bash setup.sh
bash start.sh
```

On Linux, missing Chromium system libraries may require the OS administrator to run the standard Playwright dependency installation. See `docs/TROUBLESHOOTING.md`.

## Connect Ollama and Groq

For Ollama, use your existing installed model. Run `ollama list` and copy the exact tag into the model field in the app. The default is `qwen2.5:3b`. If Ollama is not already running, start it normally; do not launch a second server on an occupied port.

For Groq, edit the project root `.env`:

```dotenv
GROQ_API_KEY=your_actual_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Restart the backend after edits. Select Groq in the top bar, click **Discover models**, and select a currently available chat model. Availability and model limits depend on your account. The model name is editable. No API key belongs in the React source, a screenshot, Git, or a chat message.

**Local workflow:** choose 2–4 cases per request and temperature 0. Start with 3,500 output tokens; increase to 5,000 if the model returns incomplete JSON. A small model may need a retry or a smaller batch. A failed model call produces an error, never a fabricated fallback.

**Cloud privacy:** using Groq sends the requirement text or selected document excerpts, task instructions and schema to Groq. Ollama uses the configured local endpoint. The application does not send screenshot pixels to the AI.

## Your first end-to-end session

1. **Settings:** check the selected provider. Model discovery verifies connectivity, not inference.
2. **Requirements:** load the included SauceDemo sample, then **Analyze with AI**.
3. Review summaries, source quotes, gaps and scenarios. Generate **4 test cases**.
4. **Test Cases:** expand each case. Edit fields as needed. Choose an exact compatible automation contract or keep it manual. Write a review note and **Save & approve**.
5. **Execution:** first run **Core smoke suite**. Then select **Reviewed AI test cases** and execute approved cases.
6. Import `samples/login_data.csv` or `.json`. Run **Data-driven login** and inspect all five row results.
7. Run **Controlled failure demo**. Expand its failed result, inspect the screenshot and trace, and choose **Analyze failure with AI**. This is a deliberately injected assertion failure, not a real product defect.
8. **Defects:** review the root-cause hypothesis, reproduction steps and uncertainties. Approve the draft.
9. **Reports:** inspect the RTM, generate AI documentation and download HTML/CSV/JSON reports.
10. **Document Chat:** upload `samples/hospital_policy.md`, ask “What are the visiting hours and visitor limit?”, inspect citations, and ask “What is the daily parking fee?” to verify evidence handling. Generate tests for “visitor capacity and pass expiry”. Download the complete document report.

Use **`docs/DEMO_30_MINUTES.md`** for the live presentation.

## Jira — final credential-dependent acceptance

Set these in `.env`, then restart:

```dotenv
JIRA_BASE_URL=https://your-team.atlassian.net
JIRA_EMAIL=your-account-email
JIRA_API_TOKEN=your-unscoped-jira-cloud-api-token
JIRA_PROJECT_KEY=QA
JIRA_ISSUE_TYPE=Bug
```

This connector uses Jira Cloud REST v3 and email + an unscoped API token. Scoped-token gateway authentication and Jira Server/Data Center are not implemented. You may use `JIRA_ISSUE_TYPE_ID` if the issue-type name differs. The Settings connection check returns valid issue types.

Check the connection, review a defect, preview its Jira payload, and explicitly confirm **Create issue**. The issue contains an Atlassian Document Format description with steps, expected/actual results, severity/priority text, regression ideas, hypotheses and the workbench reference. The returned issue URL is saved locally.

The connector does not guess your Jira priority IDs, attach binary evidence or fill custom required fields. Severity and priority are included in the description. Adapt `backend/app/jira.py` if your project requires extra fields. Requests with uncertain outcomes are locked against blind retries; search Jira for the workbench defect ID before resolving them.

## Technology

| Layer | Implementation |
|---|---|
| User interface | React 19, Vite, Lucide icons, responsive CSS |
| API | Python / FastAPI, Pydantic request and output schemas |
| Persistence | SQLite with WAL, local JSON records and audit trail |
| AI | Ollama `/api/chat`; Groq OpenAI-compatible chat completions |
| Test automation | Python Playwright sync API, Chromium, page objects |
| Data-driven execution | Separate validated CSV / JSON datasets |
| Document retrieval | Text extraction, overlapping chunks, BM25 lexical ranking |
| Evidence | Actual assertions, screenshots, traces and immutable run snapshots |
| Reporting | Standalone HTML, CSV, JSON, RTM and AI-authored QA documentation |
| Defects | Structured AI draft, human review, Jira Cloud REST v3 |

## Project map

```text
backend/app/       API, schemas, AI, retrieval, page objects, runner, Jira, reports
backend/tests/     Offline API and integration contract checks
frontend/src/      React UI and styles
frontend/dist/     Ready-to-run production UI
samples/           Source requirements, CSV/JSON datasets, document samples
scripts/           Setup, start, doctor, local preview and live verification
docs/             Architecture, demo, traceability, prompt notes, acceptance checklist
 evidence/         Actual verification logs and blocked-run records from this build
 runtime/          Created locally; database, screenshots and traces; excluded from Git
```

## Verification commands

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
.\.venv\Scripts\python.exe scripts\doctor.py
```

Run real browser acceptance with the server stopped, or run suites through the UI while it is running:

```powershell
.\.venv\Scripts\python.exe scripts\verify_live.py --live
```

`verify_live.py` runs smoke, data-driven login and the controlled failure demo, then writes real JSON/HTML reports to `evidence/`. It exits successfully only if smoke and data-driven tests pass and exactly one deliberate demo failure occurs. The demo failure remains a failure in the report. It does not test AI or Jira.

## Frontend development

Node.js 20.19+ or 22+ is recommended for rebuilding. Use two terminals:

```powershell
# Terminal A, project root
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
# Terminal B
cd frontend
npm ci
npm run dev
```

Vite proxies `/api` to port 8000. For the one-server packaged build, run `npm run build` in `frontend`, then restart `Start.ps1`. If you change backend PORT for split development, update the Vite proxy too.

## Scope and limitations

This is an assessment-sized local application, not a production SaaS. There is no multi-user login, tenant isolation, RBAC, distributed queue, OCR, semantic embedding service, RAGAS/DeepEval evaluation or autonomous browser agent. Q&A uses source retrieval plus citation validation, not a guarantee of factual correctness. Each question is independent; the displayed conversation is persistent history, not conversational memory.

AI-generated scripts are downloadable drafts and are not automatically executed. Executable cases use five maintained workflow adapters; unsupported scenarios remain manual. There is no manual-result recording screen yet. Document cases cannot execute against SauceDemo. Invalid provider responses are rejected after one bounded repair attempt. See `docs/ARCHITECTURE.md` for design decisions and `docs/TESTING_STATUS.md` for actual validation evidence.

## GitHub handoff

A repository has not been created or pushed from this environment. This folder is ready to commit to your own repository. Ensure `.env`, `.venv`, `runtime`, personal uploads and generated reports containing sensitive content stay out of Git. The supplied samples contain synthetic/public demo data only.
