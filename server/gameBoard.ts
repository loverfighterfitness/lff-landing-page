import { CHARACTERS, type Character } from "@shared/game/types";

type RunLike = {
  email: string;
  handle: string;
  character: string;
  total: number;
  marketingOptIn?: boolean;
  createdAt?: Date | string | number;
  id?: number;
};

const time = (r: RunLike) => (r.createdAt === undefined ? NaN : new Date(r.createdAt).getTime());

/** Total desc, then earliest post, then lowest id. Equal/unknown keys keep input order (sort is stable). */
function compareRuns(a: RunLike, b: RunLike): number {
  if (a.total !== b.total) return b.total - a.total;
  const ta = time(a), tb = time(b);
  if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
  if (a.id !== undefined && b.id !== undefined && a.id !== b.id) return a.id - b.id;
  return 0;
}

export type BoardRow = { rank: number; handle: string; character: Character; total: number };
export type TeamRow = { character: Character; players: number; top: number };

/** Best run per player (by email), ranked. Emails stay server-side — only `ranks` is keyed by them. */
export function buildBoard(runs: RunLike[]) {
  const best: RunLike[] = [];
  const seen = new Set<string>();
  for (const r of [...runs].sort(compareRuns)) {
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
      if (compareRuns(r, cur.best) < 0) cur.best = r;
    }
  }
  const lines = ["handle,email,character,best,runs,marketing_opt_in"];
  for (const { best, runs: count, optIn } of Array.from(byEmail.values()).sort((a, b) => compareRuns(a.best, b.best))) {
    lines.push(
      [q(best.handle), q(best.email.toLowerCase()), q(best.character), best.total, count, optIn ? "yes" : "no"].join(","),
    );
  }
  return lines.join("\n");
}
