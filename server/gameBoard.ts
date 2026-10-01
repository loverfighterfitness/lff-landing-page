import { CHARACTERS, type Character } from "@shared/game/types";

type RunLike = { email: string; handle: string; character: string; total: number; marketingOptIn?: boolean };

export type BoardRow = { rank: number; handle: string; character: Character; total: number };
export type TeamRow = { character: Character; players: number; top: number };

/** Best run per player (by email), ranked. Emails stay server-side — only `ranks` is keyed by them. */
export function buildBoard(runs: RunLike[]) {
  const best: RunLike[] = [];
  const seen = new Set<string>();
  for (const r of [...runs].sort((a, b) => b.total - a.total)) {
    const key = r.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    best.push(r);
  }
  const rows: BoardRow[] = best.map((r, i) => ({
    rank: i + 1,
    handle: r.handle,
    character: r.character as Character,
    total: r.total,
  }));
  const ranks = new Map(best.map((r, i) => [r.email.toLowerCase(), i + 1]));
  const teams: TeamRow[] = CHARACTERS.map((character) => {
    const mine = best.filter((r) => r.character === character);
    return { character, players: mine.length, top: mine[0]?.total ?? 0 };
  });
  return { rows, teams, ranks };
}

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** Entrants export for the admin: one row per player. */
export function entrantsCsv(runs: RunLike[]): string {
  const byEmail = new Map<string, { best: RunLike; runs: number; optIn: boolean }>();
  for (const r of runs) {
    const key = r.email.toLowerCase();
    const cur = byEmail.get(key);
    if (!cur) byEmail.set(key, { best: r, runs: 1, optIn: !!r.marketingOptIn });
    else {
      cur.runs++;
      cur.optIn ||= !!r.marketingOptIn;
      if (r.total > cur.best.total) cur.best = r;
    }
  }
  const lines = ["handle,email,character,best,runs,marketing_opt_in"];
  for (const { best, runs: count, optIn } of Array.from(byEmail.values()).sort((a, b) => b.best.total - a.best.total)) {
    lines.push(
      [q(best.handle), q(best.email.toLowerCase()), q(best.character), best.total, count, optIn ? "yes" : "no"].join(","),
    );
  }
  return lines.join("\n");
}
