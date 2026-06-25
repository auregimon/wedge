// Terminal report — every human-facing string comes from brand.json.
const dim = s => `\x1b[2m${s}\x1b[0m`, bold = s => `\x1b[1m${s}\x1b[0m`;

export function renderText(findings, proposals, summary, brand, meta) {
  const accent = s => `\x1b[38;5;${brand.accentTerm ?? 39}m${s}\x1b[0m`;
  const files = new Set(findings.map(f => f.file)).size;
  const out = ['', accent(`▍ ${brand.productName}`),
    dim(`  ${brand.reportTitle ?? 'conformance report'} · source: ${meta.adapter}`), ''];

  if (summary) {
    const pct = (summary.adoption * 100).toFixed(0);
    const aDelta = summary.adoptionDelta != null
      ? ` (${summary.adoptionDelta >= 0 ? '▲' : '▼'}${Math.abs(summary.adoptionDelta * 100).toFixed(0)} pts)` : '';
    out.push(bold(`  Token adoption ${pct}%`) + dim(aDelta) + dim(`   ${summary.examined} style values examined`));
    if (summary.delta != null) {
      const since = summary.prev ? new Date(summary.prev.ts).toISOString().slice(0, 10) : '';
      const arrow = summary.delta <= 0 ? '▼' : '▲';
      out.push(dim(`  Drift  ${summary.findingsTotal} findings  ${arrow}${Math.abs(summary.delta)} since ${since}  ${summary.trend}`));
    }
    if (summary.budget) {
      const tag = summary.budget.ok ? '✓ within budget' : '✗ OVER BUDGET';
      out.push((summary.budget.ok ? dim : accent)(`  Budget ${summary.budget.value}/${summary.budget.max}  ${tag}`));
    }
    out.push('');
  }

  if (!findings.length) {
    out.push('  ' + (brand.passMessage ?? 'On system. ✓'));
  } else {
    out.push(bold(`  ${findings.length} finding${findings.length === 1 ? '' : 's'} across ${files} file${files === 1 ? '' : 's'}`));
    out.push(dim(`  ${brand.subtitle ?? ''}`), '');
    const byFile = {};
    for (const f of findings) (byFile[f.file] ??= []).push(f);
    for (const [file, fs_] of Object.entries(byFile)) {
      out.push(`  ${file}`);
      for (const f of fs_) {
        const also = f.also?.length ? dim(`  [also: ${f.also.join(', ')}]`) : '';
        const badge = f.badge ? dim(` (${f.badge})`) : '';
        out.push(dim(`    ${String(f.line).padStart(3)}  `) +
          dim(`${f.tag.padEnd(5)} `) + `${f.found} ${f.rel} ${f.target}${badge} ⟶ ${f.fix}` + also);
      }
      out.push('');
    }
  }
  if (proposals?.length) {
    out.push(accent(`  ↑ Proposed additions to the design system (${proposals.length})`));
    out.push(dim('  Recurring values not covered by the system — candidates for new tokens.'), '');
    for (const p of proposals) {
      out.push(dim('    ') + `${p.tag.padEnd(7)} ${p.value.padEnd(16)} ×${String(p.count).padEnd(3)} add as ${p.suggest}  ` + dim(`(${p.note})`));
    }
    out.push('');
  }
  out.push(dim(`  ${brand.footer ?? ''}`), '');
  return out.join('\n');
}
