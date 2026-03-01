import express from 'express';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint — keeps ANTHROPIC_API_KEY on the server
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[FinSight] ERROR: ANTHROPIC_API_KEY environment variable is not set.');
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server.' });
  }

  // Always use a known-good model; override whatever the client sends
  const body = {
    ...req.body,
    model: 'claude-sonnet-4-5',
  };

  console.log(`[FinSight] /api/chat → model=${body.model} max_tokens=${body.max_tokens} prompt_len=${JSON.stringify(body.messages).length}`);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[FinSight] Anthropic API error ${response.status}:`, JSON.stringify(data).slice(0, 300));
      return res.status(response.status).json(data);
    }

    console.log(`[FinSight] OK — input_tokens=${data.usage?.input_tokens} output_tokens=${data.usage?.output_tokens}`);
    res.json(data);
  } catch (err) {
    console.error('[FinSight] Fetch error:', err.message);
    res.status(502).json({ error: 'Upstream API error: ' + err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeySet: !!process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-5',
    uptime: process.uptime(),
  });
});

// Fallback — serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[FinSight] Running on port ${PORT} | API key: ${process.env.ANTHROPIC_API_KEY ? 'SET ✓' : 'NOT SET ✗'}`);
});
