"use client";

// RecentEvents — compact list of recent vault_events.
//
// Shipped two flavors via props:
//   - <RecentEvents email={...} limit={5} compact />  → small card on /invest
//                                                       dashboard, /deposit,
//                                                       /withdraw
//   - <RecentEvents />                                 → full table on /history
//
// Click-through: each row links to Solana Explorer when tx hash exists. The
// whole component is also wrapped in a "see full history →" link when
// `showFullLink` is true.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listVaultEvents,
  type VaultEvent,
  type VaultEventKind,
} from "../../lib/agency-clients";
import { fmtBRZ } from "../../lib/mock-data";
import { I } from "../icons";
import { useT } from "../../lib/i18n";

type Props = {
  /** When set, filters to events for this user. Omit for global feed. */
  email?: string | null;
  /** Cap on number of rows fetched. */
  limit?: number;
  /** Render a denser row layout (used inside dashboards). */
  compact?: boolean;
  /** Render "see full history →" footer link. */
  showFullLink?: boolean;
  /** Override the destination of the footer link (default /history). */
  seeAllHref?: string;
  /** Optional kind filter. */
  kindFilter?: VaultEventKind | "all";
};

function formatRelative(ts: number, locale: string): string {
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return locale === "pt" ? "agora" : "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return locale === "pt" ? `há ${min} min` : `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return locale === "pt" ? `há ${h}h` : `${h}h ago`;
  const d = Math.round(h / 24);
  return locale === "pt" ? `há ${d}d` : `${d}d ago`;
}

export function RecentEvents({
  email,
  limit = 50,
  compact = false,
  showFullLink = false,
  seeAllHref = "/history",
  kindFilter = "all",
}: Props) {
  const { t, lang } = useT();
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listVaultEvents({
          email: email ?? undefined,
          limit,
        });
        if (!cancelled) {
          setEvents(list);
          setLoading(false);
        }
      } catch (err) {
        console.error("[RecentEvents] failed to load:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, limit]);

  const filtered = useMemo(() => {
    if (kindFilter === "all") return events;
    return events.filter((e) => e.kind === kindFilter);
  }, [events, kindFilter]);

  if (loading) {
    return (
      <div
        style={{
          padding: compact ? 16 : 32,
          textAlign: "center",
          color: "var(--fg-3)",
          fontSize: 13,
        }}
      >
        {t("inv_history_loading") as string}
      </div>
    );
  }

  return (
    <div>
      {filtered.length === 0 ? (
        <div
          style={{
            padding: compact ? 16 : 32,
            textAlign: "center",
            color: "var(--fg-3)",
            fontSize: 13,
          }}
        >
          {t("inv_history_empty") as string}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((e, i) => (
            <Row
              key={e.id}
              event={e}
              compact={compact}
              isLast={i === filtered.length - 1}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}
      {showFullLink && (
        <Link
          href={seeAllHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            justifyContent: "center",
            padding: "12px",
            fontSize: 12,
            color: "var(--fg-2)",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          {t("inv_history_see_all") as string} <I.arrow size={12} />
        </Link>
      )}
    </div>
  );
}

function Row({
  event,
  compact,
  isLast,
  lang,
  t,
}: {
  event: VaultEvent;
  compact: boolean;
  isLast: boolean;
  lang: string;
  t: (k: string) => unknown;
}) {
  const kindLabel = t(`inv_history_kind_${event.kind}`) as string;
  const sign =
    event.kind === "deposit" || event.kind === "repay" ? "+" : "-";
  const color =
    event.kind === "deposit" || event.kind === "repay"
      ? "var(--teal)"
      : event.kind === "fund"
        ? "var(--gold)"
        : "var(--fg-1)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: compact
          ? "auto 1fr auto auto"
          : "120px 1.4fr 110px 80px",
        gap: 12,
        padding: compact ? "10px 14px" : "12px 20px",
        fontSize: compact ? 12 : 13,
        borderBottom: isLast ? "none" : "1px solid var(--line-soft)",
        alignItems: "center",
      }}
    >
      <span
        className="mono"
        style={{ fontSize: compact ? 11 : 12, color: "var(--fg-2)" }}
      >
        {compact
          ? formatRelative(event.createdAt, lang)
          : new Date(event.createdAt).toLocaleString(
              lang === "pt" ? "pt-BR" : "en-US",
            )}
      </span>
      <span style={{ color: "var(--fg-1)" }}>{kindLabel}</span>
      <span
        className="mono"
        style={{ textAlign: "right", color, fontSize: compact ? 12 : 13 }}
      >
        {sign}
        {fmtBRZ(event.amountBrz)}
      </span>
      <span style={{ textAlign: "right" }}>
        {event.txSignature ? (
          <a
            href={`https://explorer.solana.com/tx/${event.txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--fg-2)",
              display: "inline-flex",
              gap: 4,
              alignItems: "center",
            }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <I.link size={10} />
            {event.txSignature.slice(0, 4)}…
          </a>
        ) : (
          <span style={{ color: "var(--fg-3)", fontSize: 11 }}>—</span>
        )}
      </span>
    </div>
  );
}
