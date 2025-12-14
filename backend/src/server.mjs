// backend/src/server.mjs
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from "csrf-csrf"; // Use the named import directly
import apicache from 'apicache';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Standard Middlewares
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET)); // Use same secret as session

const cache = apicache.middleware('1 minute', (req, res) => req.method === 'GET');

const allowedOrigins = [
  process.env.CORS_DEV_FRONTEND_URL_AND_PORT,
  'https://to_be_filed.net',
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

if (!process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET is not defined in .env");
  process.exit(1);
}

const CSRF_SECRET = process.env.SESSION_SECRET;

app.use(session({
  secret: CSRF_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax', // Critical for CSRF cookies
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- CSRF-CSRF CONFIGURATION ---
const csrfOptions = {
  getSecret: () => process.env.SESSION_SECRET,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
  getSessionIdentifier: (req) => req.sessionID,
};

const csrfProtection = doubleCsrf(csrfOptions);

// 1. Update the extraction names for v4.x
const {
  generateCsrfToken,
  doubleCsrfProtection,
  invalidCsrfTokenError,
} = csrfProtection;

// 2. GET Token Endpoint
app.get("/api/csrf-token", (req, res) => {
  // Use the new function name
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// 2. Apply Protection to all other /api routes
// This will ignore GET requests but validate POST/PUT/DELETE
app.use("/api", doubleCsrfProtection, apiRoutes);

// Updated Error Handler
app.use((err, req, res, next) => {
  if (err === invalidCsrfTokenError) {
    res.status(403).json({ error: "csrf validation failed" });
  } else {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Listening on http://localhost:${PORT}`);
});