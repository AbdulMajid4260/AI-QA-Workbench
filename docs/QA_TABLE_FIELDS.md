# QA table and export fields

The UI shows the main review/execution columns by default. Enable **All QA columns** for the wider table, or open **Review / edit**. CSV/JSON exports preserve the detailed fields.

- `id`
- `requirement_ids`
- `title`
- `module`
- `scenario`
- `category`
- `test_type`
- `priority`
- `severity`
- `preconditions`
- `steps`
- `test_data`
- `expected_result`
- `postconditions`
- `automation_key`
- `source_quote`
- `assumptions`
- `tags`
- `owner`
- `environment`
- `build_version`
- `origin`
- `review_status`
- `reviewer`
- `review_note`
- `validation_issues`
- `execution_status`
- `actual_result`
- `last_run_id`
- `executed_at`
- `evidence`
- `defect_ids`

Run records additionally contain the exact approved case snapshot, browser version, suite, dataset, timings, URL, console errors and evidence. Build/version defaults to “Not provided” because the public AUT does not supply an application build in this brief. Never invent it.
