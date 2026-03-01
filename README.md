# FinSight — Household Finance Analyzer

AI-powered household financial report generator. Upload bank statements and credit card bills (PDF), get instant categorized analysis, red flags, charts, and actionable suggestions — powered by Claude.

## Features

- 📄 Upload unlimited PDFs per person (any bank, any card issuer)
- 🔄 Analyzes each statement individually then compiles a household summary
- 📊 Rich analytics dashboard: 7+ charts, category heatmap, CC utilization gauges, top merchants
- 🚩 Red flag detection with severity ranking
- 💡 AI-powered suggestions
- 📥 Export to PDF or Excel

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/finsight.git
cd finsight

# 2. Install dependencies
npm install

# 3. Set your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Run
npm run dev
# Open http://localhost:3000
```

## Deploy to Railway

### First time

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select this repository
4. In the Railway dashboard → **Variables** tab, add:
   ```
   ANTHROPIC_API_KEY = sk-ant-your-key-here
   ```
5. Railway auto-detects Node.js and deploys. Your app will be live at the generated `.railway.app` URL.

### Subsequent deploys

Just `git push` — Railway auto-deploys on every push to `main`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |
| `PORT` | Auto-set by Railway | Server port (defaults to 3000 locally) |

## Project Structure

```
finsight/
├── public/
│   └── index.html      # The entire frontend (single-file app)
├── server.js           # Express server + Anthropic API proxy
├── package.json
├── railway.toml        # Railway deployment config
└── .env.example
```

## Tech Stack

- **Frontend:** Vanilla JS, Chart.js, PDF.js, SheetJS
- **Backend:** Node.js + Express (serves static files + proxies API)
- **AI:** Claude Sonnet (via Anthropic API)
- **Hosting:** Railway
