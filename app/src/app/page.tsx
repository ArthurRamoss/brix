"use client";

// Landing — full marketing surface ported from
// Brix-handoff/brix/project/landing.jsx.

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LandingNav } from "../components/shell/LandingNav";
import { Wordmark } from "../components/brand/Wordmark";
import { I } from "../components/icons";
import { useT } from "../lib/i18n";

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-0)", color: "var(--fg-0)" }}>
      <LandingNav />
      <Hero />
      <ImmutableRateBand />
      <DualAudience />
      <HowItWorks />
      <Traction />
      <Partners />
      <ContrastTable />
      <Footer />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  const { t } = useT();
  const [mode, setMode] = useState<"owner" | "investor">("owner");
  const headline =
    mode === "owner"
      ? [t("hero_owner_h1"), t("hero_owner_h2")]
      : [t("hero_inv_h1"), t("hero_inv_h2")];
  const sub = mode === "owner" ? t("hero_owner_sub") : t("hero_inv_sub");

  return (
    <section
      className="hero-section"
      style={{
        padding: "32px 48px 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="bg-grid"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          maskImage:
            "radial-gradient(ellipse at top, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at top, black 30%, transparent 70%)",
        }}
      />
      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            padding: 4,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 999,
            marginBottom: 36,
            fontSize: 13,
          }}
        >
          <button
            onClick={() => setMode("owner")}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: mode === "owner" ? "var(--gold)" : "transparent",
              color: mode === "owner" ? "oklch(0.18 0.02 75)" : "var(--fg-1)",
              fontWeight: mode === "owner" ? 600 : 400,
              transition: "background .2s, color .2s",
            }}
          >
            {t("hero_toggle_owner") as string}
          </button>
          <button
            onClick={() => setMode("investor")}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: mode === "investor" ? "var(--teal)" : "transparent",
              color:
                mode === "investor" ? "oklch(0.18 0.02 195)" : "var(--fg-1)",
              fontWeight: mode === "investor" ? 600 : 400,
              transition: "background .2s, color .2s",
            }}
          >
            {t("hero_toggle_investor") as string}
          </button>
        </div>

        <h1
          key={mode + (headline[0] as string)}
          className="fade-in"
          style={{
            fontSize: 88,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            fontWeight: 600,
            margin: 0,
            maxWidth: 920,
            textWrap: "pretty" as const,
          }}
        >
          <span style={{ color: "var(--fg-0)" }}>{headline[0] as string}</span>
          <br />
          <span
            style={{ color: mode === "owner" ? "var(--gold)" : "var(--teal)" }}
          >
            {headline[1] as string}
          </span>
        </h1>

        <p
          key={"p" + mode}
          className="fade-in"
          style={{
            fontSize: 20,
            color: "var(--fg-1)",
            maxWidth: 640,
            marginTop: 28,
            lineHeight: 1.5,
          }}
        >
          {sub as string}
        </p>

        <div
          style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}
        >
          <Link
            href="/login"
            className={
              mode === "owner"
                ? "btn btn-primary btn-lg"
                : "btn btn-teal btn-lg"
            }
          >
            {(mode === "owner" ? t("hero_owner_cta") : t("hero_inv_cta")) as string}
            <I.arrow size={18} />
          </Link>
          <Link href="/how" className="btn btn-secondary btn-lg">
            {t("hero_secondary_cta") as string}
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 32,
            marginTop: 88,
            paddingTop: 32,
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <Stat n="immutable" l={t("stat_protected") as string} />
          <Stat n="~20%" l={t("stat_apr_target") as string} />
          <Stat n="$ 4.5T" l={t("stat_credit_cut") as string} sub />
          <Stat n="0" l={t("stat_no_bait") as string} sub />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l, sub }: { n: string; l: string; sub?: boolean }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: sub ? "var(--fg-1)" : "var(--fg-0)",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--fg-2)",
          marginTop: 4,
          lineHeight: 1.3,
        }}
      >
        {l}
      </div>
    </div>
  );
}

// ─── Marquee band ──────────────────────────────────────────────────────────

