# Assessment traceability

This maps the supplied assessment to implemented behavior. “Implemented” describes the code, not proof that your configured external services have passed acceptance.

| Assessment item | Implementation | Where to demonstrate | Remaining acceptance |
|---|---|---|---|
| Module 1: AI requirement analysis | Typed summary, acceptance criteria, ambiguities, missing information, positive/negative/boundary/edge scenarios | Requirements | Real Ollama/Groq inference on user's machine |
| Module 2: AI test case generation | Detailed editable cases; data, preconditions, steps, expected results, priority, source and assumptions | Test Cases | Quality review of actual generated cases |
| Module 3: AI-assisted automation | AI script drafts and adapter mapping; executable Python Playwright page objects | Test Cases + Execution + code tour | Successful live browser acceptance |
| Login | Valid and invalid credential assertions | Smoke / Data-driven / Approved suites | Live execution |
| Product selection/cart | Add exact product; assert Remove, badge and cart contents | Smoke / Approved suite | Live execution |
| Checkout | Fill synthetic fields, verify overview and completion | Smoke / Approved suite | Live execution |
| Failure evidence | Screenshot, Playwright trace, URL, error, steps and JavaScript logs | Expand an execution result | Capture on user's browser |
| Module 4: data-driven testing | Validated CSV/JSON import, one isolated result per row | Execution → Data-driven login | Run both file formats locally |
| Module 5: AI defect analysis | Text-evidence analysis; structured defect; hypothesis and regressions | Failed result → Analyze → Defects | Real inference; not vision analysis |
| Module 6: dashboard/reporting | Counts, result history, downloadable self-contained HTML and CSV/JSON | Overview / Execution / Reports | Verify produced reports after real run |
| Module 7: documentation | AI test strategy and summary; RTM and uncovered requirement detection | Reports | Actual documentation inference |
| Module 8: governance | Schema checks, source quote/ID checks, approval gate, audit, synthetic data, no executed AI code | Review workflow / Settings / provenance | Human content validation |
| Optional: suite selection | Four suite modes | Execution | UI walkthrough |
| Optional: RTM and design gaps | Designed/approved/executed/pass counts | Reports | Review real generated lineage |
| Optional: human review | Editable cases and defects; required review note for cases | Test Cases / Defects | Verify before live execution |
| Optional: Jira | Cloud REST v3 connection check, preview and explicit publication | Settings / Defects | Credentials and project-specific fields |
| Added feature: document chatbot | PDF/DOCX/TXT/MD; BM25; citation validation; history | Document Chat | Live model answer quality |
| Added feature: document test report | Focused analysis, manual cases, complete HTML collection | Document Chat / Test Cases | Human review; no arbitrary-document browser automation |

## Weighting and presentation emphasis

| Criterion | Weight | Evidence to show |
|---|---:|---|
| Prompt engineering and AI integration | 15% | Inspect prompt, provider request, model settings, actual generation |
| Requirement analysis and test generation | 20% | Source → ambiguity → scenarios → structured cases → human corrections |
| Automation framework and execution | 20% | Page objects, real assertions, reviewed adapter mapping, evidence |
| Data-driven testing | 10% | Separate CSV and JSON files; independent outcomes |
| AI defect analysis/reporting | 10% | Actual failure input; hypothesis; reviewable defect |
| Dashboard and UI | 10% | Coherent end-to-end navigation and accurate state |
| Documentation and traceability | 5% | RTM, code tour, report and setup docs |
| AI governance/validation | 5% | Failed validation and required approval; source checking |
| Code quality and innovation | 5% | Modular services, tests, document retrieval and Jira integration |

## Artifact inventory

- Source and compiled UI: included.
- Setup/start scripts and README: included.
- Sample requirements and synthetic documents: included.
- CSV/JSON login datasets: included.
- Automation scripts and page objects: included.
- Offline checks and actual blocked execution records: included in `evidence/`.
- Real AI-generated scenarios/cases and defect reports: generated at runtime after you connect a model; no fabricated samples labeled as AI output.
- Successful execution screenshots/traces: generated at runtime after browser acceptance; this build's direct browser attempts were blocked by the execution environment.
- GitHub repository: user publication step remains; the ZIP is ready for a clean initial commit.
