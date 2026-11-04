# Email/ — AxioDB Email Worker Agent (Agent Instructions)

Global rules live in [../AGENTS.md](../AGENTS.md). This file only adds `Email/` specifics — read the root first.

**Role** — an autonomous **Cloudflare Email Worker** (`axiodb-email-agent`) that handles incoming emails routed to AxioDB (e.g. `connect@ankan.in`). It performs early spam filtering and triage, vectorless RAG against AxioDB documentation, multi-model AI response generation, and outbound replies via Resend API or forwarding via Cloudflare Email Routing. Zero relation to the core npm package (excluded via `.npmignore`).

## Stack

Cloudflare Workers (compatibility date `2024-02-28`) · `postal-mime` (email MIME parsing) · `resend` (transactional email reply dispatch) · Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`, `@cf/meta/llama-3.3-70b-instruct-fp8-fast`) · Cloudflare KV (`EMAIL_KV` for daily AI and Resend rate limit counters) · Cloudflare Email Routing.

## Layout

```
index.js              entrypoint: exports default worker email handler from src/config/index.js
wrangler.toml         Cloudflare Worker config (AI binding, KV namespaces, vars, placement)
package.json          ESM module dependencies (postal-mime, resend)
src/
  config/
    index.js          orchestrates the end-to-end email pipeline (triage → RAG → writer → send)
    constants.js      KV keys, AI models, and configuration constants
    prompts.js        system prompts for triage and response generation
  triage/
    decisionEngine.js fast triage classifier with Clef/Flash model (DROP, FORWARD, REPLY + urgency)
  rag/
    knowledgeBase.js  fetches AxioDB documentation context for RAG
    vectorlessRag.js  in-memory keyword and TF-IDF relevance retriever over documentation
  writer/
    modelExtractor.js invokes multi-model writer routing and parses structured outputs
    jsonParser.js     safely extracts JSON verdicts from model responses
  utils/
    counter.js        KV quota helpers (readCount, bumpCount)
    emailSender.js    Resend API reply sender and Cloudflare message.forward() dispatcher
```

## Commands

```bash
cd Email
npm install
npx wrangler dev          # local worker development
npx wrangler deploy       # deploy worker to Cloudflare
npx wrangler secret put RESEND_API_KEY # configure secret key
```

## Hard rules

* **No hardcoded secrets**: API keys (e.g., `RESEND_API_KEY`) must never be committed in plaintext in `wrangler.toml` or source code; configure them via Cloudflare Worker secrets (`wrangler secret put`).
* **Enforce daily quotas**: Check KV counters (`AI_DAILY_LIMIT` and `RESEND_DAILY_LIMIT`) before executing AI runs and Resend sends. Fall back to forwarding directly to `DESTINATION_EMAIL` if limits are reached.
* **Triage early**: Discard spam (`DROP`) immediately without consuming model writer quotas or sending replies. Forward human-intervention or high-urgency queries without unnecessary reply generation.
* **Graceful failure**: In the event of parser or AI generation failures, always fall back to forwarding the raw email to destination instead of dropping valid user communications.
* **Clean workspace**: `node_modules/`, `.mf/`, and local test artifacts are gitignored and `.npmignore`d — never commit them.

## Version sync (this folder)

* `Email/package.json` → `"version"` (updated by `Scripts/versionController.sh`)

## Done for this folder

- [ ] All secrets and tokens managed via Cloudflare Worker secrets, not committed in code
- [ ] Email pipeline handles `DROP`, `FORWARD`, and `REPLY` cleanly with fallback forwarding on errors or quota limits
- [ ] Worker deploys successfully via `wrangler deploy` without unresolved imports
