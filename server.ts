import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return geminiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Ping or detect a local service (e.g. OmniRoute, Ollama, LM Studio)
app.get('/api/detect-local', async (req, res) => {
  const host = (req.query.host as string) || '127.0.0.1';
  const port = parseInt(req.query.port as string, 10);
  const endpoint = (req.query.path as string) || '/';

  if (!port || isNaN(port)) {
    return res.status(400).json({ error: 'Valid port is required' });
  }

  // Safety filter for port range
  if (port < 80 || port > 65535) {
    return res.status(400).json({ error: 'Port out of allowed range' });
  }

  const targetUrl = `http://${host}:${port}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json, text/plain, */*' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latency = Date.now() - startTime;
    let data = null;
    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text.slice(0, 200);
      }
    } catch {
      // Ignored
    }

    return res.json({
      online: response.ok || response.status === 404 || response.status === 401,
      status: response.status,
      latency,
      url: targetUrl,
      data,
    });
  } catch (err: any) {
    return res.json({
      online: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Service offline or unreachable',
      latency: Date.now() - startTime,
      url: targetUrl,
    });
  }
});

// AI Advisor: Guides user to the ideal free AI tool or workflow
app.post('/api/ai/advisor', async (req, res) => {
  const { query, userContext } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.status(503).json({
      error: 'Gemini API is not configured on the server. Please set GEMINI_API_KEY in settings.',
      fallbackAdvice: 'For web search with sources: use Perplexity AI (free basic search). For code refactoring on local files: use Cursor (free plan) or VSCode Copilot (free plan) or Aider with Ollama. For building full web apps: use Google AI Studio or Bolt.new.'
    });
  }

  try {
    const systemPrompt = `You are the AI Nexus Command Center Advisor.
Your mission is to guide users to the best FREE or high-quota AI tools, agents, and workflows based on their specific need.
Key Guidelines:
1. Emphasize the vital distinction:
   - Web LLMs (ChatGPT, Claude, Perplexity, DeepSeek Web) only generate text/code in the browser/cloud preview; they CANNOT directly read or edit files on the user's local disk.
   - Desktop & Local Agents (Cursor, VSCode Copilot free, Aider, OpenCode, Kilo Code) have filesystem access and CAN modify local project files directly.
   - Local Model Runners (Ollama, LM Studio, Jan) run 100% free and offline on local GPU/CPU.
   - Uniform proxies (OmniRoute, OpenRouter) aggregate free tier models and endpoints.
   - Google AI Studio provides 15 RPM / 1M TPM free credits for Gemini 2.5 Flash without a credit card.
2. Be concise, direct, and actionable. Provide 2-3 specific tool recommendations with their free-tier limits, how to start, and whether they modify local files.
Keep the response under 200 words with clean markdown bullet points.`;

    const result = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nUser Question: ${query}\nAdditional context: ${userContext || 'None'}` }
          ]
        }
      ],
    });

    const responseText = result.text || 'Unable to generate recommendation at this time.';
    res.json({ advice: responseText });
  } catch (error: any) {
    console.error('Gemini advisor error:', error);
    // Provide intelligent contextual fallback if model has a temporary spike
    const q = query.toLowerCase();
    let fallback = '';
    if (q.includes('local') || q.includes('code') || q.includes('file') || q.includes('git') || q.includes('refactor') || q.includes('edit')) {
      fallback = `### Recommendations for Local Code Editing:
- **Cursor IDE**: Offers a free plan with 2,000 completions/month + 50 free slow agent requests. Fully modifies local files with multi-file Composer.
- **VSCode + GitHub Copilot**: Free plan grants 2,000 code completions/month and 50 chat interactions/month directly in your editor.
- **Aider AI CLI**: 100% free tool (\`pip install aider-chat\`). Connects to a free Google Gemini API key or local Ollama to directly edit local files and create Git commits.
*Note: Web-only LLMs (ChatGPT, Claude, Perplexity) cannot touch your local project files.*`;
    } else if (q.includes('search') || q.includes('news') || q.includes('web') || q.includes('research')) {
      fallback = `### Recommendations for AI Web Search:
- **Perplexity AI**: Offers unlimited free basic searches with real-time web citations, plus 5 Pro Searches per 4 hours.
- **DeepSeek Web**: Free web search toggle with DeepSeek-R1 and DeepSeek-V3 models.
- **Grok (xAI)**: Real-time public discussion and news search with free periodic quotas.`;
    } else if (q.includes('omniroute') || q.includes('router') || q.includes('proxy')) {
      fallback = `### Recommendations for OmniRoute & Uniform Gateways:
- **OmniRoute**: Run \`omniroute start --port 8000\`. It unifies your free Gemini API keys, Groq free keys, and local Ollama under one OpenAI-compatible endpoint.
- **OpenRouter**: Use the free model pool (search models ending with \`:free\` such as \`deepseek/deepseek-r1:free\`).`;
    } else if (q.includes('design') || q.includes('logo') || q.includes('ui') || q.includes('stitch') || q.includes('canva')) {
      fallback = `### Recommendations for Free AI Design & UI:
- **Google Stitch**: Experimental Google Labs tool for AI UI/UX wireframes and prototype themes.
- **Canva Magic Studio**: 50 free AI image generation credits and extensive free vector design tools.
- **v0 by Vercel**: 200 free credits/month to generate React + Tailwind CSS UI components.`;
    } else {
      fallback = `### Recommended Free AI Platforms:
- **Google AI Studio**: Free 15 RPM / 1M TPM on Gemini 2.5 Flash without a credit card to prototype apps and generate API keys.
- **Perplexity AI**: Unlimited free web searches with direct sources.
- **Cursor IDE**: Best free tier code editor for directly modifying local files.
- **Ollama**: 100% free, offline, private local model runner on your own machine.`;
    }

    res.json({
      advice: fallback,
      note: 'Note: Grounded recommendation from AI Nexus knowledge base.',
    });
  }
});

// Key tester for Gemini API key
app.post('/api/verify-gemini-key', async (req, res) => {
  const { key } = req.body;
  if (!key || typeof key !== 'string' || key.trim().length < 10) {
    return res.status(400).json({ valid: false, message: 'Invalid API key format' });
  }

  try {
    const testAi = new GoogleGenAI({ apiKey: key.trim() });
    const testResult = await testAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping test. Reply with word OK.',
    });

    if (testResult.text) {
      return res.json({
        valid: true,
        message: 'Key verified! Connected successfully to Gemini 3.8 Flash free tier.',
      });
    } else {
      return res.json({ valid: false, message: 'Key did not return expected response' });
    }
  } catch (err: any) {
    return res.json({
      valid: false,
      message: err.message || 'Verification failed. Please check key validity and permissions.',
    });
  }
});

// Vite middleware for development & static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
