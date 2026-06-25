# Wedge — Market Sizing

> Bottom-up TAM reconciled against a top-down anchor, deliberately conservative,
> fully sourced. Figures are directional estimates for a seed-stage thesis, not
> audited market data — the point is defensible math you can walk a partner through.

## Headline

| | Size | Basis |
|---|---|---|
| **TAM** | **~$1.2B** (→ ~$2.5B by 2030) | ~11M developers write UI code × ~$100/dev/yr blended ACV ≈ $1.1B, reconciled with the $1.2–1.7B static-code-analysis market (2026). |
| **SAM** | **~$430M** | ~3.3M of those devs are at orgs with a tokenized design system + git CI + budget (~30% of the universe) × ~$130/dev/yr. |
| **SOM** | **~$13M ARR** (5-yr target) | ~3% of SAM: ~2,000 paid teams (~$6K ACV) + a handful of OEM/platform partners (~$100–300K each), seeded by free-OSS distribution. |

## The wedge grows (why now)

- **AI is inflating the surface** — front-end job postings up ~15%/yr; AI coding
  assistants 10×'d UI-code volume. More off-system code to enforce, every year.
- **Design systems are now standard** — 65% of companies run one (Forrester);
  each is a code-side enforcement gap with no incumbent.
- **Design infra is venture-scale** — Figma: $1.06B revenue (FY25), 136% net
  retention, 1,405 orgs spending >$100K/yr. Willingness-to-pay for design tooling
  is proven; conformance is an unserved layer of it.

## The math (defensible walk-through)

### Universe → TAM
- **28.7M** professional developers worldwide (Statista, 2025).
- Developers who write UI code ≈ front-end (6.6%) + full-stack (33.5%) ≈ **40% →
  ~11M** (Stack Overflow specialization split). Conservative note: pure front-end
  alone is only ~1.9M, but full-stack devs ship UI too — they are whose pull
  requests Wedge scans.
- Blended ACV **$100/dev/yr** — set deliberately *below* developer-security comps
  (Snyk Team $300/dev/yr, Enterprise $700–950; SonarQube $10–35K/instance),
  because conformance is a quality tool, not security.
- **11M × $100 = ~$1.1B**, and the independent top-down anchor — the
  static-code-analysis market at **$1.2–1.7B (2026), → ~$2.8B by 2035** — lands in
  the same range. Two methods agreeing is the credibility.

### TAM → SAM
Restrict to teams that can actually buy: a *real, tokenized* design system (not
just a component library), git-based CI (GitHub/GitLab), and budget. That is
~30% of the UI-dev universe (~3.3M devs) at a slightly higher **~$130/dev/yr**
(serviceable buyers skew team + enterprise) ≈ **~$430M**.

### SAM → SOM
Bottoms-up via the open-source funnel: free CLI installs → team conversion + OEM
deals. ~3% of SAM over five years ≈ **~$13M ARR**. A target, not a claim.

### Upside not in the per-seat number
OEM / platform deals with design-system platforms run on $100K+ contract norms
(Figma alone has 1,405 orgs at that level) — a parallel revenue layer on top of
per-seat pricing, harder to size pre-traction so excluded from the headline TAM.

## Load-bearing assumptions (where to push)

- **$100/dev/yr ACV** drives everything. Conservative vs. comps by design; defend
  as "below Snyk because we are quality, not security."
- **Per-seat is the spine** because it is the most defensible; the OEM/platform
  model is likely larger but is framed as upside until there is traction to size it.
- **The 65% design-system adoption stat is Forrester (2020)** — the most-cited
  figure but dated; swap in a fresher number from the zeroheight 2025 report when
  finalizing.

## Sources

- Global developer population — Statista, 2025: <https://www.statista.com/statistics/627312/worldwide-developer-population/>
- Developer specialization split — Stack Overflow Developer Survey
- Static code analysis market — The Business Research Company / Business Research Insights, 2026
- Design-system adoption (65%) — Forrester (2020), via zeroheight Design Systems Report 2025: <https://zeroheight.com/resource/design-system-report-2025/>
- Comparable pricing — Snyk (Team $25/dev/mo; Enterprise $697–948/dev/yr), SonarQube (LOC-based, $10–35K/instance)
- Design-tooling willingness-to-pay — Figma FY2025 results ($1.06B revenue, 136% NDR, 1,405 orgs >$100K): <https://investor.figma.com/financials/quarterly-results/default.aspx>
