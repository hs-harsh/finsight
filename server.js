import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const MODEL = 'claude-sonnet-4-20250514';

// /health — quick check
app.get('/health', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  res.json({
    status: 'ok',
    apiKeySet: !!key,
    apiKeyPrefix: key ? key.slice(0, 20) + '...' : 'NOT SET',
    model: MODEL,
    node: process.version,
    uptime: Math.round(process.uptime()),
  });
});

// /api/debug — sends a real 1-token request, returns raw Anthropic response
app.get('/api/debug', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' });

  const body = {
    model: MODEL,
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Reply with OK' }],
  };

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    res.status(r.status).json({ httpStatus: r.status, sentModel: MODEL, anthropicResponse: data });
  } catch (err) {
    res.status(502).json({ fetchError: err.message });
  }
});

// /api/chat — main proxy
app.post('/api/chat', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error('[FinSight] ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const body = { ...req.body, model: MODEL };
  console.log(`[FinSight] /api/chat model=${MODEL} max_tokens=${body.max_tokens} bytes=${JSON.stringify(body.messages).length}`);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error(`[FinSight] Anthropic error ${r.status}:`, JSON.stringify(data));
      return res.status(r.status).json(data);
    }

    console.log(`[FinSight] OK in=${data.usage?.input_tokens} out=${data.usage?.output_tokens}`);
    res.json(data);
  } catch (err) {
    console.error('[FinSight] fetch error:', err.message);
    res.status(502).json({ error: 'Upstream fetch error: ' + err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log(`[FinSight] :${PORT} model=${MODEL} key=${key ? 'SET(' + key.slice(0,16) + '...)' : 'NOT SET ⚠️'}`);
});
