# Isolated Thymeleaf rendering verification

Date: 2026-10-19 (Asia/Saigon).

**PASS — 19 assertions against the actual RMS templates.**

The check used Java 21, Spring Framework 6.2.19, Thymeleaf / thymeleaf-spring6 3.1.5.RELEASE, cached Spring mock servlet classes, Jakarta Servlet API 6.0.0, Attoparser 2.0.7.RELEASE, Unbescape 1.1.6.RELEASE, and SLF4J API 2.0.20. It constructed only a `StaticWebApplicationContext`, `SpringTemplateEngine`, and mock web exchange. It did not load RMS application properties, Spring Boot application classes, repositories, data sources, seeders, an HTTP server, or a database connection. Configuration used synthetic values only.

Actual template root: `D:\KÌ 5\SWP\hireflow-api\RetireManagement\SWP_RMS_Group-2\src\main\resources\templates`.

| Scenario | Outcome |
| --- | --- |
| Missing `rms.chat.enabled` | PASS: no widget loader or stylesheet markup |
| Explicit enabled=false | PASS: no widget loader or stylesheet markup |
| Enabled=true, local-ollama=false | PASS: configured webhook, false local-model flag, module URL and pinned vendor CSS URL render |
| Enabled=true, local-ollama=true | PASS: true local-model flag renders |
| Nonroot servlet context `/synthetic-context` | PASS: module and stylesheet URLs include the context path |
| Actual shared public-topbar, disabled | PASS: existing public header renders; no widget loader |
| Actual shared public-topbar, enabled | PASS: existing public header and exactly one widget loader render |
| Synthetic `RMS_CHAT_ENABLED`, `RMS_CHAT_LOCAL_OLLAMA`, `RMS_CHAT_WEBHOOK_URL` environment property names | PASS: Spring resolves the documented names, including explicit false flags |

This check initially exposed a Thymeleaf restricted-expression error when bean access appeared directly in `th:attr` on the script element. After moving environment lookups to the parent `th:with` and referencing those local variables in `th:attr`, all 19 assertions passed.

Verified source SHA-256:

- `fragments/rms-chat.html`: `D12DE744A14DFC6541732C97D95D1075CA94BD61FD104E2299115675BFFE33C5`.
- `fragments/layout/public-topbar.html`: `38BB7FDF1CF7874A36459F029FB47C929E682FEC41BFEEEC4640EABAEC313265`.

Local verification harness: `.runtime/template-check/FragmentRenderCheck.java`; runner: `.runtime/template-check/run.ps1`. From this chatbot workspace, run `& ./.runtime/template-check/run.ps1` while the listed cached Maven dependencies remain installed. Synthetic rendered HTML and the latest result text are under `.runtime/template-check/output/`.

This establishes template expression/fragment compatibility and feature-flag markup behavior only. It does **not** establish that RMS starts, that its database is available, that real jobs were fetched, that a real browser loaded the RMS page, or that the chatbot/LLM completed a conversation. Those outcomes require their own runtime evidence.
