"use client";

// /landlord — Client-only entry point. See app/invest/page.tsx for the full
// rationale. Per-user, login-gated, cache-driven page → no SSR benefit; we
// disable it to skip the hydration → re-render flash.

import dynamic from "next/dynamic";

const LandlordClient = dynamic(() => import("./_client"), { ssr: false });

export default function LandlordPage() {
  return <LandlordClient />;
}
