// backend/src/routes/domain_api.js
import express from 'express';
import winston from 'winston';
import apicache from 'apicache';
import { whoisDomain } from 'whoiser';

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

function extractDomain(input) {
  if (!input) return null;

  let cleaned = input.trim().toLowerCase();

  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    try {
      const url = new URL("http://" + cleaned);
      return url.hostname;
    } catch {
      return cleaned;
    }
  }

  try {
    const url = new URL(cleaned);
    return url.hostname;
  } catch {
    return null;
  }
}

function mergeWhois(results) {
  if (typeof results !== 'object' || results === null) return results;

  let merged = {};
  const values = Object.values(results).filter(part => typeof part === 'object' && part !== null);
  values.forEach(part => {
    Object.assign(merged, part);
  });
  return merged;
}

function getRaw(results) {
  if (typeof results !== 'object' || results === null) return '';

  if (results.__raw) return results.__raw;

  return Object.values(results)
    .map(part => part.__raw || '')
    .filter(Boolean)
    .join('\n\n---\n\n');
}

// Endpoint GET avec parsing JSON
router.get('/domain-whois', cache('2 minute'), async (req, res) => {
  const input = req.query.domain;
  const domain = extractDomain(input);

  if (!domain) {
    return res.status(400).json({ error: "Invalid domain" });
  }

  try {
    const data = await whoisDomain(domain, { follow: 3 });
    const parsed = mergeWhois(data);
    res.json({ domain, whois: parsed });
  } catch (err) {
    logger.error(`WHOIS error for ${domain}`, { error: err.message });
    res.status(500).json({ error: "WHOIS lookup failed" });
  }
});

export default router;