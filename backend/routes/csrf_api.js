// backend/routes/csrf_api.js
import express from 'express';
import winston from 'winston';

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});

const skipCsrfValidation = (req, res, next) => {
  next();
};

router.get('/csrf-token', skipCsrfValidation, (req, res) => {
  try {
    const token = req.csrfToken();
    logger.info('CSRF token generated successfully');
    res.json({ csrfToken: token });
  } catch (error) {
    logger.error('Error generating CSRF token:', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

export default router;
