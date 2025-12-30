var crypto = require('crypto');

function verifyWebhookSignature(payload, signature, clientSecret) {
  if (!signature) return false;

  var hmac = crypto.createHmac('sha256', clientSecret);
  hmac.update(payload);
  var expectedSignature = hmac.digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var clientSecret = process.env.TODOIST_CLIENT_SECRET;

  if (!clientSecret) {
    console.error('Missing TODOIST_CLIENT_SECRET environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  var rawBody = JSON.stringify(req.body);
  var signature = req.headers['x-todoist-hmac-sha256'];

  if (!verifyWebhookSignature(rawBody, signature, clientSecret)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    var payload = req.body;
    
    console.log('Received webhook:', {
      event: payload.event_name,
      user: payload.user_id,
      triggered_at: payload.triggered_at,
    });

    return res.status(200).end();
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
