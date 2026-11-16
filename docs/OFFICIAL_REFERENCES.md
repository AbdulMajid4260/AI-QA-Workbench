# Official implementation references

Consulted for API contracts and design choices during this build. Model availability and provider quotas still depend on the user's account.

- [Ollama API: chat](https://docs.ollama.com/api/chat) — local chat requests, model selection, options and structured format.
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs) — JSON-schema-constrained output; application validation remains necessary.
- [Groq API reference](https://console.groq.com/docs/api-reference) — OpenAI-compatible chat completions and model discovery.
- [Groq structured outputs](https://console.groq.com/docs/structured-outputs) — JSON object mode and model-dependent structured-output support. This implementation uses JSON object mode and Pydantic validation.
- [Playwright Python assertions](https://playwright.dev/python/docs/test-assertions) — retrying assertions for visible behavior.
- [Playwright Python actionability](https://playwright.dev/python/docs/actionability) — action auto-waiting.
- [Playwright Python trace viewer](https://playwright.dev/python/docs/trace-viewer) — local inspection of recorded execution traces.
- [Jira Cloud REST v3: issues](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/) — create-issue payloads and Atlassian Document Format descriptions.
- [SauceDemo](https://www.saucedemo.com/) — the public application under test.

The supplied assessment attachment is the authoritative scope for this project, copied to `docs/ORIGINAL_ASSESSMENT.md`.
