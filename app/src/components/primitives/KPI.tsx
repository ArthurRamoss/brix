// KPI card — label / value / sub. Tone controls value color (gold/green/default).
// `mono` switches the value to IBM Plex Mono with tnum.
// Ported from Brix-handoff/brix/project/landlord.jsx.

import type { ReactNode } from "react";

type Tone = "gold" | "green" | "default";

type KPIProps = {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  mono?: boolean;
};

export function KPI({ label, value, sub, tone = "default", mono }: KPIProps) {
  const valueColor =
    tone === "gold"
      ? "var(--gold)"
      : tone === "green"
        ? "var(--green)"
        : "var(--fg-0)";

  return (
    <div className="card" style={{ padding: 20 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--fg-2)",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        className={mono ? "mono tnum" : ""}
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: valueColor,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub !== undefined && sub !== null && (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--fg-2)",
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
