// HTML → PDF for the handoff report. Deliberately NO bundled-Chromium dependency:
// Wedge prints the report HTML with a Chromium-family browser already on the
// machine (Chrome/Chromium/Edge/Brave), or one pointed to by $WEDGE_CHROME.
// Full CSS fidelity, zero npm weight.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const APP_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
];
const BINS = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'];

function which(bin) {
  try { return execSync(`command -v ${bin}`, { encoding: 'utf8' }).trim() || null; } catch { return null; }
}

// Last resort: a Chromium that Playwright/Puppeteer already downloaded.
function cachedChromium() {
  const root = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  try {
    for (const d of fs.readdirSync(root).filter(n => n.startsWith('chromium'))) {
      for (const sub of ['chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-linux/chrome']) {
        const p = path.join(root, d, sub);
        if (fs.existsSync(p)) return p;
      }
    }
  } catch { /* no cache */ }
  return null;
}

export function findChrome() {
  if (process.env.WEDGE_CHROME && fs.existsSync(process.env.WEDGE_CHROME)) return process.env.WEDGE_CHROME;
  for (const p of APP_PATHS) if (fs.existsSync(p)) return p;
  for (const b of BINS) { const p = which(b); if (p) return p; }
  return cachedChromium();
}

export function htmlToPdf(htmlPath, pdfPath) {
  const chrome = findChrome();
  if (!chrome) throw new Error('no Chromium-family browser found — set WEDGE_CHROME=/path/to/chrome, or open the HTML report and print to PDF');
  const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`];
  execSync(`"${chrome}" ${args.map(a => `"${a}"`).join(' ')}`, { stdio: ['ignore', 'ignore', 'pipe'] });
  return { pdfPath, chrome };
}
