# Local acceptance checklist

Record actual evidence on your machine. Do not mark these passed simply because the code exists.

| ID | Action | Expected result | Actual status / evidence |
|---|---|---|---|
| SET-01 | Run setup and start | UI opens at localhost; backend connected | Pending local run |
| SET-02 | Restart application | Existing records remain; unfinished tasks marked interrupted | Pending local run |
| AI-01 | Discover Ollama models | Installed model tags returned | Pending local model |
| AI-02 | Analyze sample with Ollama | Actual analysis persisted with prompt/provenance | Pending local model |
| AI-03 | Add Groq key, restart, choose available chat model | Actual Groq analysis succeeds | Pending credentials |
| AI-04 | Generate 4 cases | Structured distinct cases, count/shortfall honestly recorded | Pending live generation |
| GOV-01 | Approve with invalid quote / requirement ID | Approval rejected | Offline tests passed; verify UI locally |
| GOV-02 | Approve valid case with meaningful note | Approved; can be selected for execution | Offline tests passed; verify UI locally |
| GOV-03 | Edit previously executed case | Latest result resets; revision and previous run remain | Offline tests passed |
| AUTO-01 | Core smoke suite | 4 real passes, screenshots and traces | Pending local browser |
| AUTO-02 | Approved AI cases | Actual mapped workflows execute; immutable case snapshots retained | Pending local browser |
| DATA-01 | Import sample CSV and run | 5 independent passes if current AUT meets the specification | Pending local browser |
| DATA-02 | Import JSON and run | Same 5 independently verified outcomes | Pending local browser |
| DATA-03 | Duplicate case IDs or invalid expected value | Import rejected | Offline tests passed |
| FAIL-01 | Controlled failure demonstration | 1 real assertion failure clearly labeled injected | Pending local browser |
| FAIL-02 | Analyze the failed result | Structured defect; hypothesis, evidence reasoning and regression ideas | Pending live model |
| RAG-01 | Upload hospital sample | Document ready with excerpt count | Extraction/API checked; verify UI locally |
| RAG-02 | Ask visiting hours and maximum visitors | Answer matches 16:00–18:00 and two; source IDs visible | Pending live model |
| RAG-03 | Ask parking fee | Explicitly says unspecified; no invented price | Pending live model |
| RAG-04 | Switch to travel source and ask hospital-specific question | No cross-document leakage; insufficient evidence | Pending live model |
| RAG-05 | Generate visitor test cases | Manual source-linked cases and document report | Pending live model |
| JIRA-01 | Check Jira connection | Correct project and issue types returned | Pending credentials |
| JIRA-02 | Preview approved defect payload | Correct project, title and ADF description | Offline payload check passed |
| JIRA-03 | Explicitly create demo issue | One issue created, browser link saved | Pending credentials |
| JIRA-04 | Re-submit same local defect | Reuses recorded key; no duplicate | Offline idempotency check passed |
| REPORT-01 | Download cases CSV/JSON and RTM | All selected QA fields and actual state preserved | API checks; review live records |
| REPORT-02 | Open run HTML | Actual counts, plan, row results, screenshot images | Pending successful local run |
| REPORT-03 | Generate QA documentation | Summary grounded in current inventory | Pending live model |

## Credential entry order

1. Verify the app and browser installation without any cloud keys.
2. Verify your existing Ollama model.
3. Add Groq key in `.env`, restart and verify inference.
4. Add Jira connection values in `.env`, restart and verify project access.
5. Publish one deliberately labeled test issue in a training project.
6. Complete the rehearsal before relying on this build for assessment.

Do not paste your API tokens into ChatGPT. Keep them in the local `.env` file.
