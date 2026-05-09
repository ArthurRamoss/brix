"use client";

// /invest — Client-only entry point.
//
// The actual investor portal lives in `_client.tsx`. We disable SSR
// here via `next/dynamic` so the page never goes through hydration —
// it just renders client-side from the very first paint, reading the
// localStorage-cached vault/position state directly.
//
// Why no SSR: every value on this page (TVL, position KPIs, history)
// is per-user, behind login, and lives in localStorage. Server-rendering
// it would always emit `null` and trigger a hydration → re-render flash
// when the cached value lands. With `ssr: false` we render directly
// from the client cache and the user sees correct numbers from frame 1.
//
// Trade-off: ~50-100ms longer first paint of the page (waits for the
// JS chunk before rendering anything). Acceptable since SSR gave us
// nothing here — no SEO, no initial-byte performance, and the cache
// hydration was always client-only anyway.
//
// Deep links from /history with `?tab=...` still work; `_client.tsx`
// reads the query on mount and strips it.

import dynamic from "next/dynamic";

const InvestClient = dynamic(() => import("./_client"), { ssr: false });

export default function InvestPage() {
  return <InvestClient />;
}
