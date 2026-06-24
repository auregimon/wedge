// Client codebase delivered for conformance sign-off.
// Brand-neutral on purpose — Wedge knows nothing about this client.
export function Button() {
  return (
    <div style={{ background: "#FFFFFF", borderColor: "#2563EB", padding: 16, gap: 10 }}>
      {/* colors: paper + brand fire; padding 16 on-scale (silent); gap 10 off-scale (fires) */}

      <h2 style={{ color: "#2663EB", fontSize: 18 }}>Heading</h2>
      {/* color drift (#2563EB) + fontSize 18 off the type scale (nearest 16px) */}

      <p style={{ color: "var(--color-ink)" }}>Already tokenized — must NOT fire.</p>

      <span style={{ color: "rgb(220, 38, 38)" }}>Error</span>
      {/* equals color.red.600 -> semantic color.danger should win */}

      <a style={{ color: "#7C3AED" }}>Link</a>
      {/* off-system purple, not in tokens -> must NOT fire */}

      {/* prose mention of #2563EB inside a comment -> must NOT fire (FP fix) */}

      <button style={{ color: "#2563EB" }}> {/* wedge-disable literal-instead-of-token: documented brand exception */}
        Waived — must NOT fire.
      </button>
    </div>
  );
}
