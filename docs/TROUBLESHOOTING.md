# Troubleshooting

## Application startup

**`py` or `python` not recognized:** install Python 3.12 from the official Python distribution and enable PATH. Restart VS Code's terminal. Use the Python executable explicitly if multiple installations exist.

**PowerShell blocks scripts:** use `py -3 scripts\setup.py` and `.\.venv\Scripts\python.exe scripts\start.py`. Do not change organization policies. The scripts are conveniences; the Python entry points perform the same work.

**Port 8000 occupied:** stop your earlier workbench terminal with Ctrl+C or set `PORT=8001` in `.env`, then restart. Open the new localhost port. The start script does not kill unrelated applications. For split Vite development, also update `frontend/vite.config.js`.

**WinError 10013 / forbidden port:** choose another non-reserved local port, such as 8010, and check organizational security policies. Do not disable security software. The workbench binds to 127.0.0.1 by default.

**Frontend source changed but UI did not:** run `npm ci` once in `frontend`, then `npm run build`, and restart the backend. `Start.ps1` serves `frontend/dist`, not source files.

**Backend unavailable:** verify that `Start.ps1` is still running and the API `/api/health` responds. For split development, make sure the Vite proxy targets your backend port. A standalone Vite frontend cannot run the Python backend by itself.

## AI

**Ollama connection refused:** confirm Ollama is running and `.env` uses `http://127.0.0.1:11434`. Run `ollama list`; choose an installed tag. The Workbench does not need an Ollama API key for a local installation.

**Model not found:** copy the exact model tag, including the `:3b` or other suffix. Do not assume a name shown in an example is installed. Use Discover models.

**Ollama slow or timeout:** request two cases first. Close memory-heavy applications, use a smaller model or switch to a verified Groq model. The default timeout is 180 seconds per request. One schema repair can require another call. You can set `AI_TIMEOUT_SECONDS` up to 600, but prefer smaller batches for a live demo.

**Invalid JSON or schema mismatch:** the model gets one repair attempt. If it still fails, no cases are inserted. Reduce count or increase output tokens. A model may omit fields, emit wrong types or truncate output. Do not treat a rejected batch as completed work.

**Groq 401/403:** confirm key validity and account access. Edit only `.env` and restart. **Groq 429:** account rate/usage limit reached; respect provider retry guidance. **Model unavailable:** use Discover models and choose a chat-capable model that supports JSON object mode. The list can include models for other modalities.

**Proxy setup:** `httpx[socks]` supports standard proxy environment variables for cloud services. Local Ollama deliberately bypasses proxy environment variables. Follow your network administrator's configuration; never disable TLS verification to hide certificate problems.

## Browser execution

**Executable doesn't exist:** run `.\.venv\Scripts\python.exe -m playwright install chromium` using the SAME virtual environment as the backend. The package and browser revision must match.

**Linux missing libraries:** use Playwright's documented browser dependency installation with your administrator's approval. This is separate from Python package installation.

**Corporate browser download blocked:** ask your administrator to allow the official Playwright browser download, or explicitly configure `BROWSER_EXECUTABLE_PATH` to an existing compatible Chrome/Chromium executable. Compatibility with an arbitrary installed browser is not guaranteed. Do not disable endpoint restrictions or TLS verification.

**Browser launch denied by a hosted environment:** the code may be correct while the environment disallows browser processes or sockets. Those runs must remain error/not_run. Run acceptance on your supported local desktop; do not claim these are passes.

**Headed browser cannot open:** use headless mode on systems without a desktop display. On your Windows laptop, uncheck headless using “Show browser window on this computer” to demonstrate the browser.

**SauceDemo assertion fails:** inspect the actual screenshot, trace and URL first. Distinguish network, locator, test-data and product behavior issues. Do not loosen an assertion merely to make the test green. The curated baseline expects six inventory items and the stated training-spec behavior.

**Playwright trace:** download the `.zip`, then run `.\.venv\Scripts\python.exe -m playwright show-trace C:\path\to\trace.zip`. Keep private test traces local.

## Documents

**No usable text:** scanned PDFs need OCR before upload; this version does not perform OCR. Encrypted PDFs are rejected. Upload text-based PDF/DOCX/TXT/MD within limits.

**Poor retrieval:** use exact terms in the source or increase source excerpts. BM25 is lexical, not semantic. If a question refers to earlier chat context, restate it fully.

**Answer withheld:** citation validation failed. Inspect retrieved excerpts and retry with a simpler question. Never present an invalid-citation answer as grounded.

## Jira

**Connection fails:** use the account email, a valid unscoped Cloud API token, the correct `.atlassian.net` base URL and project key. Restart after configuration changes.

**400 on create:** inspect the error; your issue type or project may require extra fields. Use Settings → Check Jira for issue type IDs. Add project-specific required fields in `jira.py`; do not guess IDs.

**Publication unknown:** do not repeat the request. Search Jira for the local defect ID in the issue description. This state intentionally needs manual reconciliation. Record the observed issue key or confirmation that no issue exists before changing the local state through a deliberate code/data repair. There is no automatic reconciliation UI in this version.

## Data and backup

Stop the server before copying `runtime/`. The folder includes source text, AI histories, SQLite files and evidence. To start a completely new workspace, move the entire folder to a backup location while the server is stopped. Do not delete it until you have intentionally preserved needed evidence. The packaged `evidence/` folder contains the build's verification record, not your new runtime data.
