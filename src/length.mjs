// Length → px. Returns null for values a spacing scale can't govern
// (%, auto, var(), calc(), negatives).
export function parseLengthPx(raw, rootPx = 16) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '0' || s === '0px' || s === '0rem') return 0;
  let m = s.match(/^(\d*\.?\d+)px$/i);          if (m) return parseFloat(m[1]);
  m = s.match(/^(\d*\.?\d+)(rem|em)$/i);         if (m) return parseFloat(m[1]) * rootPx;
  m = s.match(/^(\d*\.?\d+)$/);                  if (m) return parseFloat(m[1]); // unitless JS inline = px
  return null;
}
