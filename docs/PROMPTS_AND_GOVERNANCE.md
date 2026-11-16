# Prompts, validation and human decisions

## Prompt design in this build

The system instruction defines a senior SDET role, a schema-only response, source-only factual grounding, treatment of document contents as untrusted data, explicit assumptions and hypotheses, synthetic test data and the need for human review. Each task adds a precise objective and the relevant evidence.

| Task | Supplied evidence | Output contract |
|---|---|---|
| Requirement analysis | Source text | Summary, requirements, verbatim quotes, criteria, gaps and scenarios |
| Test generation | Known requirement IDs, source text, allowed automation contracts and data keys | Complete structured case batch |
| Script draft | One test case | Python source, explanation and review checklist |
| Failure analysis | Actual result, assertions, steps, data, URL, suite and injected flag | Structured defect with hypothesis and uncertainty |
| Document answer | Selected document name, question and retrieved excerpts | Answer, chunk IDs, insufficient-evidence flag and caveats |
| QA documentation | Exact inventory and coverage/run summaries | Scope, strategy, findings, execution summary and recommendations |

The frontend's “Inspect prompt & output” opens the retained request evidence and parsed response. `prompt_version=qa-workbench-1.0` identifies this instruction version. Editing the instruction should also update the version.

## BLAST explanation for your review

BLAST is a planning/explanation framework here, not an imported library or a hidden runtime feature:

- **Blueprint:** requirements, scope, assessment mapping, architecture and acceptance checklist.
- **Links:** SauceDemo, Ollama/Groq, SQLite and Jira Cloud.
- **Architecture:** typed API, background tasks, provider adapter, page objects, retrieval and reporting.
- **Stylization:** professional, consistent UI, reviewer-first tables, explicit states and evidence panels.
- **Trigger:** human actions start analysis, generation, execution or explicit Jira publication.

Do not claim an undocumented prompt acronym is an installed dependency. If your trainer requires a specific RICEPOT definition, map that exact definition to the implemented role/context/instruction/output sections during preparation; this build does not assume a universal expansion.

## Deterministic checks and their limits

- A valid Pydantic response has the expected structure and enum values. It can still contain incorrect assertions.
- Source quote matching verifies that quoted text exists. It does not prove that the proposed scenario follows logically from it.
- Requirement ID validation prevents fabricated links. It does not prove sufficient coverage.
- Citation checks verify that array and inline IDs refer to retrieved excerpts. A cited excerpt can still fail to support a claim.
- Duplicate-step checks flag repeated steps. Case deduplication is exact-signature based, not semantic.
- Approval requires a review note. It is not an authenticated or tamper-proof compliance signature.
- No arbitrary generated Python is executed. The runtime adapter is fixed, but the reviewer must still confirm case-to-adapter equivalence.

## Cloud/local data handling

Only the explicitly selected provider is used. There is no automatic local-to-cloud fallback. The model request may include complete requirement text or retrieved document excerpts, so users should upload appropriate training content. Keys remain in server environment variables. The model configuration is saved in browser local storage, without keys.

## Failure reporting

An expected application rejection can produce a passed negative test. An infrastructure error before browser startup produces unexecuted tests, not product failures. A failed assertion is evidence that expected and observed behavior differ, not by itself proof of the underlying cause. The controlled demo is always labeled injected.

## Suggested live governance demonstration

1. Inspect an unsupported AI assumption and edit the case to manual.
2. Try approving a case with a deliberately invalid source quote; the server rejects it.
3. Restore the quote and enter a meaningful review note; approve.
4. Explain why the same browser adapter cannot legitimately execute an unrelated test scenario.
5. Show a document evidence-absent answer and the retrieved excerpts.

Use a copied test case during rehearsal. Do not deliberately corrupt the cases you plan to execute without restoring and re-reviewing them.
