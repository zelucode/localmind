# LocalMind data-collection prompts

Paste a prompt into any LLM that can browse the web (Perplexity, ChatGPT with search, Gemini Deep Research, Claude with search, Grok). Ask for **one chunk at a time** (about 25 items), save the reply as a `.json` file, and give it to Claude Code to validate and merge.

Output rules are the same everywhere, so every reply can be merged mechanically:

- Output is **one JSON array in one code block**, nothing else. Models that ignore this get the "FIX" follow-up at the bottom.
- Field names and enum values match `src/types.ts` exactly.
- Unknown values are `null`. They are never guessed.
- Every item carries `sourceUrl` and `verifiedOn` so stale data can be found later.

Before running prompts A and B, attach or paste the matching file from this folder:

- `existing-tool-domains.txt` for prompt A
- `existing-bookmark-domains.txt` for prompt B

The model must skip anything already listed there.

---

## 0. Shared preamble (already included in every prompt below)

```
You are a research assistant building a catalog of FREE tools for a desktop app called LocalMind (a hub for free-tier AI tools, no-signup web utilities, local AI runners and API keys).

HARD RULES
1. Use live web search. Open the official site or pricing page of every item. Do not rely on memory: free tiers change monthly.
2. "Free" means a usable permanent free tier, a no-cost open-source tool, or a free trial of 30 days or more. Exclude "free trial 7 days, then pay" products, and exclude paid tools with a demo.
3. Never invent. If a value cannot be verified, use null. A smaller verified list beats a longer guessed one.
4. Every URL must be the real, working official URL (no tracking params, no affiliate links, no shorteners). Skip anything you cannot open.
5. Skip anything whose domain appears in the EXISTING list I attach.
6. Output ONE JSON array inside ONE ```json code block. No commentary before or after. No trailing commas. Double quotes only. ASCII punctuation only (no curly quotes, no em dashes).
7. Today's date is {TODAY}. Put it in "verifiedOn" as YYYY-MM-DD.
8. id = lowercase-kebab-case, unique, derived from the product name.
9. description = one factual sentence, max 200 chars, no marketing words ("revolutionary", "game-changing").
10. tags = 3 to 6 lowercase kebab-case words.
```

Replace `{TODAY}` with the real date each time.

---

## A. AI tools (Tools page)

Fills the `AITool` type. Existing categories: `web-llm`, `coding-agent`, `design-media`, `uniform-proxy`. New ideas go in `proposedCategory`.

```
[PASTE SHARED PREAMBLE]

TASK: Find {N=25} FREE AI tools in the area: {AREA}.
Pick AREA from this list, one per run:
  1. Web chatbots and search assistants (free tier)
  2. Coding agents, CLIs and IDE extensions (free tier or bring-your-own-key)
  3. Image generation / editing / upscaling / background removal
  4. Video, animation and avatar generation
  5. Audio: text-to-speech, speech-to-text, music, voice cloning, noise removal
  6. Writing, research, summarizing, note-taking, presentations
  7. App / website builders and no-code agents
  8. Data, spreadsheets, SQL, charts, OCR, document parsing
  9. Agents, automation and workflow builders (n8n-style, MCP clients)
 10. Multi-provider routers, gateways and proxies (OpenRouter-style)
 11. Learning, translation, accessibility, productivity
 12. Open-source self-hosted AI apps (chat UIs, RAG, notebooks)

Each item must match this schema exactly:

