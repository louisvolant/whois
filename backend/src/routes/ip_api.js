// backend/src/routes/ip_api.js
import express from 'express';
import winston from 'winston';
import { whoisIp } from 'whoiser';

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});

function getRaw(results) {
  if (typeof results !== 'object' || results === null) return '';

  if (results.__raw) return results.__raw;

  return Object.values(results)
    .map(part => part.__raw || '')
    .filter(Boolean)
    .join('\n\n---\n\n');
}

router.get('/ip', (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  res.json({ ip });
});

router.get('/whois/:ip', async (req, res) => {
  const { ip } = req.params;

  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return res.json({
      raw: 'This is a localhost address. No WHOIS data exists for local interfaces.'
    });
  }

  try {
    const result = await whoisIp(ip, { raw: true });
    const raw = getRaw(result);
    res.json({ raw });
  } catch (err) {
    console.error('Whois error:', err);
    res.status(500).json({ error: 'Whois lookup failed' });
  }
});

export default router;