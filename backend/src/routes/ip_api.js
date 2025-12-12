// backend/src/routes/ip_api.js
import express from 'express';
import winston from 'winston';
import whois from "node-whois";

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});

// 1. Helper function to make node-whois compatible with async/await
const lookupPromise = (ip) => {
  return new Promise((resolve, reject) => {
    whois.lookup(ip, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
};

router.get('/ip', (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  res.json({ ip });
});

router.get('/whois/:ip', async (req, res) => {
  const { ip } = req.params;

  // 2. Handle Localhost explicitly to prevent errors
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return res.json({
      raw: 'This is a localhost address. No WHOIS data exists for local interfaces.'
    });
  }

  try {
    // 3. Use the promise wrapper
    const result = await lookupPromise(ip);
    res.json({ raw: result }); // Wrap in object as `result` is usually a raw string
  } catch (err) {
    console.error('Whois error:', err);
    res.status(500).json({ error: 'Whois lookup failed' });
  }
});

export default router;