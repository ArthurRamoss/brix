// BrixLogo — 3 stacked bricks shifting right. Visual metaphor for monthly rent
// payments stacking into immediate liquidity. Ported from
// Brix-handoff/brix/project/shell.jsx.

type LogoProps = {
  size?: number;
  mono?: boolean;
};

export function Logo({ size = 28, mono = false }: LogoProps) {
  const c = mono ? "currentColor" : "var(--gold)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Brix"
    >
      <rect x="2" y="6" width="22" height="6" rx="1.2" fill={c} opacity="0.4" />
      <rect x="6" y="13" width="22" height="6" rx="1.2" fill={c} opacity="0.7" />
      <rect x="2" y="20" width="22" height="6" rx="1.2" fill={c} />
    </svg>
  );
}
