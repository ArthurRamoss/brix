"use client";

// /history — Personal vault-event ledger.
//
// Filtered to the authenticated user's email. The AppShell tabs reflect the
// user's persona (invest/agency/landlord) so navigation is consistent with
// the rest of the app — clicking another tab routes to the persona's dashboard
// at the matching segment.
//
// Includes a kind filter (all / deposit / withdraw / fund / repay).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { AppShell, type Tab } from "../../components/shell/AppShell";
import { Card } from "../../components/primitives/Card";
import { RecentEvents } from "../../components/primitives/RecentEvents";
import { useT } from "../../lib/i18n";
import { getPersona, type Persona } from "../../lib/persona";
import type { VaultEventKind } from "../../lib/agency-clients";

type KindFilter = VaultEventKind | "all";

// Tabs as they appear in /invest and /agency dashboards. Used here so the
// AppShell looks identical from /history; clicking any tab routes back to
// the persona's main dashboard at that tab.
const INVEST_TABS: { id: string; label: string; route: string }[] = [
  { id: "vault", label: "vault", route: "/invest?tab=vault" },
  { id: "deposit", label: "depositar", route: "/invest?tab=deposit" },
  { id: "withdraw", label: "sacar", route: "/invest?tab=withdraw" },
  { id: "positions", label: "minha posição", route: "/invest?tab=positions" },
];

const AGENCY_TABS: { id: string; label: string; route: string }[] = [
  { id: "portfolio", label: "portfólio", route: "/agency?tab=portfolio" },
  { id: "clients", label: "clientes", route: "/agency?tab=clients" },
  { id: "register", label: "registrar recebível", route: "/agency?tab=register" },
  { id: "repay", label: "registrar repagamento", route: "/agency?tab=repay" },
];

export default function HistoryPage() {
  const { t } = useT();
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [hydrated, setHydrated] = useState(false);
  const [persona, setPersonaState] = useState<Persona | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    setPersonaState(getPersona());
    setHydrated(true);
  }, [ready, authenticated, router]);

  const email = useMemo(
    () =>
      user?.email?.address ??
      (
        user?.linkedAccounts.find((a) => a.type === "email") as
          | { address?: string }
          | undefined
      )?.address ??
      null,
    [user],
  );

  if (!hydrated) return null;

  const shellPersona: Persona =
    persona === "agency" || persona === "landlord" ? persona : "invest";

  // Build tabs to match the persona's dashboard. Clicking sends user back
  // to that route. Active tab stays empty — none of the dashboard tabs are
  // "current" while we're on /history; the title carries that meaning.
  const sourceTabs =
    shellPersona === "agency"
      ? AGENCY_TABS
      : shellPersona === "landlord"
        ? []
        : INVEST_TABS;
  const tabs: Tab[] = sourceTabs.map((tb) => ({ id: tb.id, label: tb.label }));

  const filters: { id: KindFilter; label: string }[] = [
    { id: "all", label: t("inv_history_filter_all") as string },
    { id: "deposit", label: t("inv_history_filter_deposit") as string },
    { id: "withdraw", label: t("inv_history_filter_withdraw") as string },
    { id: "fund", label: t("inv_history_filter_fund") as string },
    { id: "repay", label: t("inv_history_filter_repay") as string },
  ];

  return (
    <AppShell
      persona={shellPersona}
      tabs={tabs}
      activeTab=""
      setActiveTab={(id) => {
        const target = sourceTabs.find((tb) => tb.id === id);
        if (target) router.push(target.route);
      }}
    >
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
                color:
                  kindFilter === f.id ? "var(--fg-0)" : "var(--fg-2)",
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
    </AppShell>
  );
}
