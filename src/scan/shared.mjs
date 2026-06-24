// Shared scan primitives.
export const CSS_COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|oklch\([^)]+\)|hsla?\([^)]+\)/gi;

// Box-spacing properties a spacing scale governs (camelCase + kebab, normalized).
const SPACING_PROPS = new Set([
  'padding', 'paddingtop', 'paddingright', 'paddingbottom', 'paddingleft', 'paddinginline', 'paddingblock',
  'margin', 'margintop', 'marginright', 'marginbottom', 'marginleft', 'margininline', 'marginblock',
  'gap', 'rowgap', 'columngap',
]);
export const isSpacingProp = p => SPACING_PROPS.has(String(p).toLowerCase().replace(/-/g, ''));

// Replace comment bodies with spaces, preserving newlines so line numbers hold.
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_, p) => p);
}

// Color literals from a string value.
export function colorsIn(text) {
  const out = [];
  let m; CSS_COLOR_RE.lastIndex = 0;
  while ((m = CSS_COLOR_RE.exec(text))) out.push({ raw: m[0], index: m.index });
  return out;
}

// Parse CSS declaration text into typed candidates. Used for .css files and the
// static quasis of styled/css templates. `lineOffset` maps local lines to file lines.
export function parseCssText(text, lineOffset = 0) {
  const out = [];
  const DECL_RE = /([\w-]+)\s*:\s*([^;{}]+)[;}]/g;
  let m;
  while ((m = DECL_RE.exec(text))) {
    const prop = m[1], value = m[2];
    const line = text.slice(0, m.index).split('\n').length + lineOffset;
    for (const { raw } of colorsIn(value)) out.push({ kind: 'color', raw, line, prop });
    if (isSpacingProp(prop)) {
      for (const tok of value.trim().split(/\s+/)) out.push({ kind: 'length', raw: tok, line, prop });
    }
  }
  return out;
}
