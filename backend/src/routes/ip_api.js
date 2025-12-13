// backend/src/routes/ip_api.js
import express from 'express';
import winston from 'winston';
import apicache from 'apicache';
import { whoisIp } from 'whoiser';

const router = express.Router();
const cache = apicache.middleware;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
}

function getRaw(results) {
  if (typeof results !== 'object' || results === null) return '';

  if (results.__raw) return results.__raw;

  return Object.values(results)
    .map(part => part.__raw || '')
    .filter(Boolean)
    .join('\n\n---\n\n');
}


router.get('/ip', cache('2 seconds',(req, res) => req.method === 'GET', { appendKey: (req) => getClientIp(req) } ), (req, res) => {
    res.json({ ip: getClientIp(req) });
  }
);

router.get('/whois/:ip', cache('1 minute'), async (req, res) => {
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