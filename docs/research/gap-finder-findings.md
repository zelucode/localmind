# Gap-finder findings (what else could LocalMind hold?)

Source: a one-off "gap finder" prompt (what other free resources belong in this app, which categories to add, what to ship for offline use, which free tiers changed recently), answered by four LLMs with web search (ChatGPT, Grok, Kimi, Qwen) on 2026-10-06. The prompt and the raw replies were deleted once everything useful was copied here.

**How far to trust it.** The prompt itself listed most of the section ideas, so the models mostly echoed them back. Every URL and number below comes from the models and was **not** checked by us, except where marked "verified". Sources behind the free-tier events are mostly blogs. Nothing here may be copied into the catalog as a fact before it is checked on the provider's own page. Use it as a to-do list of areas and leads.

A star (★) marks an entry named by two or more of the four models.

## 1. Section ideas (all four agreed these are worth having)

Most are **bookmark categories**, not new pages. The cheapest path is: add the category, then fill it with prompt B runs.

| Section | Entries named (examples) | Fields the models suggested |
|---|---|---|
| Free GPU / notebook compute | ★ [Google Colab](https://colab.research.google.com), ★ [Kaggle Notebooks](https://www.kaggle.com/code), ★ [Lightning AI](https://lightning.ai), ★ [Modal](https://modal.com) (about $30 credit/month), [HF ZeroGPU Spaces](https://huggingface.co/spaces), [GitHub Codespaces](https://github.com/features/codespaces), [Vertex AI trial](https://cloud.google.com/free) | GPU type, free hours/credits, reset period, session limit, card required, expiry |
| Datasets | ★ [HF Datasets](https://huggingface.co/datasets), ★ [Kaggle Datasets](https://www.kaggle.com/datasets), [UCI ML](https://archive.ics.uci.edu/), [OpenML](https://www.openml.org/), [Google Dataset Search](https://datasetsearch.research.google.com/), [data.gov](https://data.gov), [Common Crawl](https://commoncrawl.org/), [Papers with Code datasets](https://paperswithcode.com/datasets) | name, url, license, size, format, task, source |
| Prompt libraries | [Awesome ChatGPT Prompts](https://github.com/f/awesome-chatgpt-prompts), [Prompt Engineering Guide](https://www.promptingguide.ai/), [Learn Prompting](https://learnprompting.org/), [Anthropic Prompt Library](https://docs.claude.com/en/prompt-library), [OpenAI Cookbook](https://github.com/openai/openai-cookbook), [LangChain Hub](https://smith.langchain.com/hub), [TheBigPromptLibrary](https://github.com/0xeb/TheBigPromptLibrary) | name, url, license, stars, last updated |
| MCP servers and directories | ★ [Official servers](https://github.com/modelcontextprotocol/servers) (all four), ★ [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers), ★ [Playwright MCP](https://github.com/microsoft/playwright-mcp), ★ [Context7](https://github.com/upstash/context7), [MCP Registry](https://registry.modelcontextprotocol.io/), [mcpservers.org](https://mcpservers.org/), [PulseMCP](https://www.pulsemcp.com/servers), [awesome-remote-mcp-servers](https://github.com/punkpeye/awesome-remote-mcp-servers), [GitHub MCP](https://github.com/github/github-mcp-server) | transport (stdio/remote), permissions, install command, license, stars |
| Vector databases | ★ [Weaviate Cloud](https://weaviate.io), ★ [Pinecone Starter](https://www.pinecone.io), ★ [Chroma](https://www.trychroma.com) (self-host), ★ [Qdrant](https://qdrant.tech), [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/), [Upstash Vector](https://upstash.com/vector), [pgvector](https://github.com/pgvector/pgvector), [Milvus](https://milvus.io/) | free storage / objects, expiry, card required, self-host option |
| Hosting and deploy tiers | ★ [Vercel Hobby](https://vercel.com/pricing), [Cloudflare Pages/Workers](https://pages.cloudflare.com), [Netlify](https://www.netlify.com/pricing/), [Render](https://render.com/pricing) (sleeps after 15 min), [Hugging Face Spaces](https://huggingface.co/spaces), [Deno Deploy](https://deno.com/deploy), [Oracle Always Free](https://www.oracle.com/cloud/free/), [GitHub Pages](https://pages.github.com/) | limits, sleep policy, commercial use, card required |
| Student / OSS / startup credits | ★ [GitHub Student Pack](https://education.github.com/pack), [Azure for Students](https://azure.microsoft.com/free/students/), [AWS Educate](https://aws.amazon.com/education/awseducate/), [Google Cloud for Students](https://cloud.google.com/edu/students), [DigitalOcean](https://www.digitalocean.com/), [JetBrains student](https://www.jetbrains.com/community/education/), [MongoDB students](https://www.mongodb.com/students), [Google for Startups](https://cloud.google.com/startup), [AWS Activate](https://aws.amazon.com/activate/) | eligibility, credit value, duration, how to claim |
| Free AI courses | ★ [fast.ai](https://course.fast.ai), ★ [Hugging Face Learn / LLM course](https://huggingface.co/learn), [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course/), [DeepLearning.AI](https://www.deeplearning.ai/courses/), [Karpathy Zero to Hero](https://karpathy.ai/zero-to-hero.html), [Full Stack Deep Learning](https://fullstackdeeplearning.com/), [MIT 6.S191](https://introtodeeplearning.com), [Elements of AI](https://www.elementsofai.com/), [Kaggle Learn](https://www.kaggle.com/learn), [Anthropic Academy](https://anthropic.skilljar.com) | level, duration, language, certificate, prerequisites |
| Local voice / TTS models | ★ [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), ★ [Bark](https://github.com/suno-ai/bark), ★ [F5-TTS](https://github.com/SWivid/F5-TTS), [Piper](https://github.com/OHF-Voice/piper1-gpl), [Coqui XTTS-v2](https://github.com/idiap/coqui-ai-TTS), [edge-tts](https://github.com/rany2/edge-tts), [OpenVoice](https://github.com/myshell-ai/OpenVoice), [MeloTTS](https://github.com/myshell-ai/MeloTTS), [Silero](https://github.com/snakers4/silero-models), [Fish Speech](https://github.com/fishaudio/fish-speech), [Whisper](https://github.com/openai/whisper) | license, languages, hardware, runtime |
| Rules and system-prompt collections | ★ [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules), ★ [cursor.directory](https://cursor.directory), ★ [system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools), [github/awesome-copilot](https://github.com/github/awesome-copilot), [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code), [instructa/ai-prompts](https://github.com/instructa/ai-prompts) | target tool, language/stack, license, stars. Feeds the Config Exporter |
| Benchmark leaderboards | ★ [LMArena](https://lmarena.ai), ★ [Artificial Analysis](https://artificialanalysis.ai), ★ [LiveBench](https://livebench.ai), ★ [Aider leaderboard](https://aider.chat/docs/leaderboards/), [SWE-bench](https://www.swebench.com/), [Open LLM Leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard), [Stanford HELM](https://crfm.stanford.edu/helm/), [OpenRouter models](https://openrouter.ai/models), [Papers with Code SOTA](https://paperswithcode.com/sota) | what it measures, update frequency |
| Newsletters and changelogs | [The Batch](https://www.deeplearning.ai/the-batch/), [TLDR AI](https://tldr.tech/ai), [The Rundown AI](https://www.therundown.ai), [Last Week in AI](https://lastweekin.ai), [Import AI](https://jack-clark.net/), [HF Daily Papers](https://huggingface.co/papers), [OpenAI API release notes](https://platform.openai.com/docs/release-notes), [Anthropic release notes](https://docs.claude.com/en/release-notes), [GitHub changelog](https://github.blog/changelog/), [Cloudflare changelog](https://developers.cloudflare.com/changelog/) | frequency, RSS feed |
| Free auth / DB / storage | ★ [Supabase](https://supabase.com/pricing), ★ [Neon](https://neon.tech/pricing), ★ [Turso](https://turso.tech/pricing), [Clerk](https://clerk.com/pricing) (about 10k MAU free), [Cloudflare D1/R2/KV](https://developers.cloudflare.com/d1/), [Firebase](https://firebase.google.com/), [Upstash](https://upstash.com) | storage, MAU / row limits, pause policy, card required |
| Free CI | ★ [GitHub Actions](https://github.com/features/actions) (2,000 min/month private), [GitLab CI](https://about.gitlab.com/pricing/), [CircleCI](https://circleci.com/pricing/), [Woodpecker](https://woodpecker-ci.org) and [Forgejo Actions](https://forgejo.org) (self-host), [Cirrus CI](https://cirrus-ci.org) | minutes/month, concurrency, private repos |
| AI browser extensions | [Page Assist](https://github.com/n4ze3m/page-assist) (local-model sidebar, open source), [WebLLM](https://webllm.mlc.ai/), [Sider](https://sider.ai), [Monica](https://monica.im), [Harpa](https://harpa.ai/), [uBlock Origin](https://github.com/gorhill/uBlock), [Refined GitHub](https://github.com/refined-github/refined-github), [JSON Viewer](https://github.com/tulios/json-viewer) | browser, permissions, open source |
| Hugging Face Spaces worth bookmarking | [Open LLM Leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard), [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena), [Whisper](https://huggingface.co/spaces/openai/whisper), [Inference Playground](https://huggingface.co/spaces/huggingface/inference-playground), [Depth Anything V2](https://huggingface.co/spaces/depth-anything/Depth-Anything-V2), [InstantMesh](https://huggingface.co/spaces/TencentARC/InstantMesh) | task, hardware, still running |

Ideas only one model had: **free image / video generation APIs** (Stability, Leonardo, Replicate, Fal, Together; Qwen), **free serverless / edge tiers** with scale-to-zero (Cloud Run, Lambda, Azure Container Apps; Kimi), **free auth providers** (Auth0, WorkOS; Kimi).

## 2. New categories proposed

**Bookmarks** (consensus first): Compute and notebooks; Datasets; Benchmarks and leaderboards; MCP servers and directories; Prompts and agent rules; AI learning; Free backend / serverless (auth, DB, storage, vector); Local voice and speech; Student and startup credits; Developer / AI extensions.

**Tools** (one or two models each, weaker consensus):
- Free AI APIs and inference endpoints (Gemini, Groq, OpenRouter, Cloudflare Workers AI, Cerebras): already covered by the Rate-Limit Matrix, not by the Tools page.
- Local AI model managers (Ollama, LM Studio, Jan, GPT4All, AnythingLLM): already in Runtimes.
- Prompt engineering and evaluation tools (promptfoo, DSPy, DeepEval, Ragas, Inspect AI).
- LLM observability free tiers (Langfuse, Arize Phoenix, Helicone, Lunary, Braintrust).
- Free embedding and rerank endpoints (Jina, FastEmbed, Infinity, Cohere trial).
- Agent sandboxes (E2B, Modal Sandboxes, Daytona), agent frameworks (LangChain, LlamaIndex, AutoGen, CrewAI), local TTS / voice agents.

## 3. Ideas for offline and first-launch data
Models converged on: bundle a timestamped snapshot so the app is useful with no network, and show how old each item is. Concretely:
- the rate-limit matrix with a "last verified" age and a stale badge (Task 21 and the `reviewed` field already do part of this);
- the bookmark catalog (already bundled) and a small "starter pack" of the best bookmarks per kind of user;
- IDE / agent config templates and a few rule / system-prompt packs for the Config Exporter;
- a local model sizing table (GGUF size vs VRAM; backlog Task 3);
- a built-in changelog of free-tier changes, so users see what changed without a network;
- offline setup guides for Ollama, LM Studio and Jan, MCP install commands, the GitHub Student Pack partner list;
- local search over all of it.

## 4. Free-tier change leads (all unverified except where marked)
These are the claims about recent changes. Each needs a check on the provider's own page before it touches `src/data/providers.ts` or the catalog. Several matter more than the rest because the app already shows these providers.

**Affects data the app shows now (check first):**
- **GitHub Models retired 2026-07-30.** *Verified* on GitHub's own page; already removed from the app.
- **Groq** retired its free Llama 3.3 70B and 3.1 8B (2026-08-16, Kimi, source freeapihub.com); free models now gpt-oss-120b / 20b. Qwen instead says Groq's free limits are 30 requests/min, 1,000/day, 8,000 tokens/min. The app's Groq preset uses `llama-3.3-70b-versatile`, so this one is important to check.
- **Cerebras** legacy free tier ended 2026-08-17 and moved to a smaller free tier; free model list cut from about 12 to 2 (Kimi).
- **OpenRouter** free models allow up to 1,000 requests/day only if the account has bought at least 10 credits (Qwen, citing OpenRouter's FAQ).
- **Hugging Face Inference** free allowance cut to about $0.10/month (Grok, Qwen). **Hugging Face Spaces**: Docker and Gradio Spaces on free CPU moved behind PRO from 2026-07-08, free accounts limited to 2 ZeroGPU Spaces (Kimi, with a forum link).
- **Cloudflare Workers AI**: 10,000 free Neurons/day kept; several large models (Kimi K2.6 / K2.7-code, GLM-5.2) moved to the paid plan 2026-07-28 (ChatGPT, with a changelog link).
- **Gemini CLI** free tier of 1,000 requests/day (Qwen).

**Hosting and developer services (relevant if these sections are built):**
- Fly.io removed its free allowance (ChatGPT, Grok, Qwen, Kimi all say so). Railway: no real free tier, about $1/month credit (Grok, Kimi), though ChatGPT notes free accounts-less VMs in 2026-09. Render free bandwidth cut from 100 GB to 5 GB (2026-04), Koyeb needs a $29 card hold (Kimi). Oracle Always Free Arm capacity halved (2026-06-15, Grok).
- Expanded: Neon free plan 1 GB per project and 100 projects (2026-08 / 2026-10-02, ChatGPT and Grok), Upstash Blob egress and Vercel Blob / production protection free on all plans (2026-09, ChatGPT), Weaviate permanent free cloud cluster (2026-06, Grok), Colab benefits folded into Google AI plans (2026-09-22, Grok).
- Cut: AWS SageMaker Studio Lab closed to new sign-ups (2026-07-30), Colab Pro for Education closed to new sign-ups (Grok), Aiven free Postgres 5 GB to 1 GB (Grok), Vercel tightened serverless free limits (Qwen).
- Other: Lightning AI free tier about 30 credits (about 80 GPU hours, interruptible) with one Studio (ChatGPT); Sourcegraph Amp free with your own key (2026-09-13); env0 free-forever tier (2026-08-05); ChatGPT free tier unlimited text chat for everyday use (2026-08-06, Kimi, secondary source); Anthropic free tier widened (Qwen, Kimi, both secondary); SmartThings API moving to paid in 2026-10.

**Stale-entry checklist** (Kimi): anything listing free Fly.io, Heroku, Glitch or Cyclic; a Weaviate "no free tier" note; "free Gradio/Docker Spaces" on Hugging Face; Groq `llama-3.3-70b-versatile` examples; any GitHub Models entry.

## 5. Data quality notes about the raw replies
- The ChatGPT reply wrapped 209 URLs as `[url](url)`; they were cleaned for this page.
- Some dates are vague ("2026-09-2026", "2026-07 (approx)").
- Qwen cited the same blog for several unrelated claims; Grok cited one blog (dusoma.com) for five. Treat single-source items as leads.