{
  "id": "string",
  "name": "string",
  "category": "web-llm" | "coding-agent" | "design-media" | "uniform-proxy" | "custom",
  "proposedCategory": "string or null",   // only if none of the categories fit well
  "url": "https://official-site",
  "downloadUrl": "string or null",        // installer / extension / GitHub releases page
  "badge": "string or null",              // max 25 chars, e.g. "Free Reasoning R1"
  "description": "string",
  "scope": "web-only" | "local-agent" | "ide-plugin" | "local-runner" | "uniform-proxy" | "cloud-builder",
  "quickSearchUrlTemplate": "string or null",  // URL that opens the tool with a prompt, using {query}, e.g. https://chatgpt.com/?q={query}. null if unsupported. Test it.
  "tags": ["string"],
  "stars": number or null,                // GitHub stars if open source
  "githubUrl": "string or null",
  "license": "string or null",            // SPDX id, e.g. "MIT", "Apache-2.0", "Proprietary"
  "freeTier": {
    "summary": "string",                   // what you actually get for free, 1-2 sentences
    "hasWebSearch": true | false,
    "creditCardRequired": true | false,
    "allowCustomApiKey": true | false,     // can the user plug in their own key (BYOK)?
    "limits": "string",                    // concrete numbers: messages/day, credits, tokens, resolution
    "freeCreditValue": "string or null",   // e.g. "$300 / 90 days", "Free permanent tier"
    "resetCycle": "string or null"         // e.g. "Daily", "Resets every 5 hours", "Monthly"
  },
  "requiresSignup": true | false,
  "platforms": ["web" | "windows" | "macos" | "linux" | "android" | "ios" | "vscode" | "jetbrains" | "cli"],
  "openSource": true | false,
  "privacyNote": "string or null",         // e.g. "Trains on your data by default", "Runs 100% locally"
  "sourceUrl": "https://page where you verified the free tier (pricing page)",
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Scope guide: web-only = runs in a browser/cloud and cannot touch local files; local-agent = desktop/CLI agent that edits local files; ide-plugin = editor extension; local-runner = self-hosted model runner; uniform-proxy = multi-provider router/gateway; cloud-builder = cloud app workspace (AI Studio, Bolt, Lovable).

Return exactly {N} items, best and most generous free tiers first. Output only the JSON array.
```

---

## B. Bookmarks (Bookmarks page: instant online utilities, AI and non-AI)

Fills the `ToolBookmark` type. Existing categories: `developer`, `design`, `converters`, `ai-utilities`, `productivity`, `utilities`, `security`, `education`, `media`. Bookmarks are things you open in a browser and use right away, so an item without any real free use does not belong here.

```
[PASTE SHARED PREAMBLE]

TASK: Find {N=30} FREE online tools that work instantly in the browser, in the area: {AREA}.
Pick AREA from this list, one per run:
  1. Developer: formatters, validators, playgrounds, API testers, regex, diff, JSON/YAML/SQL tools, cron, JWT, base64, hashing
  2. Design: icons, SVG, colors, gradients, fonts, mockups, favicons, image editors, CSS generators
  3. Converters: file, image, audio, video, document, units, currency, timezone, encoding
  4. AI utilities that work with no or minimal signup: text, image, code, summarizers, detectors, prompt tools
  5. Productivity: notes, whiteboards, diagrams, forms, PDF tools, spreadsheets, timers, kanban, resume builders
  6. Utilities: calculators, QR codes, file sharing, screenshots, clipboard, password generators, trackers
  7. Security and privacy: scanners, breach checks, metadata removers, encrypted paste/share, OSINT
  8. Education: interactive courses, roadmaps, visualizers, cheat sheets, practice sites, docs
  9. Media: audio/video editors, recorders, streaming helpers, image optimizers, subtitle tools
 10. Open-source web apps that run fully client-side (WASM / local-first)

Prefer, in this order: no sign-up, runs locally in the browser (private), open source. Reject sites that need an account just to try them, sites with a paywall after 1 use, and sites that are mostly ads.

Each item must match this schema exactly:

{
  "id": "bm-kebab-name",
  "title": "string",
  "url": "https://official-url",
  "description": "string",
  "category": "developer" | "design" | "converters" | "ai-utilities" | "productivity" | "utilities" | "security" | "education" | "media" | "custom",
  "proposedCategory": "string or null",
  "isAi": true | false,                  // true only if AI is the core of the tool
  "freeTierBadge": "string",              // pattern: "No Sign-Up • MIT", "100% Free", "Free Web Tool", "Free Tier • Sign-Up"
  "tags": ["string"],
  "createdAt": "YYYY-MM-DD",              // same as verifiedOn
  "githubUrl": "string or null",
  "stars": number or null,
  "license": "string or null",
  "requiresSignup": true | false,
  "worksOffline": true | false | null,    // client-side only / PWA
  "privacy": "local-only" | "uploads-to-server" | "unknown",
  "notes": "string or null",              // one useful caveat, e.g. "File size limit 25 MB"
  "sourceUrl": "string",
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Return exactly {N} items. Output only the JSON array.
```

---

## C. Free API providers and rate limits (Rate-Limit Matrix and Key Vault)

Fills `RateLimitItem` (from `RateLimitMatrixModal.tsx`) plus the vault's `StoredApiKey` info. Existing entries include Google AI Studio, Groq and OpenRouter.

```
[PASTE SHARED PREAMBLE]

TASK: List every provider that gives a FREE API key for LLM / embedding / image / speech models (cloud APIs, routers, and free inference platforms). Examples to check, and find more: Google AI Studio, Groq, OpenRouter (:free models), Cerebras, SambaNova, Mistral La Plateforme (Experiment plan), Cohere trial key, Together AI, Hugging Face Inference, NVIDIA NIM / build.nvidia.com, GitHub Models, Cloudflare Workers AI, Fireworks, DeepInfra, Hyperbolic, Novita, Chutes, Kluster, Glhf, Scaleway, OVH AI Endpoints, Vercel AI Gateway, Pollinations, Zhipu/GLM, Moonshot/Kimi, Alibaba Qwen/DashScope, Baidu ERNIE, Reka, AI21, xAI credits, Cloudflare AI Gateway.
Include only providers where an individual can sign up and get free usage today.

Schema:

{
  "id": "string",
  "provider": "string",
  "providerKey": "gemini" | "openrouter" | "groq" | "deepseek" | "openai" | "anthropic" | "mistral" | "other",
  "bestModel": "string",                   // best free model at the moment
  "otherFreeModels": ["string"],
  "rpm": number or null,                  // requests per minute on the free plan
  "rpd": number or null,                  // requests per day
  "tpm": "string or null",                // tokens per minute, as text e.g. "30,000 TPM"
  "tpd": "string or null",
  "monthlyCap": "string or null",         // e.g. "1B tokens/month" or "$5 credit"
  "contextWindow": "string or null",      // e.g. "128,000 tokens"
  "creditCardRequired": true | false,
  "phoneVerificationRequired": true | false,
  "renewalCycle": "string",               // e.g. "Daily (Resets midnight UTC)", "One-time credit"
  "role": "string",                       // best use, e.g. "Fast chat / autocomplete"
  "speed": "Ultra Fast (<200ms)" | "Fast (1-2s)" | "Standard (2-4s)" | "Local Hardware",
  "category": "cloud-api" | "router" | "local",
  "openAiCompatible": true | false,
  "baseUrl": "string or null",            // e.g. https://api.groq.com/openai/v1
  "listModelsEndpoint": "string or null", // used to verify a key, e.g. GET {baseUrl}/models
  "authHeader": "string or null",         // e.g. "Authorization: Bearer <key>"
  "envVarName": "string or null",         // e.g. "GROQ_API_KEY"
  "getKeyUrl": "https://page where the key is created",
  "docsUrl": "string",
  "trainsOnYourData": true | false | null,
  "regionRestrictions": "string or null", // e.g. "Not available in EU/UK for free tier"
  "freeTierNotes": "string",              // 1-2 sentences, the catch (if any)
  "sourceUrl": "https://pricing / rate-limit page",
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Rate limits MUST come from the provider's own rate-limit page, not blog posts. Output only the JSON array, sorted by how generous the free tier is.
```

---

## D. Free models catalog (new: a "Models" list)

A new item type. Answers "which free model should I use for X?" and powers Rate-Limit rotation.

```
[PASTE SHARED PREAMBLE]

TASK: List the best {N=40} models that can be used for FREE through an API or a free web UI right now (open-weight and proprietary), across: general chat, reasoning, coding, vision, embeddings, image generation, speech.
For each, list EVERY place it is free (provider + exact model id string) so the user can rotate between providers.

Schema:

{
  "id": "string",
  "name": "string",                       // e.g. "DeepSeek R1 0528"
  "family": "string",                     // e.g. "DeepSeek"
  "vendor": "string",
  "type": "chat" | "reasoning" | "coding" | "vision" | "embedding" | "image" | "speech" | "multimodal",
  "parameters": "string or null",         // e.g. "671B MoE (37B active)"
  "contextWindow": "string or null",
  "openWeights": true | false,
  "license": "string or null",
  "releaseDate": "YYYY-MM or null",
  "strengths": ["string"],
  "freeAccess": [
    {
      "provider": "string",
      "modelId": "string",                // the exact id to put in an API call or IDE config
      "via": "api" | "web-ui" | "local",
      "limits": "string or null",
      "sourceUrl": "string"
    }
  ],
  "ollamaTag": "string or null",          // e.g. "deepseek-r1:14b"
  "huggingFaceUrl": "string or null",
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Output only the JSON array.
```

---

## E. Local runners, routers and daemons (Runtimes page)

Fills `LocalServiceInfo`. Existing: OmniRoute, Ollama, LM Studio, Jan. The app probes the TCP port, so the default port must be right.

```
[PASTE SHARED PREAMBLE]

TASK: List local AI daemons / servers / runners a user can install on Windows, macOS or Linux that expose an HTTP API on localhost: LLM runners (llama.cpp server, KoboldCpp, LocalAI, vLLM, text-generation-webui, GPT4All, Llamafile, Msty, AnythingLLM, Open WebUI, LiteLLM proxy, Lemonade, Docker Model Runner, mistral.rs, SGLang, Xinference, TabbyAPI, ...), image/audio runners (ComfyUI, Automatic1111, Fooocus, InvokeAI, Whisper servers, Piper/Kokoro TTS servers), and routers/gateways (OmniRoute, LiteLLM, One API, New API, Portkey OSS). Include coding-agent bridges if they run a local server.

Schema:

{
  "id": "string",
  "name": "string",
  "category": "router" | "runner" | "ide",
  "kind": "llm" | "image" | "speech" | "embedding" | "gateway" | "ui",
  "port": number,                          // default TCP port
  "defaultUrl": "http://localhost:PORT",
  "healthEndpoint": "string",              // a GET path that returns 200 when up, e.g. "/api/tags" or "/v1/models"
  "openAiCompatible": true | false,
  "description": "string",
  "commandToStart": "string",             // exact command or GUI steps
  "installCommand": "string or null",     // exact, per OS if they differ: {"windows": "...", "macos": "...", "linux": "..."} as a string
  "docsUrl": "string",
  "downloadUrl": "string or null",
  "githubUrl": "string or null",
  "stars": number or null,
  "license": "string or null",
  "gpuSupport": ["nvidia" | "amd" | "apple-silicon" | "intel" | "cpu-only"],
  "modelFormats": ["gguf" | "safetensors" | "onnx" | "mlx" | "other"],
  "sourceUrl": "string",
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Verify the default port and health endpoint in the official docs. If two tools share a default port, say so in "description". Output only the JSON array.
```

---

## F. IDE / agent config recipes (Config Exporter)

Fills the data behind the Config Exporter: for each (tool, provider) pair, the exact settings to paste.

```
[PASTE SHARED PREAMBLE]

TASK: For each coding tool in this list: Cline, Roo Code, Kilo Code, Continue.dev, Cursor, Windsurf, Aider, OpenCode, Zed, Void, Claude Code (via gateway), Codex CLI, Gemini CLI, Goose, OpenHands, Copilot BYOK, JetBrains AI / Junie, Python SDK, TypeScript SDK, curl,
and each provider in this list: Google AI Studio (Gemini), Groq, OpenRouter, Cerebras, Mistral, DeepSeek, GitHub Models, NVIDIA NIM, Cloudflare Workers AI, Ollama, LM Studio, OmniRoute,
produce the exact working configuration. Skip pairs that are not supported and list them in a second array called "unsupported".

Schema per recipe:

{
  "tool": "string",
  "provider": "string",
  "configFormat": "json" | "yaml" | "toml" | "env" | "shell" | "ui-steps" | "python" | "typescript",
  "configPath": "string or null",         // where the file lives per OS, e.g. "~/.continue/config.yaml"
  "snippet": "string",                    // paste-ready, with <YOUR_KEY> as the placeholder
  "baseUrl": "string",
  "modelIds": ["string"],                 // exact id strings that work for this pair today
  "envVars": ["string"],
  "notes": "string or null",
  "docsUrl": "string",
  "sourceUrl": "string",
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Return JSON: {"recipes": [...], "unsupported": [{"tool": "...", "provider": "...", "reason": "..."}]}. Snippets must come from the tool's official docs. Do not guess config keys.
```

---

## G. Local model sizing (VRAM calculator, backlog Task 3)

```
[PASTE SHARED PREAMBLE]

TASK: For the {N=40} most popular open-weight models people run locally with Ollama or LM Studio (include small 1-4B, 7-14B, 27-32B and 70B+ sizes, plus MoE models), give real size numbers.

Schema:

{
  "id": "string",
  "name": "string",
  "family": "string",
  "parametersB": number,                   // total parameters in billions
  "activeParametersB": number or null,     // for MoE
  "architecture": "dense" | "moe",
  "contextWindowTokens": number or null,
  "type": "chat" | "reasoning" | "coding" | "vision" | "embedding",
  "quantizations": [
    { "quant": "Q4_K_M", "fileSizeGB": number, "minVramGB": number, "recommendedRamGB": number }
    // include Q4_K_M always; Q8_0 and FP16 when published
  ],
  "ollamaTag": "string or null",
  "lmStudioId": "string or null",
  "license": "string or null",
  "bestFor": "string",
  "sourceUrl": "string",                   // Ollama library page or HF model card where the size is shown
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

File sizes must be read from the Ollama library or Hugging Face file listing, not estimated. If you had to estimate, set confidence to "low". Output only the JSON array.
```

---

## H. Refresh / verify existing entries

Use this to keep the catalog accurate. Paste 15-20 existing entries (copy them from `src/data/defaultTools.ts`) at a time.

```
[PASTE SHARED PREAMBLE]

Below are existing catalog entries. For each one, open the official site and check today's reality. Return a JSON array with one object per entry:

{
  "id": "same id",
  "status": "unchanged" | "changed" | "dead" | "no-longer-free" | "renamed",
  "changes": [ { "field": "freeTier.limits", "old": "...", "new": "...", "sourceUrl": "..." } ],
  "newUrl": "string or null",
  "verifiedOn": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Only list fields that actually differ. Do not rewrite wording for style. If you cannot open the site, use status "unchanged" with confidence "low" and say nothing else.

ENTRIES:
[PASTE ENTRIES HERE]
```

---

## Follow-ups (copy as needed)

**FIX (model returned prose or broken JSON):**
```
Your reply was not valid. Resend ONLY a single ```json code block containing the complete array. Double quotes, no trailing commas, no comments inside the JSON, no text outside the block. Keep every item you already gave me.
```

**MORE (next chunk, no repeats):**
```
Continue with the same task, same schema, same rules. Give {N} NEW items that are not in your previous reply and not in the EXISTING list. Output only the JSON array.
```

**CHECK (models like to sneak in dead links):**
```
Re-open every url, downloadUrl, getKeyUrl and sourceUrl in your array. Remove items whose site is dead, parked, or no longer has a free tier. Return the cleaned array and, after it in a second code block, a list of removed ids with the reason.
```

---

## What to give Claude Code

Save each reply as its own file in this folder, for example `tools-web-llm-01.json`, `bookmarks-developer-01.json`, `providers-01.json`, then tell Claude Code the file name. The merge step will:

1. Validate against `src/types.ts` (enums, required fields, URL format).
2. De-duplicate by domain and id against the current catalog.
3. Drop the extra research fields (`sourceUrl`, `verifiedOn`, `confidence`, `proposedCategory`, ...) from the shipped data, or promote them into the types if you want them in the UI (for example a "verified on" stamp or a "no phone verification" filter).
4. Report what was added, skipped and rejected.

Types C to G (providers, models, local model sizing, config recipes) have no home in the app yet. Claude Code will add the types, data files and UI when you hand over the data.
