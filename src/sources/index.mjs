// TokenSource adapters.  interface TokenSource { load(opts) -> { path: rawValue } }
// Each adapter normalizes its format into the same flat map; aliases become the
// engine-native "{a.b.c}" syntax. The engine is identical regardless of source.

import fs from 'node:fs';

// ── W3C Design Tokens — nested $value tree ──
function w3c({ file }) {
  const tree = JSON.parse(fs.readFileSync(file, 'utf8'));
  const flat = {};
  (function walk(n, p) {
    for (const [k, v] of Object.entries(n)) {
      if (v && typeof v === 'object' && '$value' in v) flat[p ? `${p}.${k}` : k] = v.$value;
      else if (v && typeof v === 'object') walk(v, p ? `${p}.${k}` : k);
    }
  })(tree, '');
  return flat;
}

// ── CSS custom properties — :root { --color-navy: #355191 } ──
function cssVars({ file }) {
  const css = fs.readFileSync(file, 'utf8');
  const flat = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(css))) {
    flat[m[1].replace(/-/g, '.')] = m[2].trim()
      .replace(/var\(\s*--([a-z0-9-]+)\s*\)/i, (_, r) => `{${r.replace(/-/g, '.')}}`);
  }
  return flat;
}

// ── Figma Variables, simple export shape: { variables: [{ name, value }] } ──
function figmaExport({ file }) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const flat = {};
  for (const v of doc.variables || []) flat[v.name.replace(/\//g, '.')] = v.value;
  return flat;
}

// ── Figma Variables REST API — the real shape from
//    GET /v1/files/:key/variables/local  (Enterprise plan).
//    Goes LIVE when fileKey + FIGMA_TOKEN are present; else reads a fixture
//    captured in that exact shape so the parsing is exercised deterministically.
async function figmaRest({ file, fileKey, mode }) {
  let body;
  if (fileKey && process.env.FIGMA_TOKEN) {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, {
      headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN },
    });
    if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
    body = await res.json();
  } else {
    body = JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  const vars = body.meta.variables;
  const collections = body.meta.variableCollections;
  const dotted = id => vars[id].name.replace(/\//g, '.');
  const toHex = ({ r, g, b }) =>
    '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

  const flat = {};
  for (const v of Object.values(vars)) {
    if (v.resolvedType !== 'COLOR') continue;
    const coll = collections[v.variableCollectionId];
    const modeId = (mode && coll.modes.find(m => m.name === mode)?.modeId) || coll.defaultModeId;
    const val = v.valuesByMode[modeId];
    if (val && val.type === 'VARIABLE_ALIAS') flat[dotted(v.id)] = `{${dotted(val.id)}}`;
    else if (val) flat[dotted(v.id)] = toHex(val);
  }
  return flat;
}

const ADAPTERS = {
  'w3c': w3c, 'css-vars': cssVars,
  'figma-export': figmaExport, 'figma-rest': figmaRest,
};

export async function loadTokenSource({ adapter, ...opts }) {
  const fn = ADAPTERS[adapter];
  if (!fn) throw new Error(`Unknown TokenSource adapter: ${adapter}`);
  return await fn(opts);
}

export const AVAILABLE_ADAPTERS = Object.keys(ADAPTERS);
