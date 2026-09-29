// Renders product images (PNG, 1200×1200) from the theme's own illustration kit.
// Usage: node scripts/store-seed/render-images.mjs   (needs the `playwright` package)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { PRODUCTS } from './catalog.mjs';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const R = require(path.join(here, '../../assets/axion-render.js'));
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright'));
}

const OUT = path.join(here, 'images');
fs.mkdirSync(OUT, { recursive: true });


const accessoryArt = {
  service: () => `
    <g transform="translate(250 330)">
      <rect x="0" y="120" width="700" height="300" rx="40" fill="#97A87A"/>
      <rect x="0" y="100" width="700" height="300" rx="40" fill="#A8BBA3"/>
      ${Array.from({ length: 10 }, (_, i) => `<g transform="translate(${40 + i * 64} 150)"><rect width="54" height="56" rx="10" fill="#E8E1C9"/><rect x="5" width="44" height="46" rx="8" fill="#FCF9EA"/></g>`).join('')}
      ${Array.from({ length: 9 }, (_, i) => `<g transform="translate(${70 + i * 64} 220)"><rect width="54" height="56" rx="10" fill="#E8E1C9"/><rect x="5" width="44" height="46" rx="8" fill="#FCF9EA"/></g>`).join('')}
      <g transform="translate(40 290)"><rect width="200" height="56" rx="10" fill="#C8804A"/><rect x="5" width="190" height="46" rx="8" fill="#DB9558"/></g>
    </g>
    <g transform="translate(730 250) rotate(35)">
      <rect x="-14" y="0" width="28" height="200" rx="14" fill="#8C6B4F"/>
      <rect x="-5" y="-70" width="10" height="80" rx="5" fill="#C9C2AE"/>
      <rect x="-9" y="-90" width="18" height="30" rx="4" fill="#DB9558"/>
    </g>`,
  tester: () => {
    const stems = ['#DB9558', '#E8C9A0', '#8C6B4F', '#B08A63', '#7E9BA6', '#5E7F73', '#C96F6F', '#E3C766', '#A8BBA3', '#6F7F5A', '#B9B2A0', '#2F2B22'];
    const cells = stems.map((c, i) => {
      const x = 300 + (i % 4) * 150, y = 360 + Math.floor(i / 4) * 150;
      return `<g transform="translate(${x} ${y})"><rect x="-50" y="-40" width="100" height="90" rx="16" fill="#F1EBD3"/><rect x="-50" y="-40" width="100" height="30" rx="14" fill="#fff" opacity=".5"/><rect x="-18" y="-68" width="36" height="36" rx="7" fill="${c}"/><rect x="-24" y="-58" width="48" height="12" rx="4" fill="${c}"/></g>`;
    }).join('');
    return `<rect x="200" y="260" width="800" height="560" rx="48" fill="#FFFDF4" opacity=".7"/><rect x="200" y="780" width="800" height="40" rx="20" fill="#E0D8BE"/>${cells}`;
  },
  cable: () => `
    <path d="M160 820 C260 820 300 700 380 700" stroke="#6F7F5A" stroke-width="26" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 11 }, (_, i) => `<ellipse cx="${410 + i * 34}" cy="640" rx="30" ry="72" fill="none" stroke="${i % 2 ? '#97A87A' : '#A8BBA3'}" stroke-width="22"/>`).join('')}
    <path d="M780 640 C860 640 880 520 960 480" stroke="#6F7F5A" stroke-width="26" fill="none" stroke-linecap="round"/>
    <rect x="940" y="430" width="90" height="70" rx="18" fill="#C9A66B" transform="rotate(-25 985 465)"/>
    <rect x="110" y="790" width="90" height="60" rx="16" fill="#C9A66B"/>
    <rect x="80" y="805" width="40" height="30" rx="8" fill="#8C8676"/>`,
  puller: () => `
    <g transform="translate(600 560) rotate(-20)">
      <rect x="-60" y="60" width="120" height="260" rx="50" fill="#B08A63"/>
      <rect x="-60" y="60" width="120" height="60" rx="30" fill="#C99E73"/>
      <path d="M-40 70 C-60 -60 -70 -170 -30 -250" stroke="#B9B2A0" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M40 70 C60 -60 70 -170 30 -250" stroke="#B9B2A0" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M-30 -250 l-18 -14 M30 -250 l18 -14" stroke="#B9B2A0" stroke-width="16" stroke-linecap="round"/>
    </g>
    <g transform="translate(820 760)"><rect width="140" height="140" rx="26" fill="#C8804A"/><rect x="12" width="116" height="118" rx="22" fill="#DB9558"/></g>`,
  deskmat: () => {
    const flowers = Array.from({ length: 28 }, (_, i) => {
      const x = 210 + (i % 7) * 130 + (Math.floor(i / 7) % 2) * 60, y = 380 + Math.floor(i / 7) * 120;
      const c = ['#DB9558', '#FCF9EA', '#97A87A'][i % 3];
      return `<circle cx="${x}" cy="${y}" r="16" fill="${c}"/><circle cx="${x}" cy="${y}" r="5" fill="#6F7F5A"/>`;
    }).join('');
    return `<g transform="rotate(-6 600 600)"><rect x="140" y="320" width="920" height="520" rx="46" fill="#8C9E70"/><rect x="140" y="300" width="920" height="520" rx="46" fill="#A8BBA3"/>${flowers}</g>`;
  }
};

function artFor(p) {
  const a = p.art;
  const inner = (svg, x, y, w) => {
    const [, , vw] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    return `<g transform="translate(${x} ${y}) scale(${(w / vw).toFixed(4)})">${svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
  };
  switch (a.kind) {
    case 'keyboard': {
      const w = a.layout === 'tkl' ? 1000 : 940;
      const kb = R.keyboard({ layout: a.layout, caseColor: a.caseColor, alpha: a.alpha, mod: a.mod, accent: a.accent, legends: true });
      return inner(kb, (1200 - w) / 2, 380, w);
    }
    case 'switch':
      return inner(R.keySwitch({ stem: a.stem }), 330, 250, 540);
    case 'keycaps':
      return inner(R.keycaps({ alpha: a.alpha, mod: a.mod, accent: a.accent }), 200, 300, 800);
    default:
      return accessoryArt[a.kind]();
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
for (const p of PRODUCTS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
    <rect width="1200" height="1200" fill="${p.art.bg}"/>
    <circle cx="1040" cy="170" r="70" fill="#FFFFFF" opacity=".35"/>
    <circle cx="150" cy="1060" r="40" fill="#FFFFFF" opacity=".35"/>
    ${artFor(p)}
    <text x="80" y="1130" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="#2F2B22" opacity=".35">axion</text>
  </svg>`;
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.screenshot({ path: path.join(OUT, `${p.handle}.png`), clip: { x: 0, y: 0, width: 1200, height: 1200 } });
  console.log('rendered', p.handle);
}
await browser.close();
