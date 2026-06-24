// Text scanners.
//  • cssScan: declaration-aware (colors + spacing lengths) for CSS-family files.
//  • legacyScan: old whole-line color-only regex (forced via --engine regex,
//    kept only to demonstrate the precision the AST scan buys).
import { stripComments, colorsIn, parseCssText } from './shared.mjs';

export function cssScan(src) {
  return parseCssText(stripComments(src), 0);
}

export function legacyScan(src) {
  const candidates = [];
  stripComments(src).split(/\r?\n/).forEach((line, i) => {
    for (const { raw } of colorsIn(line)) candidates.push({ kind: 'color', raw, line: i + 1 });
  });
  return candidates;
}
