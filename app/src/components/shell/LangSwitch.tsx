"use client";

// PT/EN segmented toggle. Persists via i18n's LangProvider.
// Ported from Brix-handoff/brix/project/landing.jsx LangSwitch.

import { useT, type Lang } from "../../lib/i18n";

const LANGS: Lang[] = ["pt", "en"];

export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div
      className="mono"
      style={{
        display: "inline-flex",
        padding: 3,
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        borderRadius: 999,
        fontSize: 11,
      }}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "4px 9px",
            borderRadius: 999,
            background: lang === l ? "var(--fg-0)" : "transparent",
            color: lang === l ? "var(--bg-0)" : "var(--fg-2)",
            fontWeight: lang === l ? 600 : 400,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
