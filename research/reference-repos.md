# Reference repository inspection

Checked 2026-10-19. This is source inspection, not an execution or accuracy benchmark. Public GitHub metadata and the source files linked below were read; no complete platform was cloned or installed. No candidate data was sent to an AI provider.

## Decision

Keep n8n and its existing chat widget as the integration platform. None of the three recruitment reference repositories provides a complete, directly reusable embedded recruitment chatbot for RMS. In particular, the only repository with n8n JSON exports an incomplete collection workflow, so its README must not be treated as proof that a reusable matching graph exists. Use the independently inspected n8n templates and built-in nodes for the implementation; do not claim that the reference applications' matching source was reused.

## GiovAnt99/job-matching-agent

- Snapshot: [`57c04ca228717a9fb25d977d5b6a93cc1af39117`](https://github.com/GiovAnt99/job-matching-agent/tree/57c04ca228717a9fb25d977d5b6a93cc1af39117), committed 2026-05-14.
- [README](https://github.com/GiovAnt99/job-matching-agent/blob/57c04ca228717a9fb25d977d5b6a93cc1af39117/README.md) describes resume relevance scores from 1 to 5, cover letters, OpenAI, Google Sheets/Docs and Apify.
- Actual [workflow JSON](https://github.com/GiovAnt99/job-matching-agent/blob/57c04ca228717a9fb25d977d5b6a93cc1af39117/linkedin-job-matching-agent/workflow/linkedin-job-matching-agent.json) contains exactly six nodes: Schedule Trigger, Google Sheets read, Set, Aggregate, Apify Run Actor and Apify Get Dataset Items. **There is no PDF parser, AI matching/scoring node, cover-letter node, Chat Trigger, memory node or embedded-chat response path in this export.** The README's example workflow path also differs from the actual nested filename.
- [License](https://github.com/GiovAnt99/job-matching-agent/blob/57c04ca228717a9fb25d977d5b6a93cc1af39117/License): MIT, copyright 2026 Giovanni Paparo; retaining the notice is required when copying substantial content.
- OpenAI, Apify and Google integrations require external accounts/credentials; applicable quotas or charges depend on those providers. There is no bundled free inference service. These integrations are unnecessary for RMS public job reading and would add external data handling.
- Reuse decision: do not import this graph as the matching implementation. Its actual nodes collect external jobs; no matching subgraph exists to retain after removing those sources.

## Software566/ai-job-search-agent

- Snapshot: [`7003ac2043087d985184323e25839defa4bd0033`](https://github.com/Software566/ai-job-search-agent/tree/7003ac2043087d985184323e25839defa4bd0033), committed 2026-09-26.
- [README](https://github.com/Software566/ai-job-search-agent/blob/7003ac2043087d985184323e25839defa4bd0033/README.md), [matcher](https://github.com/Software566/ai-job-search-agent/blob/7003ac2043087d985184323e25839defa4bd0033/app/services/matcher.py), [semantic model](https://github.com/Software566/ai-job-search-agent/blob/7003ac2043087d985184323e25839defa4bd0033/app/services/semantic_matcher.py), [PDF parser](https://github.com/Software566/ai-job-search-agent/blob/7003ac2043087d985184323e25839defa4bd0033/app/services/resume_parser.py): a Python/FastAPI application using pypdf and local `all-MiniLM-L6-v2` embeddings. Matching is `0.6 * required-skill-overlap percentage + 0.4 * embedding cosine percentage`; it exposes matched/missing skills. FAISS is a separate supporting path, as the README acknowledges.
- [Job source](https://github.com/Software566/ai-job-search-agent/blob/7003ac2043087d985184323e25839defa4bd0033/app/services/job_api.py) accepts a configurable external API but returns hardcoded demo jobs when no URL exists. This fallback violates the RMS requirement and must not be adopted.
- The [OpenAIService](https://github.com/Software566/ai-job-search-agent/blob/7003ac2043087d985184323e25839defa4bd0033/app/services/openai_service.py) only checks whether an environment key exists; that file does not implement paid model calls. External job API charges remain provider dependent; embedding model download and local compute are still required.
- Full recursive tree inspection found no n8n workflow JSON and no LICENSE file; GitHub license metadata is null. Do not assume permission to copy its implementation.
- Reuse decision: conceptual comparison only. Deploying this adds the expressly excluded Python API and new matching code. No code copied.

## Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform

- Snapshot: [`668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1`](https://github.com/Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform/tree/668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1), committed 2026-09-26.
- [README](https://github.com/Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform/blob/668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1/README.md), [match service](https://github.com/Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform/blob/668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1/services/match_service.py), [embedding service](https://github.com/Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform/blob/668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1/services/embedding_service.py): a separate FastAPI/SQLAlchemy/PostgreSQL/pgvector recruitment application. It computes skill overlap and cosine similarity on stored local `all-MiniLM-L6-v2` embeddings and recommends five jobs through pgvector.
- [Upload route](https://github.com/Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform/blob/668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1/route/resume_routes.py) validates PDF extension/MIME and a 5 MiB size, uses PyPDF2, sends extracted text to Groq, then saves a candidate profile. These writes and external CV transmission conflict with this integration's constraints.
- [AI service](https://github.com/Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform/blob/668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1/services/ai_service.py) requires `GROQ_API_KEY`; its current default model differs from the README. Do not assume free quota, model availability or provider consent from the README.
- [Job fetch service](https://github.com/Honey-Singh716/AI-Powered-Resume-Matching-Job-Aggregation-Platform/blob/668cbc144cbc1b2e3beb53ea7a0c6bc87212a7e1/services/job_fetch_service.py) imports RemoteOK/Greenhouse/Lever jobs and uses hardcoded mock fallbacks on fetch failure. Do not reuse these external/fake sources for RMS answers.
- Full recursive tree inspection found no n8n workflow JSON and no LICENSE file; GitHub license metadata is null. No implementation copied.
- Reuse decision: inspection only; importing its schema, authentication, applications, profile storage or Python server would violate the stated architecture.

## langgenius/dify alternative

- Snapshot: [`823f40e71fc9e045a9ff2aa903a74b5b001dff33`](https://github.com/langgenius/dify/tree/823f40e71fc9e045a9ff2aa903a74b5b001dff33), committed 2026-10-19. [README](https://github.com/langgenius/dify/blob/823f40e71fc9e045a9ff2aa903a74b5b001dff33/README.md) documents visual workflows, model providers, document extraction and self-hosting. The documented minimum is 2 CPU cores and 4 GiB RAM, excluding a separately hosted local LLM's needs.
- Existing [website embedding](https://www.dify.ai/blog/add-ai-support-assistant-to-website), [document extraction](https://docs.dify.ai/en/guides/application-orchestrate/creating-an-application) and [official Ollama provider](https://marketplace.dify.ai/plugin/langgenius/ollama) are real supported components. Dify could satisfy much of the UI/document workflow without a custom frontend, but would still require public RMS data access, prompts, privacy settings and model configuration.
- [LICENSE](https://github.com/langgenius/dify/blob/823f40e71fc9e045a9ff2aa903a74b5b001dff33/LICENSE) uses Apache 2.0 with additional conditions concerning multi-tenant operation and retaining frontend logo/copyright; it is not unmodified Apache 2.0. Cloud/Enterprise subscriptions and external model usage may incur separate charges. No legal conclusion about a later commercial deployment is asserted here.
- Reuse decision: do not deploy Dify alongside n8n. No verified n8n blocker requires a second platform; switching adds deployment/configuration overhead and does not remove the RMS public-data/security work. No Dify code copied.

## Verification limits

No repository was run. No external provider account was created, no pricing tier purchased, no email sent, and no production-quality matching accuracy established. Missing LICENSE files are recorded as a reuse limitation, not as an assertion that the repositories cannot be viewed. The reference projects' evaluation statements are not RMS test results.
