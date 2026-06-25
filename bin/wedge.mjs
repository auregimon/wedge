#!/usr/bin/env node
// Wedge — design-system conformance linter. Brand-free engine, BYO token source.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { loadTokenSource } from '../src/sources/index.mjs';
import { buildTokenModel, extractCandidates, runRules, proposeTokens, computeStats } from '../src/engine.mjs';
import { loadHistory, appendRun, sparkline } from '../src/history.mjs';
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
const model = buildTokenModel(flat);
const engine = opt('--engine') ?? config.scan.engine ?? 'auto';

const scanFiles = opt('--file') ? [opt('--file')] : config.scan.include;
const findings = [];
const allCandidates = [];
for (const file of scanFiles) {
  const f = abs(file);
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const candidates = extractCandidates(rel(f), src, engine);
  findings.push(...runRules(rel(f), candidates, src, model, config.rules));
  allCandidates.push(...candidates);
}

// code → design: aggregate recurring off-system values into token proposals.
const proposals = config.propose ? proposeTokens(allCandidates, model, config.propose) : [];

// adoption: of the style decisions we can see, what fraction honors the system.
const stats = computeStats(allCandidates, model);

// drift budget: persist this run, compare to the last one, optionally gate.
const summary = { adoption: stats.adoption, examined: stats.examined, findingsTotal: findings.length };
if (config.history?.file) {
  const hfile = abs(config.history.file);
  const prior = loadHistory(hfile);
  const prev = prior[prior.length - 1] || null;
  let commit = null;
  try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a repo */ }
  const byTag = {};
  for (const f of findings) byTag[f.tag] = (byTag[f.tag] || 0) + 1;
  const record = { ts: new Date().toISOString(), commit, source: ts.adapter, files: scanFiles.length,
    findings: { total: findings.length, byTag }, proposals: proposals.length, adoption: stats.adoption };
  const hist = appendRun(hfile, record);
  summary.prev = prev;
  summary.delta = prev ? findings.length - prev.findings.total : null;
  summary.adoptionDelta = prev ? stats.adoption - prev.adoption : null;
  summary.trend = sparkline(hist.slice(-16).map(r => r.findings.total));
}
if (config.budget?.maxFindings != null) {
  summary.budget = { max: config.budget.maxFindings, value: findings.length, ok: findings.length <= config.budget.maxFindings };
}

const meta = { adapter: ts.adapter, tokens: model.colors.length + model.space.length + model.type.length };
console.log(renderText(findings, proposals, summary, brand, meta));

const htmlOut = opt('--html') ?? config.htmlOut;
if (htmlOut) {
  fs.writeFileSync(abs(htmlOut), renderHtml(findings, proposals, summary, brand, meta));
  console.log(`  HTML report → ${htmlOut}\n`);
}
if (argv.includes('--json')) console.log(JSON.stringify({ findings, proposals, summary }, null, 2));
process.exitCode = (summary.budget && !summary.budget.ok) || (findings.length && config.failOnFindings) ? 1 : 0;
