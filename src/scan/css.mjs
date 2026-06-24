// Text scanners. For CSS-family files every value is a style value, so a
// comment-stripped regex pass is correct. `legacyScan` is the old whole-file
// regex (kept only to demonstrate the precision the AST scan buys).
import { stripComments, colorsIn } from './shared.mjs';

function scanLines(src) {
  const candidates = [];
  stripComments(src).split(/\r?\n/).forEach((line, i) => {
    for (const { raw } of colorsIn(line)) candidates.push({ raw, line: i + 1 });
  });
  return candidates;
}

export const cssScan = scanLines;     // .css / .scss / .less
export const legacyScan = scanLines;  // forced via --engine regex (over-fires in TSX)
