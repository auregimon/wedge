// GitHub-flavored markdown report — for posting as a PR comment.
// Leads with the marker line so the poster can find & update it (sticky comment).
export const MARKER = '<!-- wedge-report -->';

const esc = s => String(s).replace(/\|/g, '\\|'); // escape pipes for tables

export function renderMarkdown(findings, proposals, summary, brand, meta) {
  const L = [MARKER, `### ${brand.productName} — Wedge conformance`, ''];

  if (summary) {
    const parts = [`**Token adoption ${(summary.adoption * 100).toFixed(0)}%**` +
      (summary.adoptionDelta != null ? ` ${summary.adoptionDelta >= 0 ? '▲' : '▼'}${Math.abs(summary.adoptionDelta * 100).toFixed(0)} pts` : '')];
    parts.push(summary.delta != null
      ? `${summary.findingsTotal} findings ${summary.delta <= 0 ? '▼' : '▲'}${Math.abs(summary.delta)} since last run`
      : `${summary.findingsTotal} findings`);
    if (summary.budget) parts.push(`Budget ${summary.budget.value}/${summary.budget.max} ${summary.budget.ok ? '✅ within' : '❌ OVER'}`);
    L.push(parts.join(' · '), '');
    if (summary.budget && !summary.budget.ok) L.push(`> ❌ **Drift budget exceeded** — this check fails until findings are at or below ${summary.budget.max}.`, '');
  }

  if (findings.length) {
    const byFile = {};
    for (const f of findings) (byFile[f.file] ??= []).push(f);
    const open = summary?.budget && !summary.budget.ok ? ' open' : '';
    L.push(`<details${open}><summary><b>${findings.length} findings across ${Object.keys(byFile).length} file(s)</b></summary>`, '');
    for (const [file, fs_] of Object.entries(byFile)) {
      L.push(`<b><code>${esc(file)}</code></b>`, '', '| Line | Rule | Found | | Token | Replace with |', '|--:|:--|:--|:-:|:--|:--|');
      for (const f of fs_) L.push(`| ${f.line} | ${f.tag} | \`${esc(f.found)}\` | ${f.rel} | \`${esc(f.target)}\`${f.badge ? ` _${esc(f.badge)}_` : ''} | \`${esc(f.fix)}\` |`);
      L.push('');
    }
    L.push('</details>', '');
  } else {
    L.push(`✅ ${brand.passMessage ?? 'All style values map to tokens.'}`, '');
  }

  if (proposals?.length) {
    L.push(`<details><summary><b>↑ ${proposals.length} proposed additions to the design system</b></summary>`, '',
      '| Type | Value | Uses | Suggested token | Note |', '|:--|:--|--:|:--|:--|');
    for (const p of proposals) L.push(`| ${p.kind} | \`${esc(p.value)}\` | ×${p.count} | \`${esc(p.suggest)}\` | ${esc(p.note)} |`);
    L.push('', '</details>', '');
  }

  L.push(`<sub>Wedge · source: \`${esc(meta.adapter)}\` · ${meta.tokens} tokens${summary?.trend ? ` · trend \`${summary.trend}\`` : ''}</sub>`);
  return L.join('\n');
}
