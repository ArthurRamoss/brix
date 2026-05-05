"use client";

// /pub/invest — public marketing surface for investors.
// Ported from Brix-handoff/brix/project/public-pages.jsx PublicInvestor.

import Link from "next/link";
import { PublicNav } from "../../../components/shell/PublicNav";
import { PublicFooter } from "../../../components/shell/PublicFooter";
import { I } from "../../../components/icons";
import { useT } from "../../../lib/i18n";

export default function PublicInvestPage() {
  const { t } = useT();

  return (
    <div style={{ background: "var(--bg-0)", color: "var(--fg-0)" }}>
      <PublicNav tone="teal" />

      {/* Hero */}
      <section
        style={{
          padding: "96px 48px 100px",
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
              color: "var(--teal)",
              marginBottom: 20,
            }}
          >
            {t("pub_inv_kicker") as string}
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
            {t("pub_inv_h1_a") as string}
            <br />
            <span style={{ color: "var(--teal)" }}>
              {t("pub_inv_h1_b") as string}
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
            {t("pub_inv_sub") as string}
          </p>
          <Link
            href="/login"
            className="btn btn-teal btn-lg"
            style={{ marginTop: 32 }}
          >
            {t("pub_inv_cta") as string} <I.arrow size={18} />
          </Link>
        </div>
      </section>

      {/* Vault preview */}
      <section
        style={{
          padding: "80px 48px",
          borderTop: "1px solid var(--line-soft)",
          background: "var(--bg-1)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              margin: "0 0 36px",
              lineHeight: 1.1,
            }}
          >
            {t("pub_inv_preview_h") as string}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <VaultStat n="~20%" l={t("pub_inv_s1") as string} tone="teal" />
            <VaultStat n="85%" l={t("pub_inv_s2") as string} />
            <VaultStat n="0" l={t("pub_inv_s3") as string} />
            <VaultStat n="∞" l={t("pub_inv_s4") as string} />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section
        style={{
          padding: "80px 48px",
          borderTop: "1px solid var(--line-soft)",
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
                icon: <I.trending size={20} />,
                t: t("pub_inv_b1_t") as string,
                d: t("pub_inv_b1_d") as string,
              },
              {
                icon: <I.shieldCheck size={20} />,
                t: t("pub_inv_b2_t") as string,
                d: t("pub_inv_b2_d") as string,
              },
              {
                icon: <I.chart size={20} />,
                t: t("pub_inv_b3_t") as string,
                d: t("pub_inv_b3_d") as string,
              },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  padding: 28,
                  background: "var(--bg-1)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div style={{ color: "var(--teal)", marginBottom: 16 }}>
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

      {/* How vault works */}
      <section
        style={{
          padding: "80px 48px",
          borderTop: "1px solid var(--line-soft)",
          background: "var(--bg-1)",
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
            {t("pub_inv_how_h") as string}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              background: "var(--line-soft)",
              border: "1px solid var(--line-soft)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {[
              {
                n: "01",
                t: t("pub_inv_hw1_t") as string,
                d: t("pub_inv_hw1_d") as string,
              },
              {
                n: "02",
                t: t("pub_inv_hw2_t") as string,
                d: t("pub_inv_hw2_d") as string,
              },
              {
                n: "03",
                t: t("pub_inv_hw3_t") as string,
                d: t("pub_inv_hw3_d") as string,
              },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  padding: 28,
                  background: "var(--bg-0)",
                  minHeight: 180,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--teal)",
                    marginBottom: 20,
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
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
            <Link href="/login" className="btn btn-teal btn-lg">
              {t("pub_inv_cta") as string} <I.arrow size={18} />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter tone="teal" />
    </div>
  );
}

function VaultStat({
  n,
  l,
  tone,
}: {
  n: string;
  l: string;
  tone?: "teal";
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div
        className="mono"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: tone === "teal" ? "var(--teal)" : "var(--fg-0)",
          letterSpacing: "-0.02em",
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 6 }}>{l}</div>
    </div>
  );
}
