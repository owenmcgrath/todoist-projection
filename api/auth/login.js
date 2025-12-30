const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const appPassword = process.env.APP_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!appPassword || !sessionSecret) {
      console.error('Missing APP_PASSWORD or SESSION_SECRET environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password !== appPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        sub: 'app_user',
        iat: Math.floor(Date.now() / 1000),
      },
      sessionSecret
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
