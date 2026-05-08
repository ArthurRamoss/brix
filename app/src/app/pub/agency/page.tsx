"use client";

// /pub/agency — public marketing surface for agencies (Selectimob et al).
// Ported from Brix-handoff/brix/project/public-pages.jsx PublicAgency.

import Link from "next/link";
import { PublicNav } from "../../../components/shell/PublicNav";
import { PublicFooter } from "../../../components/shell/PublicFooter";
import { I } from "../../../components/icons";
import { useT } from "../../../lib/i18n";

export default function PublicAgencyPage() {
  const { t } = useT();

  const steps = [
    {
      n: "01",
      t: t("pub_ag_hw1_t") as string,
      d: t("pub_ag_hw1_d") as string,
    },
    {
      n: "02",
      t: t("pub_ag_hw2_t") as string,
      d: t("pub_ag_hw2_d") as string,
    },
    {
      n: "03",
      t: t("pub_ag_hw3_t") as string,
      d: t("pub_ag_hw3_d") as string,
    },
    {
      n: "04",
      t: t("pub_ag_hw4_t") as string,
      d: t("pub_ag_hw4_d") as string,
    },
  ];

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
            {t("pub_ag_kicker") as string}
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
            {t("pub_ag_h1_a") as string}
            <br />
            <span style={{ color: "var(--gold)" }}>
              {t("pub_ag_h1_b") as string}
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
            {t("pub_ag_sub") as string}
          </p>
          <Link
            href="/login"
            className="btn btn-primary btn-lg"
            style={{ marginTop: 32 }}
          >
            {t("pub_ag_cta") as string} <I.arrow size={18} />
          </Link>
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
                icon: <I.building size={20} />,
                t: t("pub_ag_b1_t") as string,
                d: t("pub_ag_b1_d") as string,
              },
              {
                icon: <I.lock size={20} />,
                t: t("pub_ag_b2_t") as string,
                d: t("pub_ag_b2_d") as string,
              },
              {
                icon: <I.wallet size={20} />,
                t: t("pub_ag_b3_t") as string,
                d: t("pub_ag_b3_d") as string,
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

      {/* How it works */}
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
              margin: "0 0 36px",
            }}
          >
            {t("pub_ag_how_h") as string}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              background: "var(--line-soft)",
              border: "1px solid var(--line-soft)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {steps.map((s) => (
              <div
                key={s.n}
                style={{
                  padding: 24,
                  background: "var(--bg-1)",
                  minHeight: 180,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--gold)",
                    marginBottom: 20,
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
                  {s.t}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--fg-1)",
                    lineHeight: 1.5,
                  }}
                >
                  {s.d}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/login" className="btn btn-primary btn-lg">
              {t("pub_ag_cta") as string} <I.arrow size={18} />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter tone="gold" />
    </div>
  );
}
