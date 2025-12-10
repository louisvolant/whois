// routes/ip_api.js
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


router.get('/ip', (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  res.json({ ip });
});

router.get('/whois/:ip', async (req, res) => {
  try {
    const result = await whois(req.params.ip);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Whois lookup failed' });
  }
});

export default router;