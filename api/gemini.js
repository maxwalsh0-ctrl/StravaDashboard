// Gemini proxy. Holds the Gemini API key server-side (Vercel env var) so it
// never reaches the browser. The page POSTs { userPrompt, systemPrompt } here.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Only allow calls coming from the dashboard's own page, to limit drive-by use.
  const host = req.headers.host || '';
  const referer = req.headers.referer || '';
  if (referer && host && !referer.includes(host)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const { userPrompt, systemPrompt } = req.body || {};
    if (!userPrompt) {
      res.status(400).json({ error: 'Missing prompt' });
      return;
    }
    const sys = systemPrompt || 'You are an expert running coach. Be concise, direct, specific. No fluff.';

    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
        process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ role: 'user', parts: [{ text: String(userPrompt).slice(0, 8000) }] }],
          generationConfig: { maxOutputTokens: 1200 },
        }),
      }
    );

    if (r.status === 429) {
      res.status(429).json({ error: 'Rate limited' });
      return;
    }
    const d = await r.json();
    if (d.error) {
      res.status(502).json({ error: d.error.message });
      return;
    }
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Gemini proxy error' });
  }
};
