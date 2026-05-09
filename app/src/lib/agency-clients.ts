"use client";

// Off-chain agency state — proprietários, imóveis, contratos.
//
// Persisted in Appwrite. All operations go through Next API routes
// (/api/agency/*) so the Appwrite API key stays server-side.
//
// Reads are wrapped in lib/cache.ts (20s TTL) so navigating between tabs
// doesn't refetch the same dataset and flash an empty state. Writes invalidate
// the relevant cache prefixes.
//
// Migration note (2026-05-08): this module used to be localStorage-only.
// Functions are now async (Promise<T>). Call sites must await + handle
// loading/error states.
//
// Modelo: 1 client → N properties → N contracts (cada contract aponta pra 1 property).

import { cached, invalidate } from "./cache";

export type AgencyStatus = "none" | "pending" | "approved";

export interface AgencyApplication {
  id?: string; // Appwrite $id (slug of email)
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  city?: string;
  contractsUnderManagement?: number;
  status: AgencyStatus;
  appliedAt: number;
  decidedAt?: number;
}

export interface AgencyClient {
  id: string;
  name: string;
  email: string; // case-insensitive lookup (Privy auth email)
  cpf?: string;
  phone?: string;
  pixKey?: string;
  notes?: string;
  agencyEmail?: string;
  createdAt: number;
}

export interface AgencyProperty {
  id: string;
  clientId: string;
  address: string;
  monthlyRentBrz: number;
  propertyType?: "apartment" | "house" | "commercial" | "other";
  notes?: string;
  createdAt: number;
}

export type AgencyContractStatus =
  | "pending"
  | "registered"
  | "funded"
  | "repaid"
  | "defaulted";

export interface AgencyContract {
  id: string;
  clientId: string; // denormalized for email lookup
  propertyId: string;
  landlordName: string; // denormalized for display
  propertyAddress: string;
  principalBrz: number;
  repaymentBrz: number;
  rateBps: number;
  durationDays: number;
  installmentsTotal: number;
  installmentsPaid: number;
  status: AgencyContractStatus;
  hasInsurance: boolean;
  insurer?: string;
  registerSig?: string;
  fundSig?: string;
  registeredAt: number;
  fundedAt?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => r.statusText);
    throw new Error(`API ${r.status}: ${text}`);
  }
  return r.json() as Promise<T>;
}

// ─── Agency status / application ────────────────────────────────────────────

export async function getAgencyApplication(
  email: string,
): Promise<AgencyApplication | null> {
  if (!email) return null;
  return cached(`apps:${email.toLowerCase()}`, () =>
    fetchJSON<AgencyApplication | null>(
      `/api/agency/applications?email=${encodeURIComponent(email)}`,
    ),
  );
}

export async function getAgencyStatus(email: string): Promise<AgencyStatus> {
  const app = await getAgencyApplication(email);
  return app?.status ?? "none";
}

export async function saveAgencyApplication(
  application: AgencyApplication,
): Promise<AgencyApplication> {
  const result = await fetchJSON<AgencyApplication>("/api/agency/applications", {
    method: "POST",
    body: JSON.stringify({
      ...application,
      appliedAt: application.appliedAt ?? Date.now(),
    }),
  });
  invalidate("apps:");
  return result;
}

