"use client";

// SVG TVL chart — minimal area + line. Series is `{ d: number; value: number }[]`,
// `mult` scales raw values to display units (default 0.001).
// X-axis labels come from i18n key `inv_chart_x`.
// Ported from Brix-handoff/brix/project/investor.jsx.

import { useT } from "../../lib/i18n";

export type TVLPoint = { d: number; value: number };

type TVLChartProps = {
  series: TVLPoint[];
  mult?: number;
};

export function TVLChart({ series, mult = 0.001 }: TVLChartProps) {
  const w = 800;
  const h = 160;

  if (series.length === 0) {
    return <div style={{ height: h }} />;
  }

  const values = series.map((s) => s.value * mult);
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.95;
  const denom = max - min || 1;

  const pts = series.map((s, i) => {
    const x = (i / (series.length - 1)) * w;
    const v = s.value * mult;
    const y = h - ((v - min) / denom) * h;
    return [x, Number.isNaN(y) ? h / 2 : y] as const;
  });

  const path = pts
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div style={{ marginTop: 24, position: "relative", height: h, width: "100%" }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="tvlfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.12 195)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.78 0.12 195)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1="0"
            x2={w}
            y1={h * p}
            y2={h * p}
            stroke="oklch(0.32 0.008 75)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}
        <path d={area} fill="url(#tvlfill)" />
        <path
          d={path}
          fill="none"
          stroke="oklch(0.78 0.12 195)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <ChartXLabels />
    </div>
  );
}

function ChartXLabels() {
  const { t } = useT();
  const labels = t("inv_chart_x") as unknown as string[];
  if (!Array.isArray(labels)) return null;
  return (
    <div
      className="mono"
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        color: "var(--fg-3)",
        marginTop: 6,
      }}
    >
      {labels.map((l, i) => (
        <span key={i}>{l}</span>
      ))}
    </div>
  );
}
