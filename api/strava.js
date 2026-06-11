// Strava proxy. Holds the Strava secrets server-side (Vercel env vars) so they
// never reach the browser. The page calls /api/strava?endpoint=athlete etc.

// Only these read-only endpoints are allowed through, so an open URL can't be
// used to do anything beyond what the dashboard itself needs.
const ALLOWED = [
  /^athlete$/,
  /^athlete\/activities(\?.*)?$/,
  /^activities\/\d+(\?.*)?$/,
  /^gear\/[\w-]+$/,
];

// Reuse a minted access token across warm invocations to avoid refreshing every call.
let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedExpiry - 120) return cachedToken;

  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('Strava token refresh failed');
  cachedToken = d.access_token;
  cachedExpiry = d.expires_at || now + 3600;
  return cachedToken;
}

module.exports = async (req, res) => {
  try {
    const endpoint = (req.query.endpoint || '').toString();
    if (!ALLOWED.some((re) => re.test(endpoint))) {
      res.status(400).json({ error: 'Endpoint not allowed' });
      return;
    }

    const token = await getAccessToken();
    const r = await fetch('https://www.strava.com/api/v3/' + endpoint, {
      headers: { Authorization: 'Bearer ' + token },
    });
    const body = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(r.status).send(body);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Strava proxy error' });
  }
};
