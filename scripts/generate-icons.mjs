// scripts/generate-icons.mjs
// Generates the Whois PWA icon set (favicon, manifest icons, apple-touch-icon).
//
// Pure Node.js (no runtime dependencies): renders the logo procedurally with
// signed distance functions and writes PNG + ICO files via zlib.
//
// Usage: node scripts/generate-icons.mjs
//
// Output:
//   public/favicon.ico              (16/32/48 PNG entries for classic favicon support)
//   public/icon.svg                 (vector favicon for modern browsers)
//   public/icon-whois.png           (512x512 "any" icon, used in header + manifest)
//   public/icons/icon-192.png       (192x192 "any" icon)
//   public/icons/maskable-192.png   (192x192 maskable, full-bleed safe layout)
//   public/icons/maskable-512.png   (512x512 maskable, full-bleed safe layout)
//   public/icons/apple-touch-icon.png (180x180 opaque, iOS home-screen layout)

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

// ---------------------------------------------------------------------------
// PNG encoding (RGBA, 8-bit, one filter byte of 0 per scanline)
// ---------------------------------------------------------------------------

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// ICO encoding (Vista+ style: PNG data embedded per image entry)
// ---------------------------------------------------------------------------

function encodeICO(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const png of pngs) {
    const entry = Buffer.alloc(16);
    const size = parseInt(png.size, 10);
    entry[0] = size >= 256 ? 0 : size; // 0 indicates 256
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.data.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

// ---------------------------------------------------------------------------
// Logo geometry (drawn in a 1000x1000 unit space)
// ---------------------------------------------------------------------------

const U = 1000;

// Brand gradient: blue-600 -> purple-600 (matches the header gradient)
const BLUE = [37, 99, 235]; // #2563EB
const PURPLE = [147, 51, 234]; // #9333EA
const CORNER_RADIUS = 224; // rounded-square corner radius ("any" layout)

// Magnifying glass layout
const LENS = { x: 410, y: 410, r: 300, inner: 264 };
const GLOBE = { x: 410, y: 410, r: 182 };
const HANDLE = { ax: 622, ay: 622, bx: 765, by: 765, radius: 66 };

function gradientAt(x, y) {
  // Sample the vertical blue -> purple gradient (clamped to brand colors)
  const t = Math.min(1, Math.max(0, y / U));
  return [
    Math.round(BLUE[0] + (PURPLE[0] - BLUE[0]) * t),
    Math.round(BLUE[1] + (PURPLE[1] - BLUE[1]) * t),
    Math.round(BLUE[2] + (PURPLE[2] - BLUE[2]) * t),
  ];
}

// Signed distance helpers
function distCircle(px, py, cx, cy, cr) {
  return Math.hypot(px - cx, py - cy) - cr;
}

function distSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const t = Math.min(1, Math.max(0, (apx * abx + apy * aby) / (abx * abx + aby * aby)));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function distRoundedRect(px, py, half, radius) {
  const qx = Math.abs(px - U / 2) - (half - radius);
  const qy = Math.abs(py - U / 2) - (half - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

// Distance to a (tilted) ellipse treated as a circle in scaled space.
// Approximate but visually fine for stroke rendering.
function distEllipse(px, py, cx, cy, rx, ry, radians) {
  const dx = px - cx, dy = py - cy;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  const xr = dx * cos + dy * sin;
  const yr = -dx * sin + dy * cos;
  const scale = rx / ry;
  return Math.hypot(xr, yr * scale) - rx;
}

// Latitude chords of the globe (horizontal lines clipped to the circle)
const LAT_HALF = Math.sqrt(GLOBE.r * GLOBE.r - 70 * 70); // ~168
const LAT_OFFSET = 70;

function globeStrokeWidth(px, py) {
  // Globe outline (24px stroke -> 12px half width)
  if (Math.abs(distCircle(px, py, GLOBE.x, GLOBE.y, GLOBE.r)) <= 12) return true;
  // Tilted meridian ellipse (18px stroke -> 9px half width)
  if (Math.abs(distEllipse(px, py, GLOBE.x, GLOBE.y, 62, GLOBE.r, (25 * Math.PI) / 180)) <= 9) return true;
  // Two latitude lines (18px stroke -> 9px half width)
  if (
    Math.abs(distSegment(px, py, GLOBE.x - LAT_HALF, GLOBE.y - LAT_OFFSET, GLOBE.x + LAT_HALF, GLOBE.y - LAT_OFFSET)) <= 9 ||
    Math.abs(distSegment(px, py, GLOBE.x - LAT_HALF, GLOBE.y + LAT_OFFSET, GLOBE.x + LAT_HALF, GLOBE.y + LAT_OFFSET)) <= 9
  ) {
    return true;
  }
  return false;
}

// Render a single sample point. `maskable` adds a content-safe padding
// (scaled down inside a full-bleed background) so nothing gets clipped
// by adaptive icons or iOS home-screen corner masking.
function sampleAt(x, y, maskable) {
  const sx = maskable ? U / 2 + (x - U / 2) * 0.7 : x;
  const sy = maskable ? U / 2 + (y - U / 2) * 0.7 : y;

  // Background: rounded square ("any") or full-bleed square (maskable / apple)
  if (maskable) {
    if (x < 0 || x > U || y < 0 || y > U) return [0, 0, 0, 0];
  } else if (distRoundedRect(sx, sy, U / 2, CORNER_RADIUS) > 0) {
    return [0, 0, 0, 0];
  }

  let color = gradientAt(sx, sy);

  // Magnifying glass lens (white glass)
  const lensD = distCircle(sx, sy, LENS.x, LENS.y, LENS.inner);
  if (lensD <= 0) color = [255, 255, 255];

  // Globe in blue -> purple strokes inside the lens
  if (lensD <= 0 && globeStrokeWidth(sx, sy)) color = gradientAt(sx, sy);

  // Lens rim ring (annulus between the outer edge and the inner disk)
  const lensEdgeD = distCircle(sx, sy, LENS.x, LENS.y, LENS.r);
  if (lensEdgeD <= 0 && lensEdgeD >= -(LENS.r - LENS.inner)) color = [255, 255, 255];

  // Magnifier handle
  if (distSegment(sx, sy, HANDLE.ax, HANDLE.ay, HANDLE.bx, HANDLE.by) <= HANDLE.radius) {
    color = [255, 255, 255];
  }

  return [color[0], color[1], color[2], 255];
}

// Render size x size RGBA buffer with 4x4 supersampling for smooth edges.
function render(size, maskable) {
  const img = Buffer.alloc(size * size * 4);
  const SAMPLES = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const ux = ((x + (sx + 0.5) / SAMPLES) / size) * U;
          const uy = ((y + (sy + 0.5) / SAMPLES) / size) * U;
          const c = sampleAt(ux, uy, maskable);
          if (c[3] === 255) {
            r += c[0]; g += c[1]; b += c[2]; a += 255;
          }
        }
      }
      const n = SAMPLES * SAMPLES;
      const px = y * size * 4 + x * 4;
      img[px] = Math.round(r / n);
      img[px + 1] = Math.round(g / n);
      img[px + 2] = Math.round(b / n);
      img[px + 3] = Math.round(a / n);
    }
  }
  return img;
}

