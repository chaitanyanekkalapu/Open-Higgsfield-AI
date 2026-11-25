// QA screenshots for a generated sales page.
// Usage: node .claude/skills/sales-page-builder/scripts/screenshot.mjs <path/to/index.html> [outDir]
// Writes mobile.png (390px, full page), mobile-fold.png (first screen) and desktop.png,
// and prints horizontal-overflow and leftover data-demo checks.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(require.resolve('playwright', { paths: ['/usr/lib/node_modules', '/usr/local/lib/node_modules', process.cwd()] })); }

const file = process.argv[2];
if (!file) { console.error('Usage: screenshot.mjs <index.html> [outDir]'); process.exit(1); }
const abs = path.resolve(file);
const outDir = path.resolve(process.argv[3] || path.join(path.dirname(abs), 'qa'));
fs.mkdirSync(outDir, { recursive: true });
const url = 'file://' + abs;

const browser = await playwright.chromium.launch();
try {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(url, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(3500); // let chips + typing finish
  await mobile.screenshot({ path: path.join(outDir, 'mobile-fold.png') });
  await mobile.screenshot({ path: path.join(outDir, 'mobile.png'), fullPage: true });
  const checks = await mobile.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    demoLeft: document.querySelectorAll('[data-demo]').length,
    ctaInFold: (() => { const c = document.getElementById('hero-cta'); return c ? c.getBoundingClientRect().bottom <= window.innerHeight * 1.6 : false; })(),
    deadCtas: [...document.querySelectorAll('[data-cta]')].filter(a => !a.getAttribute('href') || a.getAttribute('href') === '#').length,
  }));

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await desktop.goto(url, { waitUntil: 'networkidle' });
  await desktop.waitForTimeout(3500);
  await desktop.screenshot({ path: path.join(outDir, 'desktop.png'), fullPage: true });

  console.log('Screenshots:', outDir);
  console.log(`Horizontal overflow at 390px: ${checks.overflowX}px ${checks.overflowX > 0 ? 'FAIL' : 'ok'}`);
  console.log(`Leftover [data-demo] slots: ${checks.demoLeft} ${checks.demoLeft ? 'FAIL (fill or delete them)' : 'ok'}`);
  console.log(`Hero CTA near first screen: ${checks.ctaInFold ? 'ok' : 'FAIL'}`);
  console.log(`CTAs without a real checkout link: ${checks.deadCtas} ${checks.deadCtas ? 'FAIL' : 'ok'}`);
} finally {
  await browser.close();
}
