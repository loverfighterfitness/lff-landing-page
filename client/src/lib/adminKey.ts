const STORAGE_KEY = "lff-admin-key";
export const ADMIN_LOCKED_EVENT = "lff-admin-locked";

export function getAdminKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminKey(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* private mode — key lives for this page only */
  }
}

export function clearAdminKey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
