// Wedge — brand-free conformance engine.
// Receives a normalized TokenGraph ({ path -> rawValue }) from any TokenSource
// and a file's source. No brand, no token, no source assumption lives here.

import { parseAnyColor, colorToHex } from './color.mjs';

const CSS_COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|oklch\([^)]+\)|hsla?\([^)]+\)/gi;
export const DEFAULT_TOLERANCE = 6; // per-channel, matches impeccable's design-system scanner

function resolveAlias(value, flat, seen = new Set()) {
  const m = typeof value === 'string' && value.match(/^\{([^}]+)\}$/);
  if (!m) return value;
  const ref = m[1];
  if (seen.has(ref) || !(ref in flat)) return null;
  seen.add(ref);
  return resolveAlias(flat[ref], flat, seen);
}

export function buildReverseIndex(flat) {
  const index = [];
  for (const [path, raw] of Object.entries(flat)) {
    const rgb = parseAnyColor(resolveAlias(raw, flat));
    if (!rgb) continue;
    index.push({ path, rgb, semantic: typeof raw === 'string' && raw.startsWith('{') });
  }
  return index;
}

const close = (a, b, t) => Math.abs(a.r - b.r) <= t && Math.abs(a.g - b.g) <= t && Math.abs(a.b - b.b) <= t;

function matchToken(rgb, index, tol) {
  const hits = index.filter(e => close(rgb, e.rgb, tol));
  if (!hits.length) return null;
  hits.sort((a, b) => (b.semantic - a.semantic) || a.path.length - b.path.length);
  return { best: hits[0], all: hits.map(h => h.path) };
}

// Interim precision pass: strip comments so prose-mentioned hexes don't fire.
// The production fix is a static-HTML/AST scan; this closes the known comment FP.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_, p) => p);
}

export function literalInsteadOfToken(filePath, src, index, tol = DEFAULT_TOLERANCE) {
  const lines = stripComments(src).split(/\r?\n/);
  const findings = [];
  lines.forEach((line, i) => {
    if (/(?:impeccable|wedge)-disable(?:-line)?\s+literal-instead-of-token/.test(line)) return;
    let m; CSS_COLOR_RE.lastIndex = 0;
    while ((m = CSS_COLOR_RE.exec(line))) {
      const literal = m[0];
      const rgb = parseAnyColor(literal);
      if (!rgb || rgb.a === 0) continue;
      const match = matchToken(rgb, index, tol);
      if (!match) continue;
      const exact = colorToHex(rgb).toLowerCase() === colorToHex(match.best.rgb).toLowerCase();
      findings.push({
        rule: 'literal-instead-of-token',
        severity: 'advisory',
        file: filePath, line: i + 1,
        literal, token: match.best.path, exact,
        tokenHex: colorToHex(match.best.rgb),
        suggestion: `var(--${match.best.path.replace(/\./g, '-')})`,
        also: match.all.slice(1),
      });
    }
  });
  return findings;
}
