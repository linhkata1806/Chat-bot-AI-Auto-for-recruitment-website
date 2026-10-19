# Upstream workflow evidence

Reviewed on 2026-10-19. These files are reference material, not the RMS integration workflow. The two numbered templates are inactive, but importing and publishing them without review would enable external data transfers and, for 18105, email and Google Sheets writes. The separate official widget example has `active: true` in its upstream JSON and uses OpenAI; keep it as research evidence, never publish it unchanged. No upstream workflow was executed and no CV was sent to a provider.

`*-response.json` preserves the displayed public API response. `*-workflow.json` contains the same `response.workflow` object, serialized with indentation for direct import and inspection. Original node parameters, connections, IDs, credential references and metadata are preserved. Credential references are upstream IDs/names; no API key/password/token values were found. `provenance.json` records source URLs, version IDs and SHA-256 hashes. Source JSON publication is not evidence of a successful workflow run.

## Template 18105

- Page: https://n8n.io/workflows/18105-match-cvs-to-remote-jobs-with-groq-google-sheets-and-gmail/
- Public JSON: https://api.n8n.io/workflows/templates/18105
- Author shown on the official page: Chijioke Ogbonna.
- Workflow version: `de055ae3-7044-460a-b7d9-7889185fc7a3`.
- 27 nodes including 8 sticky notes. All executable nodes use built-in `n8n-nodes-base` types.

The actual JSON has a Form Trigger, file-extension branch, PDF extraction, profile normalization and Google Sheets profile storage. A separate six-hour schedule fetches Remotive/Arbeitnow jobs, filters title keywords and remote preference, asks Groq for an estimated ATS score and missing keywords, generates a cover letter, writes a sent log, keeps scores >=70, and sends Gmail digests. The model is `llama-3.3-70b-versatile` through an HTTP Request with credential-based header authentication. Groq offers a rate-limited free plan and paid plans; model availability and account limits need checking before activation: https://console.groq.com/docs/rate-limits

Useful reusable pieces are the PDF extraction configuration and the explicit job/CV comparison prompt. Matching is LLM judgment, not a calibrated recruitment score. The title/work-preference filtering Code node is tailored to external job feeds. No Chat Trigger, embedded widget, Simple Memory, RMS source or read-only enforcement exists in this template.

For RMS, remove both external job feeds, scheduling, profile/sent-log persistence, cover-letter output, Gmail and forms. Replace job data with the controlled RMS source, use the native AI Agent/model nodes and add the Chat Trigger/memory. The upstream `Parse Groq` Code node takes only `$input.first()` and `$('Build Matches').first()`; its multi-job item handling needs adaptation, not blind reuse.

DOCX is not supported by the checked n8n 2.43.8 Extract From File node. Upstream 18105 contains an `Extract DOCX` node with `operation: "docx"`, but that value has neither an option nor an execution branch in the official pinned source saved here as `ExtractFromFile.node-2.43.8.ts`. Its input binary field also does not match the explicit PDF field configuration. Therefore the advertised DOCX path must not be treated as working. Official documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.extractfromfile/

## Template 16681

- Page: https://n8n.io/workflows/16681-rank-resumes-by-job-description-similarity-using-openrouter-embeddings/
- Public JSON: https://api.n8n.io/workflows/templates/16681
- Author shown on the official page: Atha Ahsan Xavier Haris.
- Workflow version: `8e921498-5c85-4e11-b98c-a4298a0b9edd`.
- 19 nodes including 5 sticky notes. All executable nodes use built-in `n8n-nodes-base` types.

The form accepts PDFs plus one JD. The template splits files, processes them in a loop, uses Extract From File `operation: "pdf"`, treats extracted text shorter than 128 characters as scanned, optionally sends the whole PDF to OpenRouter OCR, obtains JD and resume embeddings, computes cosine similarity in an existing Code node, sorts descending and returns ranked filenames. The final form output contains no skills explanations. It ranks many CVs against one JD; the RMS use case requires one CV against many active JDs.

Concrete reusable nodes:

| Node | Type/version | Relevant configuration |
| --- | --- | --- |
| Extract PDF Text | `n8n-nodes-base.extractFromFile` / 1.1 | `operation: pdf`, `binaryPropertyName: resume` |
| Is Scanned PDF? | `n8n-nodes-base.if` / 2.3 | Trimmed text length <128 |
| Rank Resumes by Similarity | `n8n-nodes-base.code` / 2 | Existing dot-product/norm cosine calculation |
| Generate Ranking | `n8n-nodes-base.code` / 2 | Descending score sort |

The embedding requests use `openai/text-embedding-3-large` through OpenRouter. At review time the provider page listed $0.13 per million input tokens: https://openrouter.ai/openai/text-embedding-3-large . The OCR branch uses `google/gemma-4-31b-it` plus `file-parser` / `mistral-ocr`, which incurs external OCR billing and transmits the original PDF. OpenRouter documents PDF processing and billing here: https://openrouter.ai/docs/guides/overview/multimodal/pdfs . No provider account was created or charged.

