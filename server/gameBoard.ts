import { CHARACTERS, type Character } from "@shared/game/types";

type RunLike = {
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

/** A player is their Instagram handle (case-insensitive). */
export const playerKey = (handle: string) => handle.trim().replace(/^@/, "").toLowerCase();

/** Best run per player (by Instagram handle), ranked. `ranks` is keyed by playerKey. */
export function buildBoard(runs: RunLike[]) {
  const best: RunLike[] = [];
  const seen = new Set<string>();
  for (const r of [...runs].sort(compareRuns)) {
    const key = playerKey(r.handle);
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
  const ranks = new Map(best.map((r, i) => [playerKey(r.handle), i + 1]));
  const teams: TeamRow[] = CHARACTERS.map((character) => {
    const mine = best.filter((r) => r.character === character);
    return { character, players: mine.length, top: mine[0]?.total ?? 0 };
  });
  return { rows, teams, ranks };
}

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** Entrants export for the admin: one row per player. */
export function entrantsCsv(runs: RunLike[]): string {
  const byHandle = new Map<string, { best: RunLike; runs: number }>();
  for (const r of runs) {
    const key = playerKey(r.handle);
    const cur = byHandle.get(key);
    if (!cur) byHandle.set(key, { best: r, runs: 1 });
    else {
      cur.runs++;
      if (compareRuns(r, cur.best) < 0) cur.best = r;
    }
  }
  const lines = ["handle,character,best,runs"];
  for (const { best, runs: count } of Array.from(byHandle.values()).sort((a, b) => compareRuns(a.best, b.best))) {
    lines.push([q(best.handle), q(best.character), best.total, count].join(","));
  }
  return lines.join("\n");
}
