import { trpc } from "@/lib/trpc";
import { CHARACTER_INFO } from "../content";
import { poseUrl } from "../poses";

function timeLeft(endsAt: Date) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "COMP CLOSED";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}D ${h}H LEFT` : `${h}H LEFT`;
}

/** Live board — refreshes every 10s while on screen. */
export default function Leaderboard({ highlightHandle }: { highlightHandle?: string }) {
  const { data, isLoading, error } = trpc.game.leaderboard.useQuery(undefined, { refetchInterval: 10_000, retry: 1 });

  if (isLoading) return <p className="text-[10px]">LOADING BOARD...</p>;
  if (error || !data) return <p className="text-[10px] text-center">Board's offline right now. Try again soon.</p>;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs" style={{ color: "#d4af37" }}>{data.event?.name ?? "NEXT COMP COMING SOON"}</p>
        {data.event && <p className="text-[8px] mt-2 opacity-75">{timeLeft(data.event.endsAt)} · TOP SCORE WINS A TEE · EARLIEST SCORE WINS TIES</p>}
      </div>
      <ol className="w-full flex flex-col gap-1">
        {data.rows.length === 0 && <li className="text-[9px] text-center opacity-75">No scores yet. Be first.</li>}
        {data.rows.map((r) => (
          <li
            key={r.rank}
            className="flex items-center gap-2 px-2 py-1.5 text-[9px]"
            style={{
              backgroundColor: r.handle === highlightHandle ? "#d4af37" : r.rank === 1 ? "#2e2318" : "transparent",
              color: r.handle === highlightHandle ? "#2e2318" : undefined,
            }}
          >
            <span className="w-6 text-right">{r.rank}</span>
            <img src={poseUrl(r.character, "idle")} alt="" style={{ imageRendering: "pixelated", height: 36, width: "auto" }} />
            <span className="flex-1 truncate">@{r.handle}</span>
            <span>{r.total}</span>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-3 gap-2 text-center">
        {data.teams.map((t) => (
          <div key={t.character} className="p-2" style={{ border: "2px solid #EAE6D2" }}>
            <p className="text-[8px]">TEAM {CHARACTER_INFO[t.character].name}</p>
            <p className="text-[10px] mt-2">{t.top}</p>
            <p className="text-[7px] mt-1 opacity-75">{t.players} LIFTERS</p>
          </div>
        ))}
      </div>
    </div>
  );
}
