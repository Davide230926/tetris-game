const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password, email } = req.body || {};
  if (!username || !password || !email) return res.status(400).json({ error: 'Username, email, and password are required.' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) return res.status(400).json({ error: 'Username must be 2-20 alphanumeric characters.' });

  // Check username is unique via admin user search
  const listRes = await fetch(`${SUPA_URL}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
  });
  const listData = await listRes.json();
  const taken = (listData.users || []).find(u => u.user_metadata?.username?.toLowerCase() === username.toLowerCase());
  if (taken) return res.status(409).json({ error: 'That username is already taken.' });

  // Create user via Supabase Auth admin API
  const createRes = await fetch(`${SUPA_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { username, best: 0 }
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    if (createData.msg?.includes('already') || createData.code === 'email_exists') {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    return res.status(400).json({ error: createData.msg || createData.message || 'Signup failed.' });
  }

  // Sign in to get token
  const signInRes = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password })
  });
  const signInData = await signInRes.json();
  if (!signInRes.ok) return res.status(500).json({ error: 'Account created but login failed.' });

  return res.status(200).json({ token: signInData.access_token, username });
};
