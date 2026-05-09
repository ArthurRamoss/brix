"use client";

// HistoryTab — reusable history view used as a tab inside /invest and /agency,
// and standalone at /history.
//
// Renders the kind filter row (all / deposits / withdraws / advances /
// repayments) plus a full-width events table filtered to the authenticated
// user's email. Same data source as RecentEvents; this is just the dense
// view with filters.

import { useState } from "react";
import { Card } from "./Card";
import { RecentEvents } from "./RecentEvents";
import { useT } from "../../lib/i18n";
import type { VaultEventKind } from "../../lib/agency-clients";

type KindFilter = VaultEventKind | "all";

export function HistoryTab({ email }: { email?: string | null }) {
  const { t } = useT();
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const filters: { id: KindFilter; label: string }[] = [
    { id: "all", label: t("inv_history_filter_all") as string },
    { id: "deposit", label: t("inv_history_filter_deposit") as string },
    { id: "withdraw", label: t("inv_history_filter_withdraw") as string },
    { id: "fund", label: t("inv_history_filter_fund") as string },
    { id: "repay", label: t("inv_history_filter_repay") as string },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 24px",
        }}
      >
        {t("inv_history_page_h") as string}
      </h1>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setKindFilter(f.id)}
            className="mono"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              borderRadius: 6,
              background:
                kindFilter === f.id ? "var(--bg-2)" : "transparent",
              color: kindFilter === f.id ? "var(--fg-0)" : "var(--fg-2)",
              border: "1px solid var(--line)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <RecentEvents
          email={email}
          limit={500}
          kindFilter={kindFilter}
        />
      </Card>
    </div>
  );
}
