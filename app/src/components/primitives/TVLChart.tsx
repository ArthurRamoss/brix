"use client";

// SVG TVL chart — minimal area + line plus optional projection.
// `series` is the realized history; `projection` is the forecasted continuation
// (rendered with a dashed stroke and lighter fill). Points use a shared
// vertical scale so the eye reads them as one trajectory.
// `mult` scales raw values to display units (default 0.001).

import { useT } from "../../lib/i18n";

export type TVLPoint = { d: number; value: number };

type TVLChartProps = {
  series: TVLPoint[];
  projection?: TVLPoint[];
  mult?: number;
};

export function TVLChart({ series, projection = [], mult = 0.001 }: TVLChartProps) {
  const w = 800;
  const h = 200;

  if (series.length === 0) {
    return <div style={{ height: h }} />;
  }

  const allValues = [
    ...series.map((s) => s.value * mult),
    ...projection.map((s) => s.value * mult),
  ];
  const max = Math.max(...allValues);
  const min = Math.min(...allValues) * 0.95;
  const denom = max - min || 1;

  // Combined index space: realized [0..series.length-1] then projection
  // immediately after. Both branches share the same X scale so the
  // projection visually continues from "today".
  const totalPoints = series.length + projection.length;
  const lastIdx = Math.max(1, totalPoints - 1);

  const toPoint = (s: TVLPoint, i: number): readonly [number, number] => {
    const x = (i / lastIdx) * w;
    const v = s.value * mult;
    const y = h - ((v - min) / denom) * h;
    return [x, Number.isNaN(y) ? h / 2 : y] as const;
  };

  const realPts = series.map((s, i) => toPoint(s, i));
  const projPts = projection.map((s, i) => toPoint(s, series.length + i));

  const realPath = realPts
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  const realArea = `${realPath} L${realPts[realPts.length - 1][0].toFixed(1)},${h} L0,${h} Z`;

  const lastReal = realPts[realPts.length - 1];
  const projPath =
    projPts.length > 0
      ? "M" + lastReal[0].toFixed(1) + "," + lastReal[1].toFixed(1) +
        " " +
        projPts
          .map((p) => "L" + p[0].toFixed(1) + "," + p[1].toFixed(1))
          .join(" ")
      : "";

  // Today marker — vertical dashed line at the boundary between real and
  // projected, but only when there's a projection to mark.
  const todayX = lastReal[0];

  return (
    <div style={{ marginTop: 20, position: "relative", height: h, width: "100%" }}>
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
        <path d={realArea} fill="url(#tvlfill)" />
        <path
          d={realPath}
          fill="none"
          stroke="oklch(0.78 0.12 195)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {projPts.length > 0 && (
          <>
            <line
              x1={todayX}
              x2={todayX}
              y1={0}
              y2={h}
              stroke="oklch(0.78 0.12 195)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <path
              d={projPath}
              fill="none"
              stroke="oklch(0.78 0.12 195)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 5"
              opacity={0.55}
            />
          </>
        )}
      </svg>
      <ChartXLabels hasProjection={projPts.length > 0} />
    </div>
  );
}

function ChartXLabels({ hasProjection = false }: { hasProjection?: boolean }) {
  const { t } = useT();
  if (hasProjection) {
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
        <span>{t("inv_chart_past") as string}</span>
        <span style={{ color: "var(--teal)" }}>
          {t("inv_chart_today") as string}
        </span>
        <span>{t("inv_chart_projected") as string}</span>
      </div>
    );
  }
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
