// backend/server.mjs
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import csrf from 'csurf';
import apicache from 'apicache';
import apiRoutes from './routes/api.js';


dotenv.config();

const app = express();
app.set('trust proxy', 1);

const cache = apicache.middleware('1 minute', (req, res) => req.method === 'GET');

const allowedOrigins = [
  process.env.CORS_DEV_FRONTEND_URL_AND_PORT,
  'https://to_be_filed.net',
].filter(Boolean);


// Apply session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- NEW CSRF SETUP ---

// 1. Define the CSRF middleware
const csrfProtection = csrf({ cookie: false });

// 2. Mount the token generation endpoint **before** the protection.
// We only want the csrfProtection to run on this route to ATTACH req.csrfToken.
// We define a dedicated token-fetching router for this.

// Create a router for just the CSRF token endpoint
const tokenRouter = express.Router();
tokenRouter.get('/csrf-token', (req, res) => {
    // This is the only place we need to generate and return the token
    try {
        const token = req.csrfToken();
        res.json({ csrfToken: token });
    } catch (error) {
        console.error('Error generating CSRF token:', error);
        res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
});

// Use the token router. For this endpoint only, we apply the middleware.
// NOTE: We must ensure this route handler gets called BEFORE the error handler below.
app.use('/api', csrfProtection, tokenRouter);


// 3. Mount the main API routes with the cache middleware
// Since apiRoutes contains ip_api.js and domain_api.js, and they need protection,
// we apply csrfProtection directly to the apiRoutes block.
app.use('/api', cache, csrfProtection, apiRoutes); // apiRoutes still needs to be protected

// Error handling for CSRF token validation failures
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.log(`CSRF validation failed for ${req.method} ${req.url}`);
    res.status(403).json({ error: 'Invalid CSRF token' });
  } else {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Listening on http://localhost:${PORT}`);
});