function ImmutableRateBand() {
  const { t } = useT();
  return (
    <section
      style={{
        padding: "32px 48px",
        borderTop: "1px solid var(--line-soft)",
        borderBottom: "1px solid var(--line-soft)",
        background: "var(--bg-1)",
        overflow: "hidden",
      }}
    >
      <div
        className="mono"
        style={{
          display: "flex",
          gap: 48,
          whiteSpace: "nowrap",
          animation: "marquee 40s linear infinite",
          fontSize: 13,
          color: "var(--fg-2)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ display: "flex", gap: 48 }}>
            <span>{t("marq_program") as string}</span>
            <span style={{ color: "var(--gold)" }}>● {t("marq_locked") as string}</span>
            <span>{t("marq_brz") as string}</span>
            <span style={{ color: "var(--teal)" }}>● {t("marq_yield") as string}</span>
            <span>{t("marq_insurance") as string}</span>
            <span style={{ color: "var(--gold)" }}>● {t("marq_active") as string}</span>
            <span>{t("marq_city") as string}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
    </section>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────

function SectionLabel({ n, label }: { n: string; label: string }) {
  return (
    <div
      className="mono"
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        fontSize: 12,
        color: "var(--fg-2)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      <span style={{ color: "var(--fg-3)" }}>{n}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
      <span>{label}</span>
    </div>
  );
}

// ─── Dual audience ─────────────────────────────────────────────────────────

function DualAudience() {
  const { t } = useT();
  return (
    <section style={{ padding: "120px 48px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionLabel n="01" label={t("sec01_kicker") as string} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 32,
          }}
        >
          <AudienceCard
            tone="gold"
            kicker={t("aud_owner_kicker") as string}
            title={t("aud_owner_title") as string}
            bullets={[
              t("aud_owner_b1") as string,
              t("aud_owner_b2") as string,
              t("aud_owner_b3") as string,
            ]}
            stat={{
              n: t("aud_owner_stat_n") as string,
              l: t("aud_owner_stat_l") as string,
            }}
          />
          <AudienceCard
            tone="teal"
            kicker={t("aud_inv_kicker") as string}
            title={t("aud_inv_title") as string}
            bullets={[
              t("aud_inv_b1") as string,
              t("aud_inv_b2") as string,
              t("aud_inv_b3") as string,
            ]}
            stat={{
              n: t("aud_inv_stat_n") as string,
              l: t("aud_inv_stat_l") as string,
            }}
          />
        </div>
      </div>
    </section>
  );
}

type AudienceCardProps = {
  tone: "gold" | "teal";
  kicker: string;
  title: string;
  bullets: string[];
  stat: { n: string; l: string };
};

function AudienceCard({
  tone,
  kicker,
  title,
  bullets,
  stat,
}: AudienceCardProps) {
  const accent = tone === "gold" ? "var(--gold)" : "var(--teal)";
  const accentSoft = tone === "gold" ? "var(--gold-soft)" : "var(--teal-soft)";
  return (
    <div
      style={{
        padding: 32,
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent,
        }}
      />
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: accent,
          fontWeight: 500,
          marginBottom: 16,
        }}
      >
        {kicker}
      </div>
      <h3
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: 0,
          lineHeight: 1.15,
          textWrap: "pretty" as const,
        }}
      >
        {title}
      </h3>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {bullets.map((b, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 12,
              fontSize: 15,
              color: "var(--fg-1)",
            }}
          >
            <span style={{ color: accent, marginTop: 4 }}>—</span>
            <span style={{ flex: 1, lineHeight: 1.5 }}>{b}</span>
          </li>
        ))}
      </ul>
      <div
        className="mono"
        style={{
          marginTop: 28,
          padding: 16,
          background: accentSoft,
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 22, color: accent, fontWeight: 500 }}>
          {stat.n}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>
          {stat.l}
        </div>
      </div>
    </div>
  );
}

// ─── How it works (4 steps) ────────────────────────────────────────────────

function HowItWorks() {
  const { t } = useT();
  const steps = [
    { n: 1, t: t("how_s1_t") as string, d: t("how_s1_d") as string },
    { n: 2, t: t("how_s2_t") as string, d: t("how_s2_d") as string },
    { n: 3, t: t("how_s3_t") as string, d: t("how_s3_d") as string },
    { n: 4, t: t("how_s4_t") as string, d: t("how_s4_d") as string },
  ];
  return (
    <section
      style={{
        padding: "120px 48px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionLabel n="02" label={t("sec02_kicker") as string} />
        <h2
          style={{
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "24px 0 48px",
            maxWidth: 720,
            lineHeight: 1.05,
          }}
        >
          {t("how_h2") as string}
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
                padding: 28,
                background: "var(--bg-1)",
                minHeight: 200,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--gold)",
                  marginBottom: 28,
                }}
              >
                0{s.n}
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
      </div>
    </section>
  );
}

// ─── Traction ──────────────────────────────────────────────────────────────

function Traction() {
  const { t } = useT();
  return (
    <section
      style={{
        padding: "120px 48px",
        borderTop: "1px solid var(--line-soft)",
        background: "var(--bg-1)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionLabel n="03" label={t("sec03_kicker") as string} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            marginTop: 32,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 48,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {t("trac_h2") as string}
            </h2>
            <p
              style={{
                color: "var(--fg-1)",
                fontSize: 16,
                marginTop: 24,
                lineHeight: 1.6,
                maxWidth: 520,
              }}
            >
              {t("trac_p") as string}
            </p>
          </div>
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <TractionRow n="13M" l={t("trac_r1") as string} />
            <TractionRow n="30%" l={t("trac_r2") as string} />
            <TractionRow n="R$ 9,1bi" l={t("trac_r3") as string} />
            <TractionRow n="$ 4.5T" l={t("trac_r4") as string} />
            <TractionRow n="95%" l={t("trac_r5") as string} />
            <TractionRow n="~20%" l={t("trac_r6") as string} small />
          </div>
        </div>
      </div>
    </section>
  );
}

function TractionRow({
  n,
  l,
  small,
}: {
  n: string;
  l: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        paddingBottom: 16,
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: small ? 22 : 32,
          fontWeight: 500,
          color: "var(--gold)",
          minWidth: 110,
          letterSpacing: "-0.02em",
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 14, color: "var(--fg-1)" }}>{l}</div>
    </div>
  );
}

