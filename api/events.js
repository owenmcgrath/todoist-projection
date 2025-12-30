var jwt = require('jsonwebtoken');

function verifyToken(token) {
  if (!token) {
    return { valid: false };
  }

  var sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    return { valid: false };
  }

  try {
    var decoded = jwt.verify(token, sessionSecret);
    return { valid: true, userId: decoded.sub };
  } catch (e) {
    return { valid: false };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var token = req.query.token;
  var result = verifyToken(token);

  if (!result.valid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write('event: connected\ndata: ' + JSON.stringify({ timestamp: Date.now() }) + '\n\n');

  var heartbeatCount = 0;
  var maxHeartbeats = 30;

  var heartbeatInterval = setInterval(function() {
    heartbeatCount++;
    res.write('event: heartbeat\ndata: ' + JSON.stringify({ timestamp: Date.now() }) + '\n\n');

    if (heartbeatCount >= maxHeartbeats) {
      clearInterval(heartbeatInterval);
      res.end();
    }
  }, 1000);

  req.on('close', function() {
    clearInterval(heartbeatInterval);
  });
};
