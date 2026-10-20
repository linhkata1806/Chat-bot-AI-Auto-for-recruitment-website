# RMS native widget UI verification

Review date: 2026-10-19 (Asia/Saigon).

Rechecked on 2026-10-20 after moving vendor files to the existing public `/js/vendor/**` location: all four UI fixture checks passed again. The eight vendor files remain byte-for-byte unchanged; only the initializer and fragment asset references changed.

**Reviewer disposition: Ship at standalone UI-fixture scope only. No material findings in the reviewed scope.** This is evidence for the staged native widget extension, not acceptance of the RMS or AI integration.

## Incumbent visual world

The source baseline is [RMS source inspection](rms-source-inspection.md), which identifies the actual `SWP_RMS_Group-2` checkout, its protected shared UI, and confirmed palette and typography. The widget keeps that existing visual world. No shared RMS tokens, navigation, page copy, layouts, PRODUCT.md, or DESIGN.md were changed by this documentation pass.

| Invariant | Staged evidence | Review result |
| --- | --- | --- |
| RMS green, dark green, soft green | `rms-chat.css` uses `#3e7157`, `#2e5a45`, and `#e7f0e8` for native widget variables and scoped controls | Matches the source-confirmed RMS tokens |
| Existing font stack | `Inter, "Source Sans 3", "Segoe UI", sans-serif` | Matches the source-confirmed topbar stack; no new font/CDN request |
| Native widget identity | `rms-chat.js` imports `createChat` from locally pinned `@n8n/chat` 1.42.6; no replacement chat components | Native interface retained with scoped RMS overrides |
| Scoped host-style protection | `#rms-recruitment-chat .chat-layout` resets margin, padding, maximum width and minimum dimensions for the native `<main>` | Shields the widget from the host page's `main` padding without a global reset |
| Launcher size | CSS sets 56px desktop and 52px at viewport widths up to 480px | Within the requested compact control size; fixture assertions bound both sizes at 56px |
| Responsive panel | Desktop maximum width 400px and height 600px; mobile width `calc(100vw - 24px)` and height `min(560px, calc(100dvh - 100px))`, with safe-area-aware offsets | Mobile fixture fits 390×844 without document horizontal overflow |

Implementation evidence: [scoped CSS](../integration/rms-overlay/src/main/resources/static/css/rms-chat.css), [native initializer](../integration/rms-overlay/src/main/resources/static/js/rms-chat.js), and [Thymeleaf fragment](../integration/rms-overlay/src/main/resources/templates/fragments/rms-chat.html).

The native launcher is a `div`. The initializer adds `role="button"`, `tabindex="0"`, Enter/Space activation, `aria-controls`, an open/close label and synchronized `aria-expanded`. The native window receives a named region. The fixture exercises Enter activation and the expanded state; a full keyboard or assistive-technology audit was not performed. Focus styles and reduced-motion overrides are scoped to the widget.

The session's manual Impeccable detector reported only its generic Inter warning. Inter is the verified incumbent RMS choice, so it was retained. No material visual drift was identified; no drift repair or new visual-world artifact was introduced.

## Local assets and operator gates

[The asset manifest](../integration/widget-assets.json) pins `@n8n/chat` 1.42.6 and records eight vendor files, including the four required `.mjs` modules and original license files, copied byte-for-byte from the npm package. All eight staged files matched the manifest's SHA-256 hashes and byte sizes during this review. The fragment and initializer reference local RMS static paths; widget JavaScript and CSS do not depend on a CDN.

The fragment defaults `rms.chat.enabled` to `false`, so an operator must explicitly enable the widget. It separately defaults `rms.chat.local-ollama` to `false`. The initializer enables the native PDF upload control and displays the local-processing notice only when the loader's `data-local-ollama` value is exactly `true`. Operators should enable that flag only after verifying the configured model runs locally. This UI flag does not verify the model endpoint, privacy behavior, deletion, or data retention.

The preview deliberately sets `data-local-ollama="true"` to inspect the notice and upload affordance. No real CV was submitted. The visible notice is tested copy, not proof of temporary processing or absence of external AI traffic.

## Verification evidence

The existing [fixture results](../tests/widget-results.json) report four Pass checks and an empty `assetFailures` list:

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Local native mount, one root, keyboard launcher, English local-processing notice, desktop launcher at most 56px | Pass | Standalone fixture, 1440×900 |
| Native error after sending a sample question | Pass | Webhook request deliberately aborted with connection refusal; no workflow response |
| Panel within viewport, launcher at most 56px, no document horizontal overflow | Pass | Standalone fixture, 390×844; CSS specifies the smaller 52px mobile launcher |
| Required local bundle modules load without JavaScript page errors | Pass | Fixture module loading; no live RMS page |

Reviewed captures: [desktop](../.impeccable/review/widget-desktop.png) and [mobile](../.impeccable/review/widget-mobile.png). The desktop capture shows the initial conversation and notice; the mobile capture also shows the deliberately induced native error. These are screenshots of [the standalone preview](../tests/widget-preview.html), not RMS screenshots.

[The verification script](../tests/verify-widget.mjs) intercepts requests to the fixture origin `http://127.0.0.1:18768`, fulfills local files from disk, rejects other requests and aborts its test webhook. It needs no listening HTTP server. The successful session run used the available bundled Playwright module and installed Chrome:

```powershell
$env:RMS_BROWSER_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node tests/verify-widget.mjs
```

`RMS_PLAYWRIGHT_MODULES` can override the script's bundled Playwright package root. The report records that session run; this documentation pass inspected its outputs instead of rerunning and replacing them. Separately, `validate-request.js` and `format-response.js` compiled successfully through their expected JavaScript function constructors during this review. Compilation establishes syntax validity only.

## Not Verified

The following are outside this UI fixture's evidence: actual RMS rendering and shared-page regressions; Thymeleaf property evaluation and fragment inclusion; a running n8n workflow and real webhook responses; current RMS vacancy retrieval; Ollama/LLM answers; real PDF/CV extraction; n8n execution and transient PDF-file behavior; memory expiry, retention/deletion and privacy guarantees. Separate [Thymeleaf checks](../tests/thymeleaf-fragment-results.md) subsequently verified 19 isolated rendering assertions against the actual templates; see the current [combined test report](../docs/TEST-RESULTS.md) for later runtime evidence. The fixture error check does not establish live service availability or recovery.

The UI-fixture disposition does not remove those runtime acceptance requirements. This pass added only this evidence document and left the incumbent implementation and visual world unchanged.
