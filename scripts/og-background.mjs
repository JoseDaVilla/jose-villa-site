// Renders the social-card background (src/assets/og-bg.png) from the same
// shape generators the site uses. Run with: node scripts/og-background.mjs
// Requires Playwright with a Chromium build (CHROMIUM_PATH to override).
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

// Inline copies of the generators (plain JS so this script runs without a TS loader).
function rng(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
const f = (n) => n.toFixed(1);
function smooth(pts, closed) {
  const n = pts.length, at = (i) => (closed ? pts[(i + n) % n] : pts[Math.min(Math.max(i, 0), n - 1)]);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
const blob = (seed, n = 7, v = 0.3) => { const r = rng(seed), p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rad = 50 * (1 - v / 2 + r() * v); p.push([50 + Math.cos(a) * rad, 50 + Math.sin(a) * rad]); } return smooth(p, true); };
const wave = (seed, w, h, base, amp, steps = 6) => { const r = rng(seed), p = []; for (let i = 0; i <= steps; i++) p.push([(i / steps) * w, base + (r() - 0.5) * 2 * amp]); return `${smooth(p, false)} L${w},${h} L0,${h} Z`; };

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FBF7F2"/>
  <g transform="translate(870 150) scale(3)"><path d="${blob(4, 7, 0.28)}" fill="#FF8A3D"/></g>
  <g transform="translate(820 330) scale(1.6)"><path d="${blob(9, 6, 0.3)}" fill="#FFCB57"/></g>
  <g transform="translate(1060 360) scale(1.15)"><path d="${blob(13, 6, 0.36)}" fill="#9CCBFF"/></g>
  <path d="${wave(5, 1200, 630, 520, 18)}" fill="#FFCB57"/>
  <path d="${wave(12, 1200, 630, 556, 16)}" fill="#FF8A3D"/>
  <path d="${wave(19, 1200, 630, 590, 12, 7)}" fill="#2B59C3"/>
</svg>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(`<body style="margin:0">${svg}</body>`);
writeFileSync('src/assets/og-bg.png', await page.screenshot({ type: 'png' }));
await browser.close();
console.log('wrote src/assets/og-bg.png');
