const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

async function getUser(token) {
  const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  return r.json();
}

module.exports = async function handler(req, res) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  const userData = await getUser(token);
  if (!userData) return res.status(401).json({ error: 'Invalid or expired session.' });

  const username = userData.user_metadata?.username || userData.email;
  const best = userData.user_metadata?.best || 0;

  if (req.method === 'GET') {
    return res.status(200).json({ best });
  }

  if (req.method === 'POST') {
    const { score } = req.body || {};
    if (typeof score !== 'number' || score < 0) return res.status(400).json({ error: 'Invalid score.' });
    if (score <= best) return res.status(200).json({ best });

    // Update best score in user metadata via admin API
    await fetch(`${SUPA_URL}/auth/v1/admin/users/${userData.id}`, {
      method: 'PUT',
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_metadata: { ...userData.user_metadata, best: score } })
    });
    return res.status(200).json({ best: score });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
