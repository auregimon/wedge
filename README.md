# Wedge

A deterministic **design-system conformance linter**. It flags hardcoded values
in code that already exist as design tokens — *"you wrote `#2563EB`, that's
`color.brand`, use `var(--color-brand)`."* — with drift tolerance and semantic
alias resolution.

Brand-free engine, **bring-your-own token source**. White-label by design: the
engine is the licensed core, `brand.json` is the rebrand surface.

## Why this and not "good taste" linting

Generic taste rules (no purple gradients, no Inter) get absorbed by better base
models over time. **Your token graph cannot** — it's bespoke to each org. That's
the defensible wedge, and why this ships as embeddable infrastructure a design
consultancy or DS platform rebrands, not a single-brand SaaS.

## Run

```bash
node bin/wedge.mjs                 # uses wedge.config.json
node bin/wedge.mjs --source w3c    # override token source
npm run parity                     # same scan, all 4 sources -> identical findings
```

## TokenSource adapters

| adapter | format |
|---|---|
| `w3c` | W3C Design Tokens (`$value` tree) |
| `css-vars` | CSS custom properties (`:root { --color-brand: … }`) |
| `figma-export` | simple `{ name, value }` export |
| `figma-rest` | **live** Figma Variables REST API (`/v1/files/:key/variables/local`) |

### Live Figma

```bash
FIGMA_TOKEN=figd_… node bin/wedge.mjs --source figma-rest
```
Set `tokenSource.fileKey` in config. Requires the Figma Enterprise Variables
REST API; without a token it reads the captured-shape fixture.

## Architecture

```
bin/wedge.mjs        entry: config -> adapter -> engine -> report
src/engine.mjs       LICENSED CORE (brand-free): reverse index, drift tolerance, alias resolution
src/color.mjs        vendored color parsing (impeccable, Apache-2.0 — see NOTICE)
src/sources/         TokenSource adapters (BYO)
src/report/          text (CI) + html (handoff artifact), themed by brand.json
brand.json           THE REBRAND SURFACE
wedge.config.json    per-client: source, rules, scan globs
```

## Scan engines

`scan.engine` (or `--engine`): `auto` (default) picks by file type — CSS-family
files use a comment-stripped regex pass; JS/TS/JSX/TSX use an **AST scan**
(`@babel/parser`) that only flags colors in real style contexts (`style`/`sx`/`css`
objects, `styled`/`css` templates). Hexes in URLs, prose, Storybook titles,
non-style attributes, and comments are structurally ignored. `--engine regex`
forces the legacy whole-file pass (kept for comparison; it over-fires in TSX).

## Rules

| rule | flags | suggests |
|---|---|---|
| `literal-instead-of-token` | a hardcoded color that is (or drifts near) a token | the token `var()` |
| `space-off-scale` | a `padding`/`margin`/`gap` value off the spacing scale | nearest `space.*` |
| `type-off-scale` | a `font-size` off the type scale | nearest `font.size.*` |
| `handrolled-component` | a raw `<button>` etc. with inline style, or a `<div onClick>` surrogate, when a DS component exists | the DS `<Component>` |

Scale tokens are read by path convention: `space.*` / `spacing.*` and `font.size.*`.
`handrolled-component` is driven by a `components` registry in its rule config.

Waivers are **rule-scoped**: `// wedge-disable-line space-off-scale` silences only
that rule on that line; other rules still report.

## Token proposals (code → design)

The rules point design-system → code (*"use the token you have"*). `propose-token`
points the other way: it aggregates **recurring values the system doesn't cover**
across the whole scan and suggests new tokens — an off-palette color used 4×, a
`20px` gap that recurs between two scale steps. Enabled via `"propose": { "minUses": 3 }`.
This is the loop that makes the design system better, not just the code conformant.

## Drift budget (persistence)

With `"history": { "file": ".wedge/history.json" }`, each run is recorded — findings
by rule, proposals, and a **token-adoption %** (of the style decisions Wedge can see,
the fraction that honor the system). The report then shows adoption, the delta and a
sparkline since the last run, and a budget status. `"budget": { "maxFindings": 10 }`
makes a run exit non-zero when exceeded — a CI gate that ratchets drift down over time.
This is the layer that turns a linter into a product: the data compounds (calibration,
cross-tenant adoption baselines for a white-label platform).

## Status

Prototype. Four rules above. Roadmap: PR-comment + PDF report outputs;
`$type:dimension` detection; data-flow tracing for out-of-line style objects.