// ─── Partners ──────────────────────────────────────────────────────────────

function Partners() {
  const { t } = useT();
  return (
    <section
      style={{
        padding: "120px 48px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionLabel n="04" label={t("sec_partners_kicker") as string} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            marginTop: 32,
            alignItems: "start",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.1,
                textWrap: "pretty" as const,
              }}
            >
              {t("partners_h") as string}
            </h2>
            <p
              style={{
                color: "var(--fg-1)",
                fontSize: 15,
                marginTop: 20,
                lineHeight: 1.6,
                maxWidth: 460,
              }}
            >
              {t("partners_p") as string}
            </p>
          </div>
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)",
              padding: 32,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "var(--gold)",
              }}
            />
            <div
              className="mono"
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--gold)",
                fontWeight: 500,
                marginBottom: 24,
              }}
            >
              {t("partners_founding") as string}
            </div>
            <a
              href="https://selectimob.com.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex" }}
              aria-label="Selectimob"
            >
              <Image
                src="/select-logo.svg"
                alt="Selectimob"
                width={237}
                height={48}
                unoptimized
                style={{ height: 48, width: "auto" }}
              />
            </a>
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
                color: "var(--fg-1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--fg-2)" }}>role</span>
                <span>{t("partners_role") as string}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--fg-2)" }}>site</span>
                <a
                  href="https://selectimob.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--gold)",
                    textDecoration: "underline",
                  }}
                >
                  {t("partners_units") as string}
                </a>
              </div>
            </div>
            <div
              className="mono"
              style={{
                marginTop: 24,
                fontSize: 12,
                color: "var(--fg-3)",
              }}
            >
              + {t("partners_more") as string}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Contrast table ────────────────────────────────────────────────────────

function ContrastTable() {
  const { t } = useT();
  const rows = [
    t("cont_r1"),
    t("cont_r2"),
    t("cont_r3"),
    t("cont_r4"),
    t("cont_r5"),
    t("cont_r6"),
  ] as unknown as readonly string[][];

  return (
    <section
      style={{
        padding: "120px 48px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SectionLabel n="05" label={t("sec04_kicker") as string} />
        <h2
          style={{
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "24px 0 48px",
            maxWidth: 760,
            lineHeight: 1.05,
          }}
        >
          {t("cont_h2") as string}
        </h2>
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            background: "var(--bg-1)",
          }}
        >
          <div
            className="mono"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              background: "var(--bg-2)",
              fontSize: 12,
              color: "var(--fg-2)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <div style={{ padding: "16px 20px" }} />
            <div style={{ padding: "16px 20px", color: "var(--gold)" }}>
              {t("cont_col_brix") as string}
            </div>
            <div style={{ padding: "16px 20px" }}>
              {t("cont_col_other") as string}
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                borderTop: "1px solid var(--line-soft)",
                fontSize: 14,
              }}
            >
              <div style={{ padding: "18px 20px", color: "var(--fg-1)" }}>
                {r[0]}
              </div>
              <div
                className="mono"
                style={{ padding: "18px 20px", color: "var(--gold)" }}
              >
                {r[1]}
              </div>
              <div
                className="mono"
                style={{ padding: "18px 20px", color: "var(--fg-2)" }}
              >
                {r[2]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useT();
  return (
    <section
      style={{
        padding: "88px 48px 48px",
        borderTop: "1px solid var(--line-soft)",
        background: "var(--bg-1)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            margin: 0,
            lineHeight: 1,
            textWrap: "balance" as const,
          }}
        >
          {t("foot_h1") as string}
          <br />
          <span style={{ color: "var(--gold)" }}>{t("foot_h2") as string}</span>
        </h2>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 36,
            flexWrap: "wrap",
          }}
        >
          <Link href="/login" className="btn btn-primary btn-lg">
            {t("foot_cta_owner") as string} <I.arrow size={18} />
          </Link>
          <Link href="/login" className="btn btn-teal btn-lg">
            {t("foot_cta_inv") as string} <I.arrow size={18} />
          </Link>
        </div>
        <div
          className="mono"
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            gap: 16,
            fontSize: 12,
            color: "var(--fg-2)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Wordmark size={14} />
          <span style={{ marginLeft: "auto" }}>
            {t("foot_meta") as string}
          </span>
          <span>program: 6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94</span>
        </div>
      </div>
    </section>
  );
}