export async function setAgencyStatus(
  email: string,
  status: AgencyStatus,
): Promise<AgencyApplication> {
  const result = await fetchJSON<AgencyApplication>(
    `/api/agency/applications?email=${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  invalidate("apps:");
  return result;
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function getClients(): Promise<AgencyClient[]> {
  return cached("clients:all", () =>
    fetchJSON<AgencyClient[]>("/api/agency/clients"),
  );
}

export async function getClientByEmail(
  email: string,
): Promise<AgencyClient | null> {
  if (!email) return null;
  return cached(`client:${email.toLowerCase()}`, () =>
    fetchJSON<AgencyClient | null>(
      `/api/agency/clients?email=${encodeURIComponent(email)}`,
    ),
  );
}

export async function getClientById(id: string): Promise<AgencyClient | null> {
  // No dedicated route today — filter from full list. Fine for MVP scale.
  if (!id) return null;
  const all = await getClients();
  return all.find((c) => c.id === id) ?? null;
}

export async function addClient(
  input: Omit<AgencyClient, "id" | "createdAt"> & { id?: string },
): Promise<AgencyClient> {
  const result = await fetchJSON<AgencyClient>("/api/agency/clients", {
    method: "POST",
    body: JSON.stringify({ ...input, createdAt: Date.now() }),
  });
  invalidate("clients:");
  invalidate("client:");
  return result;
}

// ─── Properties ─────────────────────────────────────────────────────────────

export async function getProperties(): Promise<AgencyProperty[]> {
  return cached("props:all", () =>
    fetchJSON<AgencyProperty[]>("/api/agency/properties"),
  );
}

export async function getPropertyById(
  id: string,
): Promise<AgencyProperty | null> {
  if (!id) return null;
  return cached(`prop:${id}`, () =>
    fetchJSON<AgencyProperty | null>(
      `/api/agency/properties?id=${encodeURIComponent(id)}`,
    ),
  );
}

export async function getPropertiesByClientId(
  clientId: string,
): Promise<AgencyProperty[]> {
  if (!clientId) return [];
  return cached(`props:client:${clientId}`, () =>
    fetchJSON<AgencyProperty[]>(
      `/api/agency/properties?clientId=${encodeURIComponent(clientId)}`,
    ),
  );
}

export async function addProperty(
  input: Omit<AgencyProperty, "id" | "createdAt">,
): Promise<AgencyProperty> {
  const result = await fetchJSON<AgencyProperty>("/api/agency/properties", {
    method: "POST",
    body: JSON.stringify({ ...input, createdAt: Date.now() }),
  });
  invalidate("props:");
  invalidate("prop:");
  return result;
}

// ─── Contracts ──────────────────────────────────────────────────────────────

export async function getAgencyContracts(): Promise<AgencyContract[]> {
  return cached("contracts:all", () =>
    fetchJSON<AgencyContract[]>("/api/agency/contracts"),
  );
}

export async function getContractsByClientId(
  clientId: string,
): Promise<AgencyContract[]> {
  if (!clientId) return [];
  return cached(`contracts:client:${clientId}`, () =>
    fetchJSON<AgencyContract[]>(
      `/api/agency/contracts?clientId=${encodeURIComponent(clientId)}`,
    ),
  );
}

export async function getContractsByPropertyId(
  propertyId: string,
): Promise<AgencyContract[]> {
  if (!propertyId) return [];
  // No dedicated route — filter client-side from full list. Ok for MVP scale.
  const all = await getAgencyContracts();
  return all.filter((c) => c.propertyId === propertyId);
}

export async function getContractsByEmail(
  email: string,
): Promise<AgencyContract[]> {
  if (!email) return [];
  return fetchJSON<AgencyContract[]>(
    `/api/agency/contracts?email=${encodeURIComponent(email)}`,
  );
}

export async function recordAgencyContract(
  c: AgencyContract,
): Promise<AgencyContract> {
  const result = await fetchJSON<AgencyContract>("/api/agency/contracts", {
    method: "POST",
    body: JSON.stringify(c),
  });
  invalidate("contracts:");
  return result;
}

export async function nextContractId(): Promise<string> {
  // Never cached — must be fresh to avoid collisions across rapid clicks.
  return fetchJSON<string>("/api/agency/contracts?nextId=true");
}

// ─── Vault events (off-chain history mirror) ────────────────────────────────

export type VaultEventKind = "deposit" | "withdraw" | "fund" | "repay";

export interface VaultEvent {
  id: string;
  investorEmail: string;
  investorPubkey: string;
  kind: VaultEventKind;
  amountBrz: number;
  txSignature?: string;
  contractId?: string;
  vaultTvlBrzAfter?: number;
  createdAt: number;
}

export async function listVaultEvents(opts?: {
  email?: string;
  limit?: number;
}): Promise<VaultEvent[]> {
  const params = new URLSearchParams();
  if (opts?.email) params.set("email", opts.email);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const cacheKey = `events:${opts?.email ?? "global"}:${opts?.limit ?? "default"}`;
  return cached(cacheKey, () => fetchJSON<VaultEvent[]>(`/api/vault-events${qs}`));
}

export async function recordVaultEvent(
  event: Omit<VaultEvent, "id" | "createdAt"> & { createdAt?: number },
): Promise<VaultEvent> {
  const result = await fetchJSON<VaultEvent>("/api/vault-events", {
    method: "POST",
    body: JSON.stringify({ ...event, createdAt: event.createdAt ?? Date.now() }),
  });
  invalidate("events:");
  return result;
}
