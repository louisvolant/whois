# 🌐 WHOIS Lookup Tool

A full-stack application for performing IP and Domain WHOIS lookups. The frontend is built with **Next.js/React**, and the backend can be run either as a traditional **Express.js** REST API or as a serverless **Cloudflare Worker** serving both static assets and API routes.

---

## 🚀 Key Features

* **Client IP Detection:** Automatically identifies the user's current IP address (using Cloudflare's `cf-connecting-ip` header in production or standard headers locally).
* **WHOIS Lookup:** Retrieves comprehensive registration, contact, and network details for both IPs and domain names.
* **TCP Port 43 Support on Cloudflare:** Outbound TCP WHOIS connections work seamlessly on Cloudflare Workers via `cloudflare:sockets` and Node.js network emulation (`nodejs_compat`).
* **Edge Caching:** Caches WHOIS query responses at Cloudflare's edge to minimize latency and avoid registry rate limits.
* **Unified Cloudflare Deployment:** Single-project setup hosting static Next.js assets alongside the API worker on the same origin (no CORS overhead in production).
* **Dashboard Variable Preservation:** Preconfigured with `keep_vars = true` in `wrangler.toml` to protect dashboard-configured environment variables and secrets.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (React 19, Tailwind CSS) | Responsive user interface with client-side lookup workflows. |
| **Edge Backend** | Cloudflare Workers & Hono | High-performance serverless edge API routing and execution. |
| **Traditional Backend** | Express.js | Optional standalone Node.js daemon for local development. |
| **WHOIS & Networking** | `whoiser`, `cloudflare:sockets` | WHOIS resolution over TCP port 43 across global registries. |

---

## ⚙️ Installation and Setup

### 1. Prerequisites

* Node.js (v24+, LTS recommended)
* npm or yarn

---

### 2. Cloudflare Unified Setup (Recommended)

Run and deploy the frontend and backend together using Cloudflare Workers and Static Assets:

1. **Install dependencies:**
   ```bash
   # Install backend dependencies
   cd backend && npm install && cd ..

   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

2. **Build static frontend assets:**
   ```bash
   npm run build
   ```

3. **Run local development server (Wrangler):**
   ```bash
   npm run dev:worker
   ```
   The entire application will be accessible at `http://localhost:8787` (both static UI and `/api/*` endpoints).

4. **Deploy to Cloudflare:**
   ```bash
   # Log in to Cloudflare (first time only)
   npx wrangler login

   # Deploy
   npm run deploy
   ```
   > **Note on `keep_vars = true`:** `wrangler.toml` has `keep_vars = true` enabled. This guarantees that variables and secrets set in the Cloudflare Dashboard are never overwritten or deleted by CLI deployments.

---

### 3. Standalone Development (Express + Next.js)

If you prefer running the traditional dual-server setup:

1. **Start Backend (Express):**
   ```bash
   cd backend
   npm install
   # Ensure .env is configured (PORT, SESSION_SECRET, etc.)
   npm run dev
   ```
   The Express API runs at `http://localhost:3001`.

2. **Start Frontend (Next.js):**
   ```bash
   cd frontend
   npm install
   # Set NEXT_PUBLIC_API_URL=http://localhost:3001 in .env.local
   npm run dev
   ```
   The frontend runs at `http://localhost:3000`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.