For the local/private RMS version, reuse PDF extraction and the existing cosine formula, reverse the iteration to active jobs, route embeddings to a local Ollama embedding model, and use the AI Agent only for explanation/conversation. The same embedding model and vector dimensions must be used for CV and jobs. A separate local chat model is needed for natural-language responses. Native HTTP Request nodes can configure calls to Ollama; no additional AI backend is necessary. Reject scanned/empty PDFs with an English explanation until a local OCR solution is deliberately configured. Do not silently use the upstream external OCR path.

This is one available reuse route, not a requirement to add embeddings. A smaller integration may reuse the comparison criteria from 18105 with a local AI Agent and qualitative matching reasons only, removing numeric ATS scores and cover letters. In that route, the source credit for 16681 is PDF parsing only; do not claim its cosine ranking was reused. The exact unmodified 18105 system prompt is extracted into `18105-match-prompt.txt` so the final prompt's adapted criteria can be reviewed against the original.

Cosine similarity measures semantic text proximity and must be labeled as an estimate, not selection probability or an official hiring decision. No custom scoring algorithm is needed. Candidate recommendations should retain the RMS-provided job IDs/links, use only current public jobs and be capped at 3-5. The upstream forms/results must be replaced by Chat Trigger-compatible input/output; there is no embedded-chat memory in the original.

## License and execution boundaries

Both official template pages label these templates "Use for free". Their downloaded JSON carries no standalone SPDX/license declaration. Preserve attribution and source provenance; do not describe the templates as MIT/Apache-licensed without additional evidence. The n8n runtime, chat package and external model licenses are separate questions from template availability. No paid template purchase is required for either download; provider charges are separate.

The official template API structure is documented at https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/configure-a-custom-workflow-templates-library . Neither template can be imported unchanged to satisfy the RMS read-only embedded chatbot requirements. Template 16681 is the stronger source for reusable PDF parsing and an explicit similarity calculation; template 18105 provides a relevant comparison prompt but has unrelated automation and an invalid DOCX operation.

Verification performed: both API JSON responses parsed; original inner workflow objects preserved; 27/19 node counts inspected; exact credentials references and destinations reviewed; official 2.43.8 Extract From File source inspected for format support. Runtime PDF extraction, local embedding availability, matching, chat response and end-to-end RMS behavior remain Not Verified in this research task.

## Official widget workflow and pinned request contract

The pinned official chat README links to the original (pre-frontend-directory-move) example URL. The 2.43.8 source tree resolves its actual file at:

https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.43.8/packages/frontend/%40n8n/chat/resources/workflow.json

Saved without modification as `widget-workflow-2.43.8.json`. Its four nodes are Chat Trigger, AI Agent, Simple Memory and OpenAI Chat Model; memory connects to both trigger and agent. Its version ID is `6076136f-fdb4-48d9-b483-d1c24c95ef9e`. This is a genuine reusable base, but its Agent 1.1 and default hosted mode require updating to the pinned supported configuration; replace OpenAI with local Ollama and remove upstream credential references in the integration export.

Pinned official source evidence:

- `ChatTrigger.node-2.43.8.ts`: embedded mode is `mode: "webhook"`, `public: true`; embedded mode with `availableInChat: false` explicitly allows `options.responseMode: "lastNode"`. The final executed node must produce `{ "output": "reply text" }`. Use the Agent's ordinary output or a Set node. Do not add the Chat node, whose response-node mode is not offered for this embedded mode.
- `widget-api-generic-2.43.8.ts` and `widget-api-message-2.43.8.ts`: ordinary file upload posts multipart fields `action=sendMessage`, the configured session key (`sessionId` by default), configured input key (`chatInput` by default), optional serialized metadata, and repeated `files` parts. Browser-generated multipart boundaries must be preserved; do not manually set Content-Type.
- `ChatTrigger.node-2.43.8.ts` `handleFormData`: copies uploaded files into `$binary.data0`, `$binary.data1`, etc. when no custom binary property is specified. `$json.files` contains metadata with the exact `binaryKey`. The safe PDF extractor input is `={{ $json.files[0].binaryKey }}` after checking the one-file limit, or normalize it to `resume`. The input multipart field `files` does **not** mean a binary key `files0`.
- `Agent.node-2.43.8.ts` and `AgentV3.node-2.43.8.ts`: default Agent is 3.1; language model required, tool input optional. `promptType: "define"`, `text`, `hasOutputParser: false` and `options.systemMessage` are supported. With no output parser, the reply is a string under `output`; prefetched controlled RMS data can be supplied without exposing any SQL tool to the model.
- `ToolsAgentV3-description-2.43.8.ts`: `options.enableStreaming` defaults to true. Set it explicitly to false together with widget `enableStreaming: false` and trigger `responseMode: "lastNode"` for this integration.

Streaming with files is implemented in the pinned widget source (`sendMessageStreaming` chooses a multipart helper when files exist), so blanket claims that it can never work are incorrect. Non-streaming is the deliberately simpler integration choice and still requires runtime verification. Upload widget MIME filtering is a UI hint; the workflow must independently enforce one PDF, MIME/extension, size and extraction error handling.
