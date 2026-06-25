// HTML handoff report — the agency deliverable. Themed entirely by brand.json.
// Rule-agnostic: renders any finding via its display fields (swatches only when
// a color is present). Deliberately avoids the AI-slop tells Wedge itself flags.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const swatch = hex => hex ? `<span class="sw" style="background:${esc(hex)}"></span>` : '';

export function renderHtml(findings, proposals, summary, brand, meta) {
  const accent = brand.accentHex ?? '#2563EB';
  const files = new Set(findings.map(f => f.file)).size;
  const tags = [...new Set(findings.map(f => f.tag))];

  const driftBanner = summary ? `
    <div class="drift">
      <div class="adopt">
        <div class="big">${(summary.adoption * 100).toFixed(0)}%${summary.adoptionDelta != null
          ? `<span class="d ${summary.adoptionDelta >= 0 ? 'up' : 'dn'}">${summary.adoptionDelta >= 0 ? '▲' : '▼'}${Math.abs(summary.adoptionDelta * 100).toFixed(0)} pts</span>` : ''}</div>
        <div class="cap">Token adoption · ${summary.examined} style values examined</div>
      </div>
      ${summary.delta != null ? `<div class="drift-item"><div class="spark">${esc(summary.trend || '')}</div><div class="cap">Findings ${summary.findingsTotal} · ${summary.delta <= 0 ? '▼' : '▲'}${Math.abs(summary.delta)} since ${esc(new Date(summary.prev.ts).toISOString().slice(0, 10))}</div></div>` : ''}
      ${summary.budget ? `<div class="drift-item"><div class="budge ${summary.budget.ok ? 'ok' : 'over'}">${summary.budget.value} / ${summary.budget.max}</div><div class="cap">Drift budget · ${summary.budget.ok ? 'within' : 'OVER'}</div></div>` : ''}
    </div>` : '';
  const byFile = {};
  for (const f of findings) (byFile[f.file] ??= []).push(f);

  const groups = Object.entries(byFile).map(([file, fs_]) => `
    <section class="file">
      <h3>${esc(file)} <span class="count">${fs_.length}</span></h3>
      <table>
        <thead><tr><th>Line</th><th>Rule</th><th>Found</th><th></th><th>Token</th><th>Replace with</th></tr></thead>
        <tbody>
        ${fs_.map(f => `
          <tr>
            <td class="ln">${f.line}</td>
            <td><span class="tag tag-${esc(f.tag)}">${esc(f.tag)}</span></td>
            <td>${swatch(f.foundColor)}<code>${esc(f.found)}</code></td>
            <td class="arr">${esc(f.rel)}</td>
            <td>${swatch(f.targetColor)}<code>${esc(f.target)}</code>${f.badge ? ` <span class="badge badge-${esc(f.badge)}">${esc(f.badge)}</span>` : ''}</td>
            <td><code class="fix">${esc(f.fix)}</code></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>`).join('');

  const stat = (n, l) => `<div><div class="n">${n}</div><div class="l">${l}</div></div>`;

  const proposeSection = (proposals?.length) ? `
    <section class="propose">
      <h2>↑ Proposed additions to the design system <span class="pcount">${proposals.length}</span></h2>
      <p class="psub">Recurring values the system doesn't cover yet — candidates for new tokens. This is the loop back from code to the design system.</p>
      <table>
        <thead><tr><th>Type</th><th>Value</th><th>Uses</th><th>Suggested token</th><th></th></tr></thead>
        <tbody>
        ${proposals.map(p => `
          <tr>
            <td><span class="tag tag-${esc(p.kind)}">${esc(p.kind)}</span></td>
            <td>${swatch(p.swatch)}<code>${esc(p.value)}</code></td>
            <td class="uses">×${p.count}</td>
            <td><code class="fix">${esc(p.suggest)}</code></td>
            <td class="pnote">${esc(p.note)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>` : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(brand.productName)} — ${esc(brand.reportTitle ?? 'report')}</title>
<style>
  :root { --accent:${accent}; --ink:#16202B; --muted:#5B6B7A; --line:#E6EAEE; --bg:#FFFFFF; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:16px/1.6 ui-sans-serif,-apple-system,"Segoe UI",Roboto,system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:880px; margin:0 auto; padding:64px 32px 96px; }
  header { border-left:4px solid var(--accent); padding-left:20px; }
  header .brand { font-weight:700; letter-spacing:-0.01em; font-size:15px; color:var(--accent); }
  h1 { font-size:34px; line-height:1.15; letter-spacing:-0.02em; margin:6px 0 4px; font-weight:680; }
  .sub { color:var(--muted); margin:0; max-width:60ch; }
  .meta { color:var(--muted); font-size:13px; margin-top:14px; }
  .drift { display:flex; gap:48px; align-items:flex-end; margin:36px 0 0; padding:20px 24px; background:#F7F9FB; border:1px solid var(--line); border-radius:12px; }
  .drift .big { font-size:38px; font-weight:700; letter-spacing:-0.02em; line-height:1; display:flex; align-items:baseline; gap:10px; }
  .drift .d { font-size:13px; font-weight:700; }
  .drift .d.up { color:#2E7D55; } .drift .d.dn { color:#B23B3B; }
  .drift .cap { color:var(--muted); font-size:12px; margin-top:8px; text-transform:uppercase; letter-spacing:0.04em; }
  .drift .spark { font-family:ui-monospace,monospace; font-size:26px; line-height:1; color:var(--accent); letter-spacing:1px; }
  .drift .budge { font-size:26px; font-weight:700; font-family:ui-monospace,monospace; }
  .drift .budge.ok { color:#2E7D55; } .drift .budge.over { color:#B23B3B; }
  .stat { display:flex; gap:40px; margin:40px 0 8px; padding:24px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
  .stat .n { font-size:40px; font-weight:700; letter-spacing:-0.02em; line-height:1; }
  .stat .l { color:var(--muted); font-size:13px; margin-top:6px; text-transform:uppercase; letter-spacing:0.04em; }
  section.file { margin-top:44px; }
  h3 { font-size:14px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-weight:600; margin:0 0 12px; display:flex; align-items:center; gap:10px; }
  h3 .count { background:var(--accent); color:#fff; font-size:11px; border-radius:999px; padding:1px 9px; font-weight:700; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted); font-weight:600; padding:0 10px 8px; border-bottom:1px solid var(--line); }
  td { padding:12px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
  td.ln { color:var(--muted); font-family:ui-monospace,monospace; font-size:13px; width:44px; }
  td.arr { color:var(--muted); text-align:center; width:22px; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }
  code.fix { color:var(--accent); font-weight:600; }
  .sw { display:inline-block; width:14px; height:14px; border-radius:4px; margin-right:8px; vertical-align:-2px; box-shadow:inset 0 0 0 1px rgba(0,0,0,0.12); }
  .tag { font-size:10px; text-transform:uppercase; letter-spacing:0.05em; font-weight:700; padding:2px 7px; border-radius:4px; }
  .tag-color { background:#EAF1FF; color:#1D4ED8; }
  .tag-space { background:#EEF2F0; color:#3F6152; }
  .tag-type { background:#F6EEF6; color:#8A3F7A; }
  .tag-component { background:#FBF0E9; color:#9A5B2B; }
  .badge { font-size:10px; text-transform:uppercase; letter-spacing:0.04em; border-radius:4px; padding:1px 6px; margin-left:4px; }
  .badge-drift { color:#A85A00; background:#FFF3E0; }
  .badge-off-scale { color:#7A4FB5; background:#F2ECFB; }
  .badge-hand-rolled { color:#9A5B2B; background:#FBEFE4; }
  .badge-div-as-button { color:#9A5B2B; background:#FBEFE4; }
  .pass { font-size:22px; font-weight:600; margin-top:40px; }
  section.propose { margin-top:56px; padding:28px 28px 8px; background:#F6FAF7; border:1px solid #DCEEE3; border-radius:12px; }
  section.propose h2 { font-size:18px; letter-spacing:-0.01em; margin:0 0 4px; display:flex; align-items:center; gap:10px; }
  section.propose .pcount { background:#2E7D55; color:#fff; font-size:12px; border-radius:999px; padding:1px 9px; font-weight:700; }
  .psub { color:var(--muted); margin:0 0 18px; max-width:64ch; font-size:14px; }
  td.uses { font-family:ui-monospace,monospace; color:var(--muted); font-size:13px; }
  td.pnote { color:var(--muted); font-size:13px; }
  footer { margin-top:64px; padding-top:20px; border-top:1px solid var(--line); color:var(--muted); font-size:13px; }
  @page { margin:16mm; }
  @media print {
    .wrap { padding:0; max-width:none; }
    tr, .drift, section.propose { break-inside:avoid; }
    section.file, h3 { break-inside:avoid; }
    a { color:inherit; text-decoration:none; }
  }
</style></head>
<body><div class="wrap">
  <header>
    <div class="brand">${esc(brand.productName)}</div>
    <h1>${esc(brand.reportTitle ?? 'Conformance report')}</h1>
    <p class="sub">${esc(brand.subtitle ?? '')}</p>
    <div class="meta">Token source: <code>${esc(meta.adapter)}</code> · ${meta.tokens} tokens · rules: ${esc(tags.join(', ') || '—')}</div>
  </header>
  ${driftBanner}
  ${findings.length ? `
  <div class="stat">
    ${stat(findings.length, 'Findings')}
    ${stat(files, `File${files === 1 ? '' : 's'} affected`)}
    ${tags.map(t => stat(findings.filter(f => f.tag === t).length, t)).join('')}
  </div>
  ${groups}` : `<p class="pass">${esc(brand.passMessage ?? 'On system. ✓')}</p>`}
  ${proposeSection}
  <footer>${esc(brand.footer ?? '')}</footer>
</div></body></html>`;
}
