/** The player's Instagram handle, entered once at the start and remembered on this device. */
const KEY = "lff-gym-entrant";

export const HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;

/** "@Ruby.Lifts " -> "Ruby.Lifts". */
export const cleanHandle = (raw: string) => raw.trim().replace(/^@/, "");

export function savedHandle(): string {
  try {
    const h = String((JSON.parse(localStorage.getItem(KEY) ?? "") as { handle?: string }).handle ?? "");
    return HANDLE_RE.test(cleanHandle(h)) ? cleanHandle(h) : "";
  } catch {
    return "";
  }
}

export function saveHandle(handle: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ handle: cleanHandle(handle) }));
  } catch {
    /* private mode: they'll be asked again next visit */
  }
}
