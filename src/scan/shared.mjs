// Shared scan primitives.
export const CSS_COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|oklch\([^)]+\)|hsla?\([^)]+\)/gi;

// Replace comment bodies with spaces, preserving newlines so line numbers hold.
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_, p) => p);
}

// Pull color literals out of a string value, each with a within-string offset.
export function colorsIn(text) {
  const out = [];
  let m; CSS_COLOR_RE.lastIndex = 0;
  while ((m = CSS_COLOR_RE.exec(text))) out.push({ raw: m[0], index: m.index });
  return out;
}
