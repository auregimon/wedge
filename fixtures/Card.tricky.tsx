import styled from 'styled-components';

// ── Incidental hexes that are NOT style values — must NOT fire ──
const DOCS_URL = "https://brand.example/guide#2563EB";   // URL hash fragment
const HELP_TEXT = "Use #2563EB across the brand";        // prose inside a string
export const meta = { title: "Tokens / #2563EB demo" };  // Storybook story title

// ── Real style values — must fire ──
export const Badge = styled.span`
  color: #2563EB;
  background: #2663EB;
`;

export function Card() {
  return (
    <div
      style={{ background: "#FFFFFF", color: "rgb(220, 38, 38)" }}
      title="#2563EB"
      data-tooltip="border #2563EB"
    >
      <p style={{ color: "var(--color-ink)" }}>tokenized — no fire</p>
      <button style={{ color: "#2563EB" }}>{/* wedge-disable-line literal-instead-of-token */}
        waived — no fire
      </button>
    </div>
  );
}
