// Scanner dispatch. Returns color/length/element candidates [{ kind, raw|tag, line, ... }]
// for a file. Waivers are applied later, per-rule, in the engine (see disabledMap).
import { cssScan, legacyScan } from './css.mjs';
import { astScan } from './ast.mjs';

// `wedge-disable[-line|-next-line] <rule>[, <rule>]` — names the rule(s) to waive.
const DISABLE_RE = /(?:wedge|impeccable)-disable(-line|-next-line)?\s+([a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*)/;

// Map of line -> Set of waived rule ids. Rule-scoped: disabling one rule on a
// line does not silence the others.
export function disabledMap(src) {
  const map = new Map();
  src.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(DISABLE_RE);
    if (!m) return;
    const target = m[1] === '-next-line' ? i + 2 : i + 1;
    if (!map.has(target)) map.set(target, new Set());
    for (const r of m[2].split(/\s*,\s*/)) map.get(target).add(r);
  });
  return map;
}

function ext(file) { return (file.match(/\.([a-z]+)$/i)?.[1] || '').toLowerCase(); }

function pick(file, engine) {
  if (engine === 'regex') return legacyScan;
  if (engine === 'css') return cssScan;
  if (engine === 'ast') return astScan;
  if (['css', 'scss', 'less'].includes(ext(file))) return cssScan;
  if (['tsx', 'jsx', 'ts', 'js', 'mjs', 'cjs'].includes(ext(file))) return astScan;
  return legacyScan;
}

export function extractCandidates(file, src, engine = 'auto') {
  try {
    return pick(file, engine)(src);
  } catch (err) {
    process.stderr.write(`  wedge: ${file} failed to parse (${err.message.split('\n')[0]}); using regex fallback\n`);
    return legacyScan(src);
  }
}
