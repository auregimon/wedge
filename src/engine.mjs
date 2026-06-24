// Wedge — brand-free conformance engine. Multi-rule.
// Receives a normalized token map ({ path -> rawValue }) from any TokenSource,
// builds a token model (colors + spacing scale), and runs the configured rules
// over candidates extracted by the scanner. Rules emit display-ready findings.

import { parseAnyColor, colorToHex } from './color.mjs';
import { parseLengthPx } from './length.mjs';
import { extractCandidates } from './scan/index.mjs';

export const DEFAULT_COLOR_TOLERANCE = 6;   // per-channel
export const DEFAULT_SPACE_TOLERANCE = 0.5; // px

function resolveAlias(value, flat, seen = new Set()) {
  const m = typeof value === 'string' && value.match(/^\{([^}]+)\}$/);
  if (!m) return value;
  const ref = m[1];
  if (seen.has(ref) || !(ref in flat)) return null;
  seen.add(ref);
  return resolveAlias(flat[ref], flat, seen);
}

export function buildTokenModel(flat) {
  const colors = [];
  const space = [];
  for (const [path, raw] of Object.entries(flat)) {
    const resolved = resolveAlias(raw, flat);
    const rgb = parseAnyColor(resolved);
    if (rgb) { colors.push({ path, rgb, semantic: typeof raw === 'string' && raw.startsWith('{') }); continue; }
    const seg0 = path.split('.')[0];
    if (seg0 === 'space' || seg0 === 'spacing') {
      const px = parseLengthPx(resolved);
      if (px != null) space.push({ path, px });
    }
  }
  space.sort((a, b) => a.px - b.px);
  return { colors, space };
}

const close = (a, b, t) => Math.abs(a.r - b.r) <= t && Math.abs(a.g - b.g) <= t && Math.abs(a.b - b.b) <= t;

function matchColor(rgb, index, tol) {
  const hits = index.filter(e => close(rgb, e.rgb, tol));
  if (!hits.length) return null;
  hits.sort((a, b) => (b.semantic - a.semantic) || a.path.length - b.path.length);
  return { best: hits[0], all: hits.map(h => h.path) };
}

const cssVar = path => `var(--${path.replace(/\./g, '-')})`;

// ── rule: literal-instead-of-token (color) ──
function ruleLiteralInsteadOfToken(file, candidates, model, cfg) {
  const tol = cfg.tolerance ?? DEFAULT_COLOR_TOLERANCE;
  const out = [];
  for (const c of candidates) {
    if (c.kind !== 'color') continue;
    const rgb = parseAnyColor(c.raw);
    if (!rgb || rgb.a === 0) continue;
    const m = matchColor(rgb, model.colors, tol);
    if (!m) continue;
    const exact = colorToHex(rgb).toLowerCase() === colorToHex(m.best.rgb).toLowerCase();
    out.push({
      rule: 'literal-instead-of-token', severity: cfg.severity ?? 'advisory', file, line: c.line,
      tag: 'color', found: c.raw, foundColor: colorToHex(rgb), rel: exact ? '=' : '≈',
      target: m.best.path, targetColor: colorToHex(m.best.rgb), badge: exact ? null : 'drift',
      fix: cssVar(m.best.path), also: m.all.slice(1),
    });
  }
  return out;
}

// ── rule: space-off-scale (spacing) ──
function ruleSpaceOffScale(file, candidates, model, cfg) {
  if (!model.space.length) return [];
  const tol = cfg.tolerance ?? DEFAULT_SPACE_TOLERANCE;
  const out = [];
  for (const c of candidates) {
    if (c.kind !== 'length') continue;
    const px = parseLengthPx(c.raw);
    if (px == null) continue;
    if (model.space.some(s => Math.abs(s.px - px) <= tol)) continue; // on scale
    let near = model.space[0];
    for (const s of model.space) if (Math.abs(s.px - px) < Math.abs(near.px - px)) near = s;
    out.push({
      rule: 'space-off-scale', severity: cfg.severity ?? 'advisory', file, line: c.line,
      tag: 'space', found: `${c.raw}${/^\d*\.?\d+$/.test(c.raw) ? 'px' : ''}`, foundColor: null,
      rel: '→', target: `${near.path} (${near.px}px)`, targetColor: null, badge: 'off-scale',
      fix: cssVar(near.path), prop: c.prop, also: [],
    });
  }
  return out;
}

const RULES = {
  'literal-instead-of-token': ruleLiteralInsteadOfToken,
  'space-off-scale': ruleSpaceOffScale,
};

export function runFile(file, src, model, rulesCfg = {}, engine = 'auto') {
  const candidates = extractCandidates(file, src, engine);
  const findings = [];
  for (const [id, fn] of Object.entries(RULES)) {
    const cfg = rulesCfg[id];
    if (!cfg || cfg.severity === 'off') continue;
    findings.push(...fn(file, candidates, model, cfg));
  }
  return findings.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}
