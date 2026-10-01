import { trpc } from "@/lib/trpc";

function left(ms: number) {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}D ${h}H LEFT` : `${Math.max(1, h)}H LEFT`;
}

/** Whether a comp is open right now, and a short line to show players. */
export function useCompStatus(): { open: boolean; line: string } {
  const { data } = trpc.game.leaderboard.useQuery(undefined, { retry: 1, staleTime: 30_000 });
  const ev = data?.event;
  const now = Date.now();
  if (ev && new Date(ev.startsAt).getTime() <= now && now < new Date(ev.endsAt).getTime()) {
    return { open: true, line: `${ev.name.toUpperCase()} · ${left(new Date(ev.endsAt).getTime() - now)}` };
  }
  if (ev && now < new Date(ev.startsAt).getTime()) {
    return { open: false, line: `PRACTICE MODE · COMP STARTS ${new Date(ev.startsAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }).toUpperCase()}` };
  }
  return { open: false, line: "PRACTICE MODE · NEXT COMP STARTS SOON" };
}
