"use client";

// /how — three persona flows (landlord, agency, investor) with steps.
// Ported from Brix-handoff/brix/project/how.jsx.

import Link from "next/link";
import { LandingNav } from "../../components/shell/LandingNav";
import { I } from "../../components/icons";
import { useT } from "../../lib/i18n";

type Flow = {
  key: "landlord" | "agency" | "investor";
  tone: "gold" | "teal";
  kicker: string;
  title: string;
  steps: readonly string[];
};

export default function HowPage() {
  const { t } = useT();

  const tryAsFn = t("how_try_as") as unknown as (kicker: string) => string;

  const flows: Flow[] = [
    {
      key: "landlord",
      tone: "gold",
      kicker: t("how_p1_kicker") as string,
      title: t("how_p1_t") as string,
      steps: t("how_p1_s") as unknown as readonly string[],
    },
    {
      key: "agency",
      tone: "gold",
      kicker: t("how_p2_kicker") as string,
      title: t("how_p2_t") as string,
      steps: t("how_p2_s") as unknown as readonly string[],
    },
    {
      key: "investor",
      tone: "teal",
      kicker: t("how_p3_kicker") as string,
      title: t("how_p3_t") as string,
      steps: t("how_p3_s") as unknown as readonly string[],
    },
  ];

  return (
    <div style={{ background: "var(--bg-0)", color: "var(--fg-0)" }}>
      <LandingNav />
      <section style={{ padding: "88px 32px 64px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              margin: "0 0 28px",
              lineHeight: 1.05,
              maxWidth: 880,
              textWrap: "pretty" as const,
            }}
          >
            {t("how_page_h1_a") as string}{" "}
            <span style={{ color: "var(--gold)" }}>
              {t("how_page_h1_b") as string}
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--fg-1)",
              maxWidth: 680,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {t("how_page_p") as string}
          </p>
        </div>
      </section>

      {flows.map((f, i) => (
        <section
          key={f.key}
          style={{
            padding: "72px 32px",
            borderTop: "1px solid var(--line-soft)",
            background: i % 2 === 0 ? "var(--bg-1)" : "var(--bg-0)",
          }}
        >
          <div
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr",
              gap: 64,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: f.tone === "gold" ? "var(--gold)" : "var(--teal)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 16,
                }}
              >
                0{i + 1} · {f.kicker}
              </div>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  margin: 0,
                  lineHeight: 1.1,
                  textWrap: "pretty" as const,
                }}
              >
                {f.title}
              </h2>
              <Link
                href="/login"
                className={f.tone === "gold" ? "btn btn-primary" : "btn btn-teal"}
                style={{ marginTop: 24 }}
              >
                {tryAsFn(f.kicker)} <I.arrow size={14} />
              </Link>
            </div>
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {f.steps.map((s, j) => (
                <li
                  key={j}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "18px 0",
                    borderBottom:
                      j < f.steps.length - 1
                        ? "1px solid var(--line-soft)"
                        : "none",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      color: f.tone === "gold" ? "var(--gold)" : "var(--teal)",
                      minWidth: 24,
                      paddingTop: 2,
                    }}
                  >
                    {String(j + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      color: "var(--fg-1)",
                      lineHeight: 1.5,
                    }}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
