// Client codebase delivered for conformance sign-off.
// Brand-neutral on purpose — Wedge knows nothing about this client.
export function Button() {
  return (
    <div style={{ background: "#FFFFFF", borderColor: "#2563EB" }}>
      {/* exact matches -> color.paper, color.brand */}

      <h2 style={{ color: "#2663EB" }}>Heading</h2>
      {/* one channel off brand (#2563EB) -> should fire as drift */}

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