// ---------------------------------------------------------------------------
// Output generation
// ---------------------------------------------------------------------------

mkdirSync(join(PUBLIC, "icons"), { recursive: true });

const savePNG = (file, size, maskable) => {
  const data = encodePNG(size, size, render(size, maskable));
  writeFileSync(file, data);
  console.log(`✓ ${file.replace(ROOT + "/", "")} (${size}x${size}, ${data.length} bytes)`);
};

function writeSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="512" height="512">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#9333EA"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1000" height="1000" rx="224" fill="url(#brand)"/>
  <circle cx="410" cy="410" r="300" fill="#ffffff"/>
  <g fill="none" stroke="url(#brand)" stroke-width="24">
    <circle cx="410" cy="410" r="182"/>
    <ellipse cx="410" cy="410" rx="62" ry="182" stroke-width="18" transform="rotate(25 410 410)"/>
    <line x1="242" y1="340" x2="578" y2="340" stroke-width="18"/>
    <line x1="242" y1="480" x2="578" y2="480" stroke-width="18"/>
  </g>
  <line x1="622" y1="622" x2="765" y2="765" stroke="#ffffff" stroke-width="132" stroke-linecap="round"/>
</svg>
`;
  writeFileSync(join(PUBLIC, "icon.svg"), svg);
  console.log("✓ public/icon.svg");
}

// Main icons
savePNG(join(PUBLIC, "icon-whois.png"), 512, false);
savePNG(join(PUBLIC, "icons", "icon-192.png"), 192, false);
savePNG(join(PUBLIC, "icons", "maskable-192.png"), 192, true);
savePNG(join(PUBLIC, "icons", "maskable-512.png"), 512, true);
savePNG(join(PUBLIC, "icons", "apple-touch-icon.png"), 180, true);

// favicon.ico (16, 32, 48 entries)
const ico = encodeICO(
  [16, 32, 48].map((size) => ({
    size: String(size),
    data: encodePNG(size, size, render(size, false)),
  }))
);
writeFileSync(join(PUBLIC, "favicon.ico"), ico);
console.log(`✓ public/favicon.ico (${ico.length} bytes)`);

writeSVG();
console.log("Done.");