// Persona — type + localStorage helpers. The persona picker on /login
// persists this; AppShell + route guards read it.
//
// Two keys:
//   brix_persona               → current session persona, cleared on logout.
//   brix_user_persona::<email> → email→persona lock, survives logout.
//                                Enforces "1 email = 1 persona" on /login.

export type Persona = "landlord" | "agency" | "invest";

const STORAGE_KEY = "brix_persona";
const EMAIL_KEY_PREFIX = "brix_user_persona::";

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

export function getEmailPersona(email: string): Persona | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${EMAIL_KEY_PREFIX}${email}`);
  return isPersona(raw) ? raw : null;
}

export function setEmailPersona(email: string, p: Persona) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${EMAIL_KEY_PREFIX}${email}`, p);
}
