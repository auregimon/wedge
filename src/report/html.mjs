// HTML handoff report — the agency deliverable. Themed entirely by brand.json.
// Deliberately avoids the AI-slop tells Wedge itself flags: no purple gradient,
// no nested cards, no icon-tile stack, real type hierarchy, generous spacing.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderHtml(findings, brand, meta) {
  const accent = brand.accentHex ?? '#2563EB';
  const files = new Set(findings.map(f => f.file)).size;
  const byFile = {};
  for (const f of findings) (byFile[f.file] ??= []).push(f);

  const groups = Object.entries(byFile).map(([file, fs_]) => `
    <section class="file">
      <h3>${esc(file)} <span class="count">${fs_.length}</span></h3>
      <table>
        <thead><tr><th>Line</th><th>Found</th><th></th><th>Token</th><th>Replace with</th></tr></thead>
        <tbody>
        ${fs_.map(f => `
          <tr>
            <td class="ln">${f.line}</td>
            <td><span class="sw" style="background:${esc(f.literal)}"></span><code>${esc(f.literal)}</code></td>
            <td class="arr">${f.exact ? '=' : '≈'}</td>
            <td><span class="sw" style="background:${esc(f.tokenHex)}"></span><code>${esc(f.token)}</code>${f.exact ? '' : ' <span class="drift">drift</span>'}</td>
            <td><code class="fix">${esc(f.suggestion)}</code></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>`).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(brand.productName)} — ${esc(brand.reportTitle ?? 'report')}</title>
<style>
  :root { --accent:${accent}; --ink:#16202B; --muted:#5B6B7A; --line:#E6EAEE; --bg:#FFFFFF; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:16px/1.6 ui-sans-serif,-apple-system,"Segoe UI",Roboto,system-ui,sans-serif;
    -webkit-font-smoothing:antialiased; }
  .wrap { max-width:860px; margin:0 auto; padding:64px 32px 96px; }
  header { border-left:4px solid var(--accent); padding-left:20px; margin-bottom:8px; }
  header .brand { font-weight:700; letter-spacing:-0.01em; font-size:15px; color:var(--accent); }
  h1 { font-size:34px; line-height:1.15; letter-spacing:-0.02em; margin:6px 0 4px; font-weight:680; }
  .sub { color:var(--muted); margin:0; max-width:60ch; }
  .meta { color:var(--muted); font-size:13px; margin-top:14px; }
  .stat { display:flex; gap:40px; margin:40px 0 8px; padding:24px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
  .stat .n { font-size:40px; font-weight:700; letter-spacing:-0.02em; line-height:1; }
  .stat .l { color:var(--muted); font-size:13px; margin-top:6px; text-transform:uppercase; letter-spacing:0.04em; }
  section.file { margin-top:44px; }
  h3 { font-size:14px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-weight:600;
    color:var(--ink); margin:0 0 12px; display:flex; align-items:center; gap:10px; }
  h3 .count { background:var(--accent); color:#fff; font-family:inherit; font-size:11px;
    border-radius:999px; padding:1px 9px; font-weight:700; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;
    color:var(--muted); font-weight:600; padding:0 10px 8px; border-bottom:1px solid var(--line); }
  td { padding:12px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
  td.ln { color:var(--muted); font-family:ui-monospace,monospace; font-size:13px; width:48px; }
  td.arr { color:var(--muted); text-align:center; width:24px; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }
  code.fix { color:var(--accent); font-weight:600; }
  .sw { display:inline-block; width:14px; height:14px; border-radius:4px; margin-right:8px;
    vertical-align:-2px; box-shadow:inset 0 0 0 1px rgba(0,0,0,0.12); }
  .drift { font-size:10px; text-transform:uppercase; letter-spacing:0.04em; color:#A85A00;
    background:#FFF3E0; border-radius:4px; padding:1px 6px; margin-left:4px; }
  .pass { font-size:22px; font-weight:600; margin-top:40px; }
  footer { margin-top:64px; padding-top:20px; border-top:1px solid var(--line);
    color:var(--muted); font-size:13px; }
</style></head>
<body><div class="wrap">
  <header>
    <div class="brand">${esc(brand.productName)}</div>
    <h1>${esc(brand.reportTitle ?? 'Conformance report')}</h1>
    <p class="sub">${esc(brand.subtitle ?? '')}</p>
    <div class="meta">Token source: <code>${esc(meta.adapter)}</code> · ${meta.tokens} color tokens · generated for handoff</div>
  </header>
  ${findings.length ? `
  <div class="stat">
    <div><div class="n">${findings.length}</div><div class="l">Token bypasses</div></div>
    <div><div class="n">${files}</div><div class="l">File${files === 1 ? '' : 's'} affected</div></div>
    <div><div class="n">${findings.filter(f => !f.exact).length}</div><div class="l">Drift (off-token)</div></div>
  </div>
  ${groups}` : `<p class="pass">${esc(brand.passMessage ?? 'On system. ✓')}</p>`}
  <footer>${esc(brand.footer ?? '')}</footer>
</div></body></html>`;
}
