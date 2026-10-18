// Renders the social card (public/og/default.png, 1200x630) in the hero's
// look: ink, hairline ribbon, dot grid and the 3D JV mark. Run with:
// node scripts/og-card.mjs  (needs Playwright; CHROMIUM_PATH to override).
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const W = 1200, H = 630;
const font = (pkg) => readFileSync(`node_modules/@fontsource-variable/${pkg}/files/${pkg}-latin-wght-normal.woff2`).toString('base64');

// Same ribbon shape as src/lib/ribbon.ts, scaled to the card.
const ribbon = Array.from({ length: 26 }, (_, i) => {
  let d = '';
  for (let k = 0; k <= 72; k++) {
    const u = k / 72;
    const spread = 7 * (0.18 + Math.abs(Math.cos(u * Math.PI * 1.35 + 0.5)));
    const y = 430 + Math.sin(u * Math.PI * 1.7 + 0.4) * 130 + (i - 13) * spread + Math.sin(u * 9 + i * 0.12) * 4;
    d += `${k ? 'L' : 'M'}${(u * W).toFixed(1)} ${y.toFixed(1)}`;
  }
  return `<path${i === 9 || i === 17 ? ' class="hot"' : ''} d="${d}"/>`;
}).join('');

// The solid JV mark (as JVMark with depth): blade behind, J in front.
const layers = [8, 7, 6, 5, 4, 3, 2, 1].map((n) => `translate(${n * 0.45} ${n * 0.55})`);
const mark = `<svg class="mark" viewBox="8 0 90 100" style="overflow:visible">
  <defs><linearGradient id="lit" gradientUnits="userSpaceOnUse" x1="88" y1="4" x2="50" y2="96"><stop offset="0" stop-color="#F47B3B"/><stop offset="1" stop-color="#D9612A"/></linearGradient></defs>
  ${layers.map((t) => `<path transform="${t}" d="M74 0H98L64 100H42Z" fill="#9E4317"/>`).join('')}
  <path d="M74 0H98L64 100H42Z" fill="url(#lit)"/>
  ${layers.map((t) => `<path transform="${t}" d="M14 0H38L56.25 73H32.25ZM56 72A24 24 0 0 1 8 72Z" fill="#8F887E"/>`).join('')}
  <path d="M14 0H38L56.25 73H32.25ZM56 72A24 24 0 0 1 8 72Z" fill="#F2F0EB"/>
</svg>`;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Rubik; src: url(data:font/woff2;base64,${font('rubik')}); font-weight: 300 900; }
@font-face { font-family: Figtree; src: url(data:font/woff2;base64,${font('figtree')}); font-weight: 300 900; }
* { margin: 0; }
body { width: ${W}px; height: ${H}px; position: relative; overflow: hidden; background: #1F1B17; color: #F2F0EB; font-family: Figtree; }
.rib { position: absolute; inset: 0; } .rib path { fill: none; stroke: #F2F0EB; stroke-opacity: 0.12; stroke-width: 1.2; }
.rib path.hot { stroke: #F47B3B; stroke-opacity: 0.6; }
.dots { position: absolute; inset: 0; background: radial-gradient(circle, rgb(242 240 235 / 0.16) 1.2px, transparent 1.8px) center / 26px 26px;
  -webkit-mask: radial-gradient(ellipse 40% 60% at 50% 50%, #000, transparent); }
.wrap { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 16px; text-align: center; }
.mark { width: 150px; height: auto; margin-bottom: 14px; filter: drop-shadow(0 18px 22px rgb(0 0 0 / 0.5)); }
h1 { font: 500 84px/1 Rubik; letter-spacing: -0.04em; }
.role { font-size: 18px; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; color: rgb(242 240 235 / 0.7); }
.line { margin-top: 14px; font: 400 40px/1.2 Rubik; letter-spacing: -0.02em; } .line b { color: #F47B3B; font-weight: 400; }
</style>
<svg class="rib" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${ribbon}</svg><div class="dots"></div>
<div class="wrap">${mark}<h1>Jose Villa</h1><p class="role">Lead Full-Stack Developer</p>
<p class="line">I build the web applications businesses <b>run on.</b></p></div>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
mkdirSync('public/og', { recursive: true });
writeFileSync('public/og/default.png', await page.screenshot({ type: 'png' }));
await browser.close();
console.log('wrote public/og/default.png');
