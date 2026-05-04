# NexoraScan — AI Security Misconfiguration Scanner

A cybersecurity portfolio project: paste `.env`, `nginx.conf`, or `docker-compose.yml` files and get a real AI-powered security analysis with a Zero Trust Score.

**Stack:** Vanilla HTML/CSS/JS frontend · Node.js + Express backend · Claude AI (Anthropic)

---

## Project Structure

```
nexorascan/
├── frontend/
│   └── index.html       ← Single-file app (GitHub Pages)
├── backend/
│   ├── server.js        ← Express API (Render/Railway)
│   ├── package.json
│   └── .env.example     ← Copy to .env, add your key
├── .gitignore
└── README.md
```

---

## Deployment Guide (Step by Step)

### Step 1 — Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Go to **API Keys** → Create a new key
4. Copy it — you'll need it in Step 3

---

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: NexoraScan"
```

Create a repo on GitHub named `nexorascan`, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/nexorascan.git
git branch -M main
git push -u origin main
```

---

### Step 3 — Deploy Backend on Render (free)

1. Go to [render.com](https://render.com) → Sign in with GitHub
2. Click **New +** → **Web Service**
3. Select your `nexorascan` repository
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Go to **Environment** tab → Add variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-your-key-here`
6. Click **Deploy**
7. Wait ~2 minutes → Copy your URL, e.g. `https://nexorascan-api.onrender.com`

---

### Step 4 — Connect Frontend to Backend

Open `frontend/index.html`, find line ~240:

```js
const API_URL = "https://YOUR-BACKEND-URL.onrender.com/analyze";
```

Replace with your actual Render URL:

```js
const API_URL = "https://nexorascan-api.onrender.com/analyze";
```

Commit and push:

```bash
git add frontend/index.html
git commit -m "Connect frontend to live backend"
git push
```

---

### Step 5 — Deploy Frontend on GitHub Pages

1. On your GitHub repo → **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Branch: `main`, Folder: `/frontend`
4. Click **Save**
5. Wait ~1 minute → your site is live at:
   `https://YOUR_USERNAME.github.io/nexorascan/`

---

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm install
node server.js
# → API running at http://localhost:3000
```

For local frontend testing, open `frontend/index.html` in a browser.
Change `API_URL` to `http://localhost:3000/analyze` temporarily.

---

## Sample Inputs (built into the app)

Three samples are pre-loaded in the UI:
- **.env (Vulnerable)** — hardcoded DB password, Stripe key, AWS credentials, DEBUG=true
- **docker-compose.yml** — privileged container, 0.0.0.0 bindings, exposed Docker socket
- **nginx.conf** — missing HTTPS, no security headers, exposed .env path

---

## Notes

- Render free instances **sleep after 15 minutes** of inactivity. First request may take ~30s to wake up. Consider a free uptime monitor like [UptimeRobot](https://uptimerobot.com) pinging `/health`.
- Your API key is **only stored on Render** as an environment variable — never in the frontend code.
- The `.gitignore` ensures `.env` is never committed.
