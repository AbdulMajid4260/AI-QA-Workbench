# Your 30-minute live demonstration

## Complete this before the presentation

- Run the local acceptance checklist in `ACCEPTANCE_CHECKLIST.md`; resolve failures before the slot.
- Verify Ollama inference or Groq inference with the exact selected model. Keep one provider you have successfully tested.
- Generate and review 4–6 cases in advance. Keep their provenance visible. Pre-generated live AI artifacts are acceptable for explaining history, but perform one short generation live too.
- Complete one smoke run, one data-driven run and the controlled failure demonstration. Preserve screenshots, traces and the HTML report.
- Approve one AI defect draft. If Jira is configured, publish a clearly labeled DEMO issue in a training project during rehearsal.
- Upload the hospital sample, ask a grounded question and an evidence-absent question, and generate document tests.
- Keep the workbench, VS Code, repository, source requirements and a downloaded report open.
- Close unrelated tabs and applications. Hide `.env` from the shared screen. Start 10 minutes early.

## Timing

| Time | What to demonstrate | What to explain |
|---|---|---|
| 00:00–03:00 | Overview and architecture | Problem, end-to-end flow, React → FastAPI → SQLite / model / Playwright |
| 03:00–07:00 | Requirements: source input, short live analysis, prior completed analysis | Ambiguities, missing acceptance criteria, source quotes, scenario categories |
| 07:00–11:00 | Test Cases: generate a small batch; inspect and edit a completed case | Senior QA fields, source linkage, assumptions, validation and human review |
| 11:00–16:00 | Execution: run approved cases and CSV/JSON login tests | Actual browser actions, data per row, page objects, assertions, isolation and timing |
| 16:00–20:00 | Controlled failure, evidence, AI defect analysis | Deliberate assertion failure; screenshot/trace; hypothesis versus confirmed cause |
| 20:00–23:00 | Jira draft preview; publish only if ready | Approval, REST v3 payload, saved issue URL, duplicate protection |
| 23:00–26:00 | Document Chat and report | Upload, chunking, BM25 retrieval, citations, abstention and manual test generation |
| 26:00–28:00 | RTM, AI documentation, exports | Designed versus approved versus executed coverage; reporting limits |
| 28:00–30:00 | Questions | Explain implementation choices and known limitations honestly |

Use 2–3 live-generated cases if your local model is slow. Start one AI task, explain architecture while it runs, then return to it. Do not spend the slot silently waiting for inference. If a provider fails, show the actual error, switch only to a previously verified provider, and use honestly labeled earlier live artifacts for explanation.

## Opening explanation

“I built a local AI-assisted QA workbench for SauceDemo. It takes requirements, uses an LLM to analyze them and propose structured test cases, asks a person to review those cases, runs approved supported workflows in Playwright, captures actual evidence, and uses that evidence to draft defect reports. Every result is traceable to a source requirement and an execution record.”

## Code tour: five files

1. `backend/app/models.py`: request and output contracts. Explain that valid JSON is not necessarily factually correct.
2. `backend/app/ai.py`: shared system instruction, provider switch, token settings, timeout, one repair attempt, provenance.
3. `backend/app/pages.py`: page objects for login, inventory, cart and checkout; stable locators and retrying assertions.
4. `backend/app/automation.py`: approved-case snapshots, data iteration, isolated browser contexts, result/evidence capture.
5. `backend/app/main.py`: review gates, background tasks, document flow, defect review and Jira publication.

Show `rag.py`, `jira.py` and `reports.py` if asked. Explain any code you present before the assessment; do not just read filenames.

## Questions you should be ready to answer

**Is the AI actually integrated?**
Yes: runtime requests go to the selected Ollama or Groq endpoint. The exact prompt, model configuration and parsed output are stored. The app does not manufacture successful output when the provider fails. During the demo, show a completed live call from your machine.

**Why Python Playwright rather than Selenium?**
Python matches my training. Playwright provides browser contexts, trace capture and retrying assertions with a compact API. Selenium is also valid; the assessment allows either.

**Does AI-generated code execute directly?**
No. The app can generate a reviewable Python draft, but live execution uses a small set of maintained page-object contracts. A human verifies that a generated case matches its adapter. This keeps execution explainable and prevents arbitrary generated code from running inside the backend.

**How is this AI-assisted automation?**
AI assists requirement analysis, scenario design, data suggestions, adapter selection, script drafting and failure interpretation. The maintained runtime performs the actual browser actions and assertions. AI is not claimed to autonomously automate any arbitrary scenario.

**What does data-driven testing mean here?**
The same login workflow is executed once for each validated CSV/JSON row, with different credentials and expected outcomes. Each row has its own result, context, duration and evidence.

**Why does an invalid login test pass?**
The test expects rejection. If the application rejects the credentials as specified, the negative test passes. “Failure expected” is not the same as “test failed.”

**What exactly failed in the demonstration?**
The controlled demo deliberately expects incorrect checkout confirmation text. The browser performs a real checkout and an actual assertion fails. It proves capture and analysis plumbing; it is not evidence of a SauceDemo product defect.

**How do you prevent hallucinations?**
I constrain output schemas, supply source context, validate requirement IDs and source quotes, reject missing/invalid citations and require human review. These controls reduce unsupported output; they cannot guarantee complete factual accuracy.

**Are screenshots sent to the model?**
No. The current model connector is text-only. The model receives failure logs and assertions. Screenshots and traces are available for human inspection. Vision-based analysis is a future enhancement.

**Is the document feature RAG?**
Yes, retrieval-augmented generation with lexical BM25 retrieval. It extracts text, chunks it, retrieves relevant excerpts and asks an LLM to answer from those excerpts. It does not currently use embeddings or a vector database.

**Does the chatbot remember previous messages?**
The history is saved, but each question is answered independently from the selected document. Follow-ups should restate the relevant subject. Cross-message conversational memory is not implemented.

**Is this LLM-as-a-judge?**
The current assessment build uses AI for analysis and generation. Citation/source checks are deterministic validation. It does not implement RAGAS, DeepEval or a separate LLM judging pipeline. Do not claim otherwise.

**What is RTM coverage?**
The percentage shown is design coverage: requirements with at least one linked case. Approval, execution and passing counts are separate. A requirement with a drafted case is not automatically tested or passed.

**What happens if Jira times out?**
The outcome may be uncertain even if the server created an issue. The app records `unknown` and blocks automatic retry. I search Jira using the local defect reference before deciding whether to retry.

**What would you improve for production?**
Authentication and RBAC, project/tenant boundaries, a durable task queue, versioned relational entities, semantic retrieval and evaluation, stronger upload isolation, approval role controls, richer adapter coverage, CI, accessibility tests and Jira attachment/custom-field support.
