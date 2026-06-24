// Terminal report — every human-facing string comes from brand.json.
const dim = s => `\x1b[2m${s}\x1b[0m`, bold = s => `\x1b[1m${s}\x1b[0m`;

export function renderText(findings, brand, meta) {
  const accent = s => `\x1b[38;5;${brand.accentTerm ?? 39}m${s}\x1b[0m`;
  const files = new Set(findings.map(f => f.file)).size;
  const out = ['', accent(`▍ ${brand.productName}`),
    dim(`  ${brand.reportTitle ?? 'conformance report'} · source: ${meta.adapter}`), ''];

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
  out.push(dim(`  ${brand.footer ?? ''}`), '');
  return out.join('\n');
}
