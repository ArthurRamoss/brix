"use client";

// Agency state — proprietários, imóveis, contratos.
// Off-chain only no MVP: a imobiliária mantém um cadastro privado (este store)
// e quando antecipa um contrato faz on-chain via use-agency. O store off-chain
// existe pra UI poder linkar contratos a clientes via email.
//
// Modelo: 1 client → N properties → N contracts (cada contract aponta pra 1 property).

export type AgencyStatus = "none" | "pending" | "approved";

export interface AgencyApplication {
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  city?: string;
  contractsUnderManagement?: number;
  appliedAt: number;
}

export interface AgencyClient {
  id: string;
  name: string;
  email: string; // case-insensitive lookup (Privy auth email)
  cpf?: string;
  phone?: string;
  pixKey?: string;
  notes?: string;
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

// Bumped to v2 when client/property model split (was bundled into one entity).
// Old keys are left orphaned in localStorage so historical sessions are cleanly
// ignored — new flow starts with an empty roster.
const KEY_STATUS = "brix_agency_status_v2";
const KEY_APP = "brix_agency_application_v2";
const KEY_CLIENTS = "brix_agency_clients_v2";
const KEY_PROPS = "brix_agency_properties_v2";
const KEY_CONTRACTS = "brix_agency_contracts_v2";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ─── Agency status ──────────────────────────────────────────────────────────

export function getAgencyStatus(): AgencyStatus {
  if (typeof window === "undefined") return "none";
  const raw = window.localStorage.getItem(KEY_STATUS);
  if (raw === "pending" || raw === "approved") return raw;
  return "none";
}

export function setAgencyStatus(status: AgencyStatus) {
  if (typeof window === "undefined") return;
  if (status === "none") {
    window.localStorage.removeItem(KEY_STATUS);
  } else {
    window.localStorage.setItem(KEY_STATUS, status);
  }
}

export function getAgencyApplication(): AgencyApplication | null {
  return readJSON<AgencyApplication | null>(KEY_APP, null);
}

export function saveAgencyApplication(app: AgencyApplication) {
  writeJSON(KEY_APP, app);
}

// ─── Clients ────────────────────────────────────────────────────────────────

export function getClients(): AgencyClient[] {
  return readJSON<AgencyClient[]>(KEY_CLIENTS, []);
}

export function getClientById(id: string): AgencyClient | null {
  return getClients().find((c) => c.id === id) ?? null;
}

export function getClientByEmail(email: string): AgencyClient | null {
  const target = email.trim().toLowerCase();
  if (!target) return null;
  return (
    getClients().find((c) => c.email.toLowerCase() === target) ?? null
  );
}

function slugifyEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function addClient(
  input: Omit<AgencyClient, "id" | "createdAt"> & { id?: string },
): AgencyClient {
  const list = getClients();
  const id =
    input.id ||
    `${slugifyEmail(input.email)}-${Math.random().toString(36).slice(2, 6)}`;
  const client: AgencyClient = { ...input, id, createdAt: Date.now() };
  const existing = list.findIndex(
    (c) => c.email.toLowerCase() === input.email.toLowerCase(),
  );
  const next = [...list];
  if (existing >= 0) next[existing] = client;
  else next.unshift(client);
  writeJSON(KEY_CLIENTS, next);
  return client;
}

// ─── Properties ─────────────────────────────────────────────────────────────

export function getProperties(): AgencyProperty[] {
  return readJSON<AgencyProperty[]>(KEY_PROPS, []);
}

export function getPropertyById(id: string): AgencyProperty | null {
  return getProperties().find((p) => p.id === id) ?? null;
}

export function getPropertiesByClientId(clientId: string): AgencyProperty[] {
  return getProperties().filter((p) => p.clientId === clientId);
}

export function addProperty(
  input: Omit<AgencyProperty, "id" | "createdAt">,
): AgencyProperty {
  const list = getProperties();
  const id = `prop-${Math.random().toString(36).slice(2, 8)}`;
  const property: AgencyProperty = { ...input, id, createdAt: Date.now() };
  const next = [property, ...list];
  writeJSON(KEY_PROPS, next);
  return property;
}

// ─── Contracts ──────────────────────────────────────────────────────────────

export function getAgencyContracts(): AgencyContract[] {
  return readJSON<AgencyContract[]>(KEY_CONTRACTS, []);
}

export function getContractsByClientId(clientId: string): AgencyContract[] {
  return getAgencyContracts().filter((c) => c.clientId === clientId);
}

export function getContractsByPropertyId(propertyId: string): AgencyContract[] {
  return getAgencyContracts().filter((c) => c.propertyId === propertyId);
}

export function getContractsByEmail(email: string): AgencyContract[] {
  const client = getClientByEmail(email);
  if (!client) return [];
  return getContractsByClientId(client.id);
}

export function recordAgencyContract(c: AgencyContract) {
  const list = getAgencyContracts();
  const idx = list.findIndex((x) => x.id === c.id);
  const next = [...list];
  if (idx >= 0) next[idx] = c;
  else next.unshift(c);
  writeJSON(KEY_CONTRACTS, next);
}

export function nextContractId(): string {
  const existing = getAgencyContracts();
  const n = existing.length + 1;
  return `BRX-2026-${String(n).padStart(4, "0")}`;
}

// ─── Demo helpers ──────────────────────────────────────────────────────────

export function resetAllAgencyData() {
  if (typeof window === "undefined") return;
  for (const k of [KEY_STATUS, KEY_APP, KEY_CLIENTS, KEY_PROPS, KEY_CONTRACTS]) {
    window.localStorage.removeItem(k);
  }
}
