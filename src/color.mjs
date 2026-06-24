// Color parsing — vendored from impeccable (Apache-2.0, © Paul Bakaus).
// See NOTICE. parseAnyColor / oklchToRgb / colorToHex lifted verbatim so Wedge
// is self-contained and does not depend on impeccable's internal engine paths.

export function oklchToRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const lc = l_ * l_ * l_, mc = m_ * m_ * m_, sc = s_ * s_ * s_;
  const rLin =  4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const gLin = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bLin = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;
  const enc = (x) => {
    const c = Math.max(0, Math.min(1, x));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  return { r: Math.round(enc(rLin) * 255), g: Math.round(enc(gLin) * 255), b: Math.round(enc(bLin) * 255), a: 1 };
}

export function parseAnyColor(s) {
  if (!s || typeof s !== 'string') return null;
  const str = s.trim();
  if (str === 'transparent' || str === 'currentcolor' || str === 'inherit') return null;
  let m;
  m = str.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*([\d.]+))?\s*\)/);
  if (m) return { r: Math.round(+m[1]), g: Math.round(+m[2]), b: Math.round(+m[3]), a: m[4] !== undefined ? +m[4] : 1 };
  m = str.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    const h = m[1];
    if (h.length === 3 || h.length === 4) {
      return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16),
               a: h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1 };
    }
    if (h.length === 6 || h.length === 8) {
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
               a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
    }
  }
  m = str.match(/oklch\(\s*([\d.]+)(%?)\s*[\s,]*\s*([\d.]+)\s*[\s,]+\s*([-\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+)(%)?)?\s*\)/i);
  if (m) {
    const Lnum = parseFloat(m[1]);
    const rgb = oklchToRgb(m[2] === '%' ? Lnum / 100 : Lnum, parseFloat(m[3]), parseFloat(m[4]));
    if (m[5] !== undefined) rgb.a = m[6] === '%' ? parseFloat(m[5]) / 100 : parseFloat(m[5]);
    return rgb;
  }
  return null;
}

export function colorToHex(c) {
  if (!c) return '?';
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
}
