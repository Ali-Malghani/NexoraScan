/**
 * NexoraScan Backend — Security Misconfiguration Scanner
 * Uses Anthropic Claude API for deep, context-aware security analysis
 * Deploy on: Render / Railway / Vercel
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow all origins for GitHub Pages frontend
app.use(cors());
app.use(express.json({ limit: '50kb' }));

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Senior Security Architect and penetration tester with 15+ years of experience.
Your job is to analyze configuration files (.env, nginx.conf, docker-compose.yml, or similar) for real-world security vulnerabilities.

Be STRICT and REALISTIC. Do not fabricate issues, but do not miss any real ones either.

You MUST return ONLY a valid JSON object — no markdown, no explanation outside JSON:

{
  "config_type": "detected config type (e.g. .env, nginx.conf, docker-compose.yml)",
  "summary": "2-3 sentence professional security posture overview",
  "severity": "Low | Medium | High | Critical",
  "zero_trust_score": <integer 0-100>,
  "issues": [
    {
      "title": "Short issue title",
      "severity": "Low | Medium | High | Critical",
      "line_ref": "line or key reference if applicable, else null",
      "explanation": "Clear technical explanation of the risk",
      "fix": "Specific remediation with example"
    }
  ]
}

Zero Trust Score Rules (start at 100, deduct points):
- Each Critical issue: -20
- Each High issue: -12
- Each Medium issue: -6
- Each Low issue: -2
- Hardcoded secret/password/key: -25 each
- DEBUG=true or equivalent: -10
- Root/privileged containers: -15
- 0.0.0.0 bindings without firewall note: -10
- Missing HTTPS/TLS: -15
- Missing security headers: -8
Never go below 0. Round to nearest integer.

Analyze every line. Be specific about line content. If the config is safe, say so and give a high score.`;

// ─── /analyze endpoint ────────────────────────────────────────────────────────
app.post('/analyze', async (req, res) => {
  const { configText } = req.body;

  // Validate input
  if (!configText || typeof configText !== 'string') {
    return res.status(400).json({ error: 'No configuration text provided.' });
  }
  if (configText.trim().length < 5) {
    return res.status(400).json({ error: 'Configuration is too short to analyze.' });
  }
  if (configText.length > 20000) {
    return res.status(400).json({ error: 'Configuration exceeds 20,000 character limit.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: API key not set.' });
  }

  try {
    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyze this configuration file for security issues:\n\n${configText}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(502).json({ error: 'AI analysis service unavailable. Try again.' });
    }

    const aiData = await response.json();
    const rawText = aiData.content?.[0]?.text || '';

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error. Raw AI output:', rawText);
      return res.status(500).json({ error: 'AI returned malformed response. Please try again.' });
    }

    // Validate structure
    if (!parsed.issues || !Array.isArray(parsed.issues)) {
      return res.status(500).json({ error: 'Unexpected AI response structure.' });
    }

    return res.json(parsed);

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error. Check server logs.' });
  }
});

// Health check for Render/Railway uptime pings
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'NexoraScan API' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[NexoraScan] API running on port ${PORT}`));
