// Scanner dispatch. Returns color-literal candidates [{ raw, line }] for a file,
// with wedge-disable waivers applied uniformly over the raw source.
import { cssScan, legacyScan } from './css.mjs';
import { astScan } from './ast.mjs';

const DISABLE_RE = /(?:wedge|impeccable)-disable(-line|-next-line)?\s+literal-instead-of-token/;

function disabledLines(src) {
  const set = new Set();
  src.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(DISABLE_RE);
    if (m) set.add(m[1] === '-next-line' ? i + 2 : i + 1);
  });
  return set;
}

function ext(file) { return (file.match(/\.([a-z]+)$/i)?.[1] || '').toLowerCase(); }

function pick(file, engine) {
  if (engine === 'regex') return legacyScan;
  if (engine === 'css') return cssScan;
  if (engine === 'ast') return astScan;
  // auto: by file type
  if (['css', 'scss', 'less'].includes(ext(file))) return cssScan;
  if (['tsx', 'jsx', 'ts', 'js', 'mjs', 'cjs'].includes(ext(file))) return astScan;
  return legacyScan;
}

export function extractCandidates(file, src, engine = 'auto') {
  const scan = pick(file, engine);
  let candidates;
  try {
    candidates = scan(src);
  } catch (err) {
    // A file that won't parse shouldn't crash the run — degrade to regex.
    process.stderr.write(`  wedge: ${file} failed to parse (${err.message.split('\n')[0]}); using regex fallback\n`);
    candidates = legacyScan(src);
  }
  const off = disabledLines(src);
  return candidates.filter(c => !off.has(c.line));
}
