// Wedge — brand-free conformance engine. Multi-rule.
// Receives a normalized token map ({ path -> rawValue }) from any TokenSource,
// builds a token model (colors + spacing scale), and runs the configured rules
// over candidates extracted by the scanner. Rules emit display-ready findings.

import { parseAnyColor, colorToHex } from './color.mjs';
import { parseLengthPx } from './length.mjs';
import { extractCandidates, disabledMap } from './scan/index.mjs';
import { isSpacingProp, isFontSizeProp } from './scan/shared.mjs';

export const DEFAULT_COLOR_TOLERANCE = 6;   // per-channel
export const DEFAULT_SPACE_TOLERANCE = 0.5; // px
export const DEFAULT_TYPE_TOLERANCE = 0.5;  // px

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
  const type = [];
  for (const [path, raw] of Object.entries(flat)) {
    const resolved = resolveAlias(raw, flat);
    const rgb = parseAnyColor(resolved);
    if (rgb) { colors.push({ path, rgb, semantic: typeof raw === 'string' && raw.startsWith('{') }); continue; }
    const seg = path.split('.');
    if (seg[0] === 'space' || seg[0] === 'spacing') {
      const px = parseLengthPx(resolved);
      if (px != null) space.push({ path, px });
    } else if (seg[0] === 'font' && seg[1] === 'size') {
      const px = parseLengthPx(resolved);
      if (px != null) type.push({ path, px });
    }
  }
  space.sort((a, b) => a.px - b.px);
  type.sort((a, b) => a.px - b.px);
  return { colors, space, type };
}

// Shared off-scale check: nearest scale step, or null if on-scale / unparseable.
function nearestOffScale(raw, scale, tol) {
  const px = parseLengthPx(raw);
  if (px == null || !scale.length) return null;
  if (scale.some(s => Math.abs(s.px - px) <= tol)) return null;
  let near = scale[0];
  for (const s of scale) if (Math.abs(s.px - px) < Math.abs(near.px - px)) near = s;
  return near;
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

// Off-scale length rules (spacing, type) share one shape; they differ only in
// which scale they check and which props they apply to.
function offScaleRule({ rule, tag, scaleKey, propTest, defaultTol }) {
  return (file, candidates, model, cfg) => {
    const scale = model[scaleKey];
    if (!scale.length) return [];
    const tol = cfg.tolerance ?? defaultTol;
    const out = [];
    for (const c of candidates) {
      if (c.kind !== 'length' || !propTest(c.prop)) continue;
      const near = nearestOffScale(c.raw, scale, tol);
      if (!near) continue;
      out.push({
        rule, severity: cfg.severity ?? 'advisory', file, line: c.line,
        tag, found: `${c.raw}${/^\d*\.?\d+$/.test(c.raw) ? 'px' : ''}`, foundColor: null,
        rel: '→', target: `${near.path} (${near.px}px)`, targetColor: null, badge: 'off-scale',
        fix: cssVar(near.path), prop: c.prop, also: [],
      });
    }
    return out;
  };
}

const ruleSpaceOffScale = offScaleRule({
  rule: 'space-off-scale', tag: 'space', scaleKey: 'space', propTest: isSpacingProp, defaultTol: DEFAULT_SPACE_TOLERANCE,
});
const ruleTypeOffScale = offScaleRule({
  rule: 'type-off-scale', tag: 'type', scaleKey: 'type', propTest: isFontSizeProp, defaultTol: DEFAULT_TYPE_TOLERANCE,
});

// ── rule: handrolled-component (JSX structure) ──
// Registry-driven: cfg.components declares DS components and the raw tags they
// replace. Flags (1) a replaced tag carrying inline style — a re-rolled version,
// and (2) a div/span with onClick when a component opts in as the interactive
// surrogate — a button built out of a div (also an accessibility problem).
function ruleHandrolledComponent(file, candidates, model, cfg) {
  const registry = cfg.components || [];
  if (!registry.length) return [];
  const styled = new Map();
  let surrogate = null;
  for (const c of registry) {
    for (const t of c.replaces || []) styled.set(t, c);
    if (c.interactiveSurrogate && !surrogate) surrogate = c;
  }
  const sev = cfg.severity ?? 'advisory';
  const make = (e, found, comp, badge) => ({
    rule: 'handrolled-component', severity: sev, file, line: e.line,
    tag: 'component', found, foundColor: null, rel: '→',
    target: `<${comp.name}>`, targetColor: null, badge, fix: `from '${comp.import}'`, also: [],
  });
  const out = [];
  for (const e of candidates) {
    if (e.kind !== 'element') continue;
    const attrs = new Set(e.attrs);
    const comp = styled.get(e.tag);
    if (comp && (attrs.has('style') || attrs.has('sx') || attrs.has('css'))) {
      out.push(make(e, `<${e.tag} style>`, comp, 'hand-rolled'));
    } else if (surrogate && attrs.has('onClick') && (e.tag === 'div' || e.tag === 'span')) {
      out.push(make(e, `<${e.tag} onClick>`, surrogate, 'div-as-button'));
    }
  }
  return out;
}

const RULES = {
  'literal-instead-of-token': ruleLiteralInsteadOfToken,
  'space-off-scale': ruleSpaceOffScale,
  'type-off-scale': ruleTypeOffScale,
  'handrolled-component': ruleHandrolledComponent,
};

export function runFile(file, src, model, rulesCfg = {}, engine = 'auto') {
  const candidates = extractCandidates(file, src, engine);
  const disabled = disabledMap(src);
  const findings = [];
  for (const [id, fn] of Object.entries(RULES)) {
    const cfg = rulesCfg[id];
    if (!cfg || cfg.severity === 'off') continue;
    for (const f of fn(file, candidates, model, cfg)) {
      if (!disabled.get(f.line)?.has(f.rule)) findings.push(f); // rule-scoped waiver
    }
  }
  return findings.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}
