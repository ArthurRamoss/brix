// Persona — type + localStorage helpers. The persona picker on /login
// persists this; AppShell + route guards read it.

export type Persona = "landlord" | "agency" | "invest";

const STORAGE_KEY = "brix_persona";

const isPersona = (v: unknown): v is Persona =>
  v === "landlord" || v === "agency" || v === "invest";

export function getPersona(): Persona | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isPersona(raw) ? raw : null;
}

export function setPersona(p: Persona) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, p);
}

export function clearPersona() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
