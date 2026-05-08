"use client";

// /pub/landlord — public marketing surface for property owners.
// Ported from Brix-handoff/brix/project/public-pages.jsx PublicLandlord.

import Link from "next/link";
import { useState } from "react";
import { PublicNav } from "../../../components/shell/PublicNav";
import { PublicFooter } from "../../../components/shell/PublicFooter";
import { I } from "../../../components/icons";
import { useT } from "../../../lib/i18n";
import { fmtBRZ, fmtPct } from "../../../lib/mock-data";

export default function PublicLandlordPage() {
  const { t } = useT();
  const [rent, setRent] = useState(2400);
  const [months, setMonths] = useState(6);

  const apr = 0.18 + Math.max(0, months - 3) * 0.004;
  const total = rent * months;
  const fee = total * apr * (months / 12);
  const youGet = total - fee;

  return (
    <div style={{ background: "var(--bg-0)", color: "var(--fg-0)" }}>
      <PublicNav tone="gold" />

      {/* Hero */}
      <section
        style={{
          padding: "32px 48px 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="bg-grid"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.3,
            maskImage:
              "radial-gradient(ellipse at top, black 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at top, black 30%, transparent 70%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
          <div
            className="mono"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--gold)",
              marginBottom: 20,
            }}
          >
            {t("pub_ll_kicker") as string}
          </div>
          <h1
            style={{
              fontSize: 72,
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              fontWeight: 600,
              margin: 0,
              maxWidth: 800,
              textWrap: "pretty" as const,
            }}
          >
            {t("pub_ll_h1_a") as string}
            <br />
            <span style={{ color: "var(--gold)" }}>
              {t("pub_ll_h1_b") as string}
            </span>
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "var(--fg-1)",
              maxWidth: 580,
              marginTop: 24,
              lineHeight: 1.5,
            }}
          >
            {t("pub_ll_sub") as string}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section
        style={{
          padding: "80px 48px",
          borderTop: "1px solid var(--line-soft)",
          background: "var(--bg-1)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {[
              {
                icon: <I.lock size={20} />,
                t: t("pub_ll_b1_t") as string,
                d: t("pub_ll_b1_d") as string,
              },
              {
                icon: <I.zap size={20} />,
                t: t("pub_ll_b2_t") as string,
                d: t("pub_ll_b2_d") as string,
              },
              {
                icon: <I.shield size={20} />,
                t: t("pub_ll_b3_t") as string,
                d: t("pub_ll_b3_d") as string,
              },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  padding: 28,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  {b.icon}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  {b.t}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--fg-1)",
                    lineHeight: 1.5,
                  }}
                >
                  {b.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public simulator */}
      <section
        style={{
          padding: "80px 48px",
          borderTop: "1px solid var(--line-soft)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            {t("pub_ll_sim_h") as string}
          </h2>
          <p
            style={{
              color: "var(--fg-2)",
              fontSize: 15,
              margin: "0 0 36px",
              maxWidth: 520,
            }}
          >
            {t("pub_ll_sim_sub") as string}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            {/* Input */}
            <div className="card">
              <div style={{ marginBottom: 24 }}>
                <label className="label">{t("sim_rent_l") as string}</label>
                <div style={{ position: "relative" }}>
                  <span
                    className="mono"
                    style={{
                      position: "absolute",
                      left: 16,
                      top: 14,
                      color: "var(--fg-3)",
                      fontSize: 16,
                    }}
                  >
                    BRZ
                  </span>
                  <input
                    type="number"
                    value={rent}
                    onChange={(e) => setRent(+e.target.value || 0)}
                    className="field tnum mono"
                    style={{ paddingLeft: 56 }}
                  />
                </div>
                <input
                  type="range"
                  min={800}
                  max={12000}
                  step={100}
                  value={rent}
                  onChange={(e) => setRent(+e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    accentColor: "oklch(0.82 0.16 75)",
                  }}
                />
              </div>
              <div>
                <label className="label">{t("sim_months_l") as string}</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  {[3, 6, 8, 10, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonths(m)}
                      className="mono"
                      style={{
                        padding: "12px 0",
                        fontSize: 14,
                        fontWeight: 500,
                        background:
                          months === m ? "var(--gold)" : "var(--bg-2)",
                        color:
                          months === m
                            ? "oklch(0.18 0.02 75)"
                            : "var(--fg-1)",
                        border:
                          "1px solid " +
                          (months === m ? "var(--gold)" : "var(--line)"),
                        borderRadius: "var(--radius)",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result */}
            <div
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--gold)",
                borderRadius: "var(--radius-lg)",
                padding: 28,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                className="mono"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  padding: "6px 12px",
                  background: "var(--gold)",
                  color: "oklch(0.18 0.02 75)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottomLeftRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <I.lock size={12} /> {t("sim_immutable") as string}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                {t("sim_you_get") as string}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 48,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: "var(--gold)",
                  lineHeight: 1,
                }}
              >
                {fmtBRZ(youGet)}
              </div>

              <div
                className="mono"
                style={{
                  marginTop: 28,
                  paddingTop: 20,
                  borderTop: "1px solid var(--line-soft)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <SimRow
                  l={t("sim_r_assigned") as string}
                  r={`${months} × ${fmtBRZ(rent)}`}
                />
                <SimRow l={t("sim_r_total") as string} r={fmtBRZ(total)} />
                <SimRow l={t("sim_r_apr") as string} r={fmtPct(apr)} accent />
                <SimRow l={t("sim_r_cost") as string} r={"-" + fmtBRZ(fee)} />
              </div>

              <Link
                href="/login"
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {t("pub_ll_sim_cta") as string} <I.arrow size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter tone="gold" />
    </div>
  );
}

function SimRow({
  l,
  r,
  accent,
}: {
  l: string;
  r: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <span style={{ color: "var(--fg-2)" }}>{l}</span>
      <span
        style={{
          color: accent ? "var(--gold)" : "var(--fg-0)",
          fontWeight: accent ? 600 : 400,
        }}
      >
        {r}
      </span>
    </div>
  );
}
