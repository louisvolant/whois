# 🌐 WHOIS Lookup Tool

A modern full-stack Next.js application for performing IP and Domain WHOIS lookups, built "by the book" with the Next.js App Router and serverless Cloudflare Workers support.

---

## 🚀 Key Features

* **Canonical Next.js App Router Structure:** Single, unified codebase with all UI pages and API Route Handlers under `src/app/`.
* **Mobile & PWA Optimized:** Compact, responsive top-level segmented navigation tailored for smartphone screens, with gesture and double-tap zoom prevention for a native app feel.
* **Client IP Detection & Fast Copy:** Automatically identifies the user's IP address (`src/app/api/ip/route.ts`) with one-click clipboard copying and visual feedback.
* **WHOIS Lookups over TCP (Port 43):** Live WHOIS resolution for both IP addresses (`/api/whois/[ip]`) and domain names (`/api/domain-whois`) via `whoiser`, complete with quick-test sample chips (`cloudflare.com`, `google.com`, `1.1.1.1`, etc.).
* **Cloudflare Workers Compatible:** Powered by `@opennextjs/cloudflare` with `nodejs_compat` enabling native TCP socket connections over port 43 at the edge.
* **Edge Caching:** Caches WHOIS lookup responses via `Cache-Control` headers to optimize response times and reduce queries to upstream registries.
* **Dashboard Variable Preservation:** Preconfigured with `keep_vars = true` in `wrangler.toml` to protect Cloudflare Dashboard environment variables and secrets from being overwritten.

---

## 📁 Project Structure

```
├── public/                 # Static assets (favicons, icons, manifest)
│   ├── icons/              # Generated PWA icon set (see scripts/generate-icons.mjs)
│   ├── favicon.ico         # Classic multi-size favicon (16/32/48)
│   ├── icon.svg            # Vector favicon for modern browsers
│   ├── icon-whois.png      # 512x512 "any" PWA icon (header logo + manifest)
│   └── manifest.json       # Web App Manifest
├── scripts/
│   └── generate-icons.mjs  # Procedural icon generator (no dependencies)
├── src/
│   ├── app/
│   │   ├── api/            # Next.js Route Handlers
│   │   │   ├── csrf-token/ # GET /api/csrf-token
│   │   │   ├── domain-whois/# GET /api/domain-whois?domain=...
│   │   │   ├── ip/         # GET /api/ip
│   │   │   └── whois/[ip]/ # GET /api/whois/:ip
│   │   ├── components/     # App components (PwaZoomPrevention)
│   │   ├── Footer.tsx      # Footer component
│   │   ├── globals.css     # Global styles (safe areas, touch-action)
│   │   ├── layout.tsx      # Root App Router layout (viewport, metadata)
│   │   ├── links.ts        # Footer links
│   │   └── page.tsx        # Main application page (responsive tabbed UI)
│   └── lib/
│       └── api.ts          # Frontend API client
├── open-next.config.ts     # OpenNext Cloudflare configuration
├── next.config.js          # Next.js configuration
├── package.json            # Unified dependencies and scripts
└── wrangler.toml           # Cloudflare Workers configuration (keep_vars = true)
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (React 19, App Router) | Canonical full-stack framework for UI and API Route Handlers. |
| **Styling** | Tailwind CSS 4 | Utility-first responsive CSS styling with dark mode support. |
| **Edge Deployment** | Cloudflare Workers & OpenNext | Edge compute runtime with native TCP sockets (`nodejs_compat`). |
| **WHOIS Resolution** | `whoiser` | Query engine executing TCP connections to port 43 across global registries. |

---

## ⚙️ Development and Deployment

### 1. Prerequisites

* Node.js (v24+, LTS recommended)
* npm

---

### 2. Local Development

Run the standard Next.js development server:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be accessible at `http://localhost:3000` with hot reloading and local API route execution.

---

## 🎨 PWA Icons & Favicon

The app icon is a blue → purple gradient tile (matching the header) with a white
magnifying glass containing a stylized globe. All icons are generated
procedurally by `scripts/generate-icons.mjs` (pure Node.js, no dependencies) and
must be regenerated after any design change:

```bash
node scripts/generate-icons.mjs
```

Generated output:

| File | Size | Purpose |
| :--- | :--- | :--- |
| `public/favicon.ico` | 16 / 32 / 48 | Classic browser favicon |
| `public/icon.svg` | vector | Modern-browser favicon (used in `layout.tsx` metadata) |
| `public/icon-whois.png` | 512×512 | `purpose: any` — home screen / header logo / Chrome install |
| `public/icons/icon-192.png` | 192×192 | `purpose: any` Chrome install icon |
| `public/icons/maskable-192.png` | 192×192 | `purpose: maskable` — content kept in the 80% safe zone |
| `public/icons/maskable-512.png` | 512×512 | `purpose: maskable` — content kept in the 80% safe zone |
| `public/icons/apple-touch-icon.png` | 180×180 | iOS home screen (fully opaque, no transparency) |

> **iOS note:** Apple ignores the Web App Manifest icons and uses
> `apple-touch-icon.png`, which must be opaque (iOS recolors transparent pixels
> to black). The generated file uses the maskable layout (full-bleed background
> with content centered in the 80% safe zone) so it renders cleanly under iOS
> home-screen corner masking.

---

### 3. Cloudflare Deployment

Deploy the unified Next.js application to Cloudflare Workers using OpenNext:

1. **Build and bundle for Cloudflare:**
   ```bash
   npm run build:worker
   ```

2. **Preview locally with Wrangler:**
   ```bash
   npm run preview
   ```
   Or run:
   ```bash
   npx wrangler dev --port 8787
   ```

3. **Deploy to Cloudflare:**
   ```bash
   # Log in to Cloudflare (first time only)
   npx wrangler login

   # Deploy
   npm run deploy
   ```

> **Important — `keep_vars = true`:**  
> `wrangler.toml` is configured with `keep_vars = true`. This prevents Wrangler deployments from wiping out environment variables or secrets configured in the Cloudflare Dashboard.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.