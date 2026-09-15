// Anonymous identity for v1 — a UUID stored in localStorage. Clearing storage
// yields a fresh identity (an accepted trade-off).

const KEY = "xi_user_id";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
