#!/usr/bin/env node
// Wedge — design-system conformance linter. Brand-free engine, BYO token source.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokenSource } from '../src/sources/index.mjs';
import { buildReverseIndex, literalInsteadOfToken } from '../src/engine.mjs';
import { renderText } from '../src/report/text.mjs';
import { renderHtml } from '../src/report/html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = p => path.resolve(ROOT, p);
const rel = p => path.relative(ROOT, p);

const config = JSON.parse(fs.readFileSync(abs('wedge.config.json'), 'utf8'));
const brand = JSON.parse(fs.readFileSync(abs(config.brand), 'utf8'));

const argv = process.argv.slice(2);
const opt = (name) => argv.includes(name) ? argv[argv.indexOf(name) + 1] : null;

// --source overrides the configured adapter (parity / multi-source demo).
const ts = { ...config.tokenSource };
const override = opt('--source');
if (override) { ts.adapter = override; ts.file = config.tokenSourceFiles?.[override] ?? ts.file; }

const flat = await loadTokenSource({ adapter: ts.adapter, ...ts, file: ts.file ? abs(ts.file) : undefined });
const index = buildReverseIndex(flat);
const tol = config.rules?.['literal-instead-of-token']?.tolerance ?? 6;

const findings = [];
for (const file of config.scan.include) {
  const f = abs(file);
  if (fs.existsSync(f)) findings.push(...literalInsteadOfToken(rel(f), fs.readFileSync(f, 'utf8'), index, tol));
}

const meta = { adapter: ts.adapter, tokens: index.length };
console.log(renderText(findings, brand, meta));

const htmlOut = opt('--html') ?? config.htmlOut;
if (htmlOut) {
  fs.writeFileSync(abs(htmlOut), renderHtml(findings, brand, meta));
  console.log(`  HTML report → ${htmlOut}\n`);
}
if (argv.includes('--json')) console.log(JSON.stringify(findings, null, 2));
process.exitCode = findings.length && config.failOnFindings ? 1 : 0;
