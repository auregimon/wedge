// Recurring values the design system does NOT cover -> candidates for new tokens.
// This is the code -> design direction: propose-token aggregates these.
export function Gallery() {
  return (
    <div>
      {/* #7C3AED is off-palette (no near token) and used 3x -> propose a color token */}
      <span style={{ color: "#7C3AED" }}>One</span>
      <span style={{ color: "#7C3AED" }}>Two</span>
      <span style={{ color: "#7c3aed" }}>Three</span>

      {/* 20px is off the spacing scale (between 16 and 24) and used 3x -> propose a step */}
      <div style={{ gap: 20 }} />
      <div style={{ marginTop: 20 }} />
      <div style={{ padding: 20 }} />

      {/* 18px is off the type scale (between 16 and 20) and used 3x -> propose a step */}
      <h3 style={{ fontSize: 18 }}>X</h3>
      <h4 style={{ fontSize: 18 }}>Y</h4>
      <p style={{ fontSize: 18 }}>Z</p>
    </div>
  );
}
