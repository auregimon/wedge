// Drift-budget persistence — an append-only ledger of scan runs. This is the
// flywheel: findings/adoption tracked over time, so drift is visible and gateable.
// JSON file to start (a real product swaps in a service / per-tenant store).
import fs from 'node:fs';
import path from 'node:path';

export function loadHistory(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}

export function appendRun(file, record) {
  const hist = loadHistory(file);
  hist.push(record);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(hist, null, 2));
  return hist;
}

const BARS = '▁▂▃▄▅▆▇█';
export function sparkline(values) {
  if (!values.length) return '';
  const min = Math.min(...values), max = Math.max(...values), range = (max - min) || 1;
  return values.map(v => BARS[Math.round((v - min) / range * (BARS.length - 1))]).join('');
}
