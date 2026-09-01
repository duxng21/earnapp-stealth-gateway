const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie, xsrf-token'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = req.url || '/';
    const isInstall = rawUrl.startsWith('/install_device');
    const targetHost = isInstall ? 'client.earnapp.com' : 'earnapp.com';
    const targetUrl = 'https://' + targetHost + rawUrl;

    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.host;
    delete forwardHeaders['x-forwarded-for'];
    delete forwardHeaders['x-forwarded-host'];
    delete forwardHeaders['x-forwarded-proto'];
    delete forwardHeaders['x-real-ip'];
    delete forwardHeaders['x-vercel-id'];
    delete forwardHeaders['x-vercel-deployment-url'];
    delete forwardHeaders['x-vercel-forwarded-for'];

    forwardHeaders['Host'] = targetHost;
    forwardHeaders['Origin'] = 'https://' + targetHost;
    forwardHeaders['Referer'] = 'https://' + targetHost + '/dashboard/me/passive-income';

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
      redirect: 'follow',
      timeout: 30000
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers['Content-Type'] = 'application/json';
      } else if (req.body) {
        fetchOptions.body = req.body;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    res.status(response.status);
    response.headers.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'content-security-policy'].includes(lowerKey)) {
        res.setHeader(key, val);
      }
    });

    const buffer = await response.buffer();
    return res.send(buffer);
  } catch (err) {
    console.error('Gateway Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
