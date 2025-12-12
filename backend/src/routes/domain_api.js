// backend/src/routes/domain_api.js
import express from 'express';
import winston from 'winston';
import whois from 'node-whois';

const router = express.Router();

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

// simple parser pour transformer le texte brut en JSON
function parseWhois(raw) {
  const lines = raw.split('\n');
  const result = {};

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('%') || line.startsWith('#')) continue;

    const [key, ...rest] = line.split(':');
    if (!rest.length) continue;

    const value = rest.join(':').trim();
    if (!key) continue;

    // si la clé existe déjà, on stocke en array
    const normalizedKey = key.trim().replace(/\s+/g, '_');
    if (result[normalizedKey]) {
      if (Array.isArray(result[normalizedKey])) {
        result[normalizedKey].push(value);
      } else {
        result[normalizedKey] = [result[normalizedKey], value];
      }
    } else {
      result[normalizedKey] = value;
    }
  }

  return result;
}

// Endpoint GET avec parsing JSON
router.get('/domain-whois', (req, res) => {
  const input = req.query.domain;
  const domain = extractDomain(input);

  if (!domain) {
    return res.status(400).json({ error: "Invalid domain" });
  }

  whois.lookup(domain, { follow: 3 }, (err, data) => {
    if (err) {
      logger.error(`WHOIS error for ${domain}`, { error: err.message });
      return res.status(500).json({ error: "WHOIS lookup failed" });
    }

    const parsed = parseWhois(data);
    res.json({ domain, whois: parsed });
  });
});

// Endpoint brut sans parsing
router.get('/whois/:target', (req, res) => {
  const { target } = req.params;

  whois.lookup(target, { follow: 3 }, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "WHOIS lookup failed" });
    }

    res.json({ raw: data });
  });
});

export default router;
