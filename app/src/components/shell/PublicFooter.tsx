"use client";

// CTA + meta footer used on every public page.
// Ported from Brix-handoff/brix/project/public-pages.jsx PublicFooter.

import Link from "next/link";
import { Wordmark } from "../brand/Wordmark";
import { I } from "../icons";
import { useT } from "../../lib/i18n";

type Tone = "gold" | "teal";

type PublicFooterProps = {
  tone: Tone;
};

export function PublicFooter({ tone }: PublicFooterProps) {
  const { t } = useT();
  const accent = tone === "teal" ? "var(--teal)" : "var(--gold)";
  const ctaClass =
    tone === "teal" ? "btn btn-teal btn-lg" : "btn btn-primary btn-lg";

  return (
    <section
      style={{
        padding: "72px 48px 40px",
        borderTop: "1px solid var(--line-soft)",
        background: "var(--bg-1)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            margin: 0,
            lineHeight: 1.05,
            textWrap: "balance" as const,
          }}
        >
          {t("foot_h1")}
          <br />
          <span style={{ color: accent }}>{t("foot_h2")}</span>
        </h2>
        <Link href="/login" className={ctaClass} style={{ marginTop: 28 }}>
          {t("nav_start")} <I.arrow size={18} />
        </Link>
        <div
          className="mono"
          style={{
            marginTop: 48,
            paddingTop: 20,
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
          <span style={{ marginLeft: "auto" }}>{t("foot_meta")}</span>
        </div>
      </div>
    </section>
  );
}
