const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ error: 'Username/email and password are required.' });

  const lower = identifier.toLowerCase().trim();
  let email = lower;

  // If identifier is a username (no @), look up the email
  if (!lower.includes('@')) {
    const listRes = await fetch(`${SUPA_URL}/auth/v1/admin/users?page=1&per_page=1000`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
    });
    const listData = await listRes.json();
    const match = (listData.users || []).find(u => u.user_metadata?.username?.toLowerCase() === lower);
    if (!match) return res.status(401).json({ error: 'Invalid username/email or password.' });
    email = match.email;
  }

  // Sign in with email+password
  const signInRes = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const signInData = await signInRes.json();
  if (!signInRes.ok) return res.status(401).json({ error: 'Invalid username/email or password.' });

  const username = signInData.user?.user_metadata?.username || email;
  return res.status(200).json({ token: signInData.access_token, username });
};
