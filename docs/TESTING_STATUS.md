# Build verification record

Date: **14 November 2026**. Status: **implementation packaged; external acceptance still required**.

This file distinguishes completed checks from attempted and unverified checks. It must not be presented as evidence that the full live assessment workflow has passed.

## Completed

| Check | Result | Evidence |
|---|---|---|
| Python compilation/import checks | Passed during implementation | Backend loaded and API TestClient ran |
| Offline API, validation and integration contract tests | **46 passed** | `evidence/offline-tests.txt` |
| React production build | Passed | `evidence/frontend-build.txt` |
| Python dependency resolution | Dry-run resolved the pinned requirements | `evidence/dependency-resolution.txt` |
| Combined frontend + backend preview | Opened successfully; backend connected | `evidence/ui-preview.jpg` |
| Browser navigation | Overview, Requirements, Test Cases, Execution, Document Chat, Defects, Reports and Settings inspected | Browser UI observations; summary below |
| Sample requirement loading | 2,127-character source loaded into editable input | UI observed |
| Missing Ollama handling | Task queued, then reported connection refused; no fake analysis inserted | UI observed |

The offline tests use explicit provider response fixtures and mocked Jira/network transports. They verify request contracts and application behavior, **not model quality or successful external service access**.

### Offline coverage

- Request and dataset validation; duplicate IDs; required expected outcomes.
- Source quote and requirement linkage gates; approval-note requirement.
- Draft/manual/document cases blocked from inappropriate browser execution.
- Case revisions and execution-state reset on edit.
- Actual configured provider request shapes and bounded JSON repair.
- Missing-key and provider-error behavior; no fabricated success.
- Document extraction, DOCX tables, lexical retrieval and evidence abstention.
- Rejection of fabricated array/inline citation IDs.
- Failure-only defect analysis and preserved injected-demo classification.
- RTM distinction between design, approval, execution and passing states.
- HTML escaping, CSV formula neutralization, evidence-path validation and cross-origin write rejection.
- Jira review gate, ADF payload, local duplicate prevention and timeout locking.
- Restart/interruption state and complete report/export endpoints.

## Live browser attempts: blocked, not passed

A direct Playwright run was attempted for all three supplied verification suites. The managed Chromium download returned an invalid archive in this environment. A subsequent explicit attempt with the installed `/usr/bin/chromium` could not start because the execution environment rejected its socket creation:

```text
FATAL: chrome/browser/process_singleton_posix.cc:297
socket() failed: Operation not permitted (1)
```

| Suite | Passed | Failed test assertions | Not run | Run status |
|---|---:|---:|---:|---|
| Smoke | 0 | 0 | 4 | error |
| Data-driven login | 0 | 0 | 5 | error |
| Controlled failure demo | 0 | 0 | 1 | error |

These are infrastructure launch errors, not SauceDemo product defects. **No actual browser test reached its first step in these attempts.** The raw run JSON/HTML and `evidence/live_verification_summary.json` preserve this outcome. No successful automation screenshot or trace is claimed.

The separate UI preview was inspected through the supported browser preview path. That verifies the workbench UI, not execution of the shipped Python SauceDemo runner.

## Pending on the user's machine

1. Windows setup and installation of the matching Playwright browser.
2. Successful live smoke/data-driven/approved-case execution, screenshots and traces.
3. Actual Ollama inference using an installed model, including test quality and completion time.
4. Actual Groq inference once a key is configured; model availability and JSON behavior.
5. Actual document Q&A/test generation and semantic correctness of citations.
6. Actual failure-analysis generation and QA documentation generation.
7. Jira authentication, project metadata and confirmed issue creation with the user's project rules.
8. GitHub repository creation/push and full 30-minute rehearsal.

Use `docs/ACCEPTANCE_CHECKLIST.md`. After each real check, record the actual run IDs, model configuration, result counts and any remaining failures. Do not relabel pending checks as passed without evidence.
