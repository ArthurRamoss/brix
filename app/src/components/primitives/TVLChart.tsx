"use client";

// SVG TVL chart — minimal area + line plus optional projection.
// `series` is the realized history; `projection` is the forecasted continuation
// (rendered with a dashed gold stroke). Points use a shared vertical scale so
// the eye reads them as one trajectory. `mult` scales raw values to display
// units (default 0.001). `height` lets the parent stretch the SVG to fill the
// card.

import { useT } from "../../lib/i18n";

export type TVLPoint = { d: number; value: number };

type TVLChartProps = {
  series: TVLPoint[];
  projection?: TVLPoint[];
  mult?: number;
  height?: number;
};

export function TVLChart({
  series,
  projection = [],
  mult = 0.001,
  height = 240,
}: TVLChartProps) {
  const w = 800;
  const h = height;

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

  // Time-based X scale: each point's `d` is its day offset (negative = past,
  // 0 = today, positive = projected). Mapping by `d` instead of array index
  // keeps realized and projected segments visually proportional to elapsed
  // and remaining time.
  const allDs = [...series.map((s) => s.d), ...projection.map((s) => s.d)];
  const dMin = Math.min(...allDs);
  const dMax = Math.max(...allDs);
  const dRange = dMax - dMin || 1;

  const toPoint = (s: TVLPoint): readonly [number, number] => {
    const x = ((s.d - dMin) / dRange) * w;
    const v = s.value * mult;
    const y = h - ((v - min) / denom) * h;
    return [x, Number.isNaN(y) ? h / 2 : y] as const;
  };

  const realPts = series.map((s) => toPoint(s));
  const projPts = projection.map((s) => toPoint(s));

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
    <div
      style={{
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <ChartLegend hasProjection={projPts.length > 0} />
      <div style={{ position: "relative", flex: 1, minHeight: h, width: "100%" }}>
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
            <linearGradient id="tvlfillproj" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.82 0.16 75)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="oklch(0.82 0.16 75)" stopOpacity="0" />
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
              {/* Soft gold area under the projection so it reads as a band, not
                  just a line. Mirrors the realized fill but in gold. */}
              <path
                d={`${projPath} L${projPts[projPts.length - 1][0].toFixed(1)},${h} L${lastReal[0].toFixed(1)},${h} Z`}
                fill="url(#tvlfillproj)"
              />
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
                stroke="oklch(0.82 0.16 75)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 5"
                opacity={0.95}
              />
            </>
          )}
        </svg>
        {projPts.length > 0 && (
          // HTML overlay so the "today" label isn't distorted by the SVG's
          // non-uniform preserveAspectRatio. Positioned by % of total width.
          <TodayPin pct={(todayX / w) * 100} />
        )}
      </div>
    </div>
  );
}

function TodayPin({ pct }: { pct: number }) {
  const { t } = useT();
  const flipLeft = pct > 85;
  return (
    <div
      className="mono"
      style={{
        position: "absolute",
        top: 4,
        left: `${pct}%`,
        transform: flipLeft ? "translateX(-100%)" : "translateX(0)",
        paddingLeft: flipLeft ? 0 : 6,
        paddingRight: flipLeft ? 6 : 0,
        fontSize: 10,
        color: "var(--teal)",
        opacity: 0.85,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {t("inv_chart_today") as string}
    </div>
  );
}

function ChartLegend({ hasProjection }: { hasProjection: boolean }) {
  const { t } = useT();
  return (
    <div
      className="mono"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontSize: 11,
        color: "var(--fg-2)",
        marginBottom: 8,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 14,
            height: 2,
            background: "var(--teal)",
            borderRadius: 1,
          }}
        />
        {t("inv_chart_legend_realized") as string}
      </span>
      {hasProjection && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 14,
              height: 2,
              backgroundImage:
                "repeating-linear-gradient(90deg, var(--gold) 0 4px, transparent 4px 7px)",
            }}
          />
          {t("inv_chart_legend_projected") as string}
        </span>
      )}
    </div>
  );
}
