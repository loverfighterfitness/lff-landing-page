import { trpc } from "@/lib/trpc";
import { CHARACTER_INFO, COACHED_BY_LINE, IG_PROFILE_URL } from "../content";
import { poseUrl } from "../poses";
import { BLUE, BROWN, CREAM, INK } from "../theme";

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

  const mine = highlightHandle ? data.rows.find((r) => r.handle === highlightHandle) : undefined;

  return (
    <div className="w-full flex flex-col gap-4">
      {mine && mine.rank <= 10 && (
        <div
          className="flex items-center gap-3 p-3"
          style={{ backgroundColor: BROWN, border: `3px solid ${CREAM}`, boxShadow: `4px 4px 0 ${BLUE}`, animation: "lff-pop 0.4s ease-out both" }}
        >
          <div>
            <p className="text-[10px]" style={{ color: CREAM }}>{COACHED_BY_LINE}</p>
            <p className="text-[8px] mt-1" style={{ color: BLUE }}>YOU'RE #{mine.rank} ON TEAM LFF</p>
          </div>
        </div>
      )}
      <div className="text-center">
        <p className="text-xs" style={{ color: BLUE }}>{data.event?.name ?? "NEXT COMP COMING SOON"}</p>
        {data.event && <p className="text-[8px] mt-2 opacity-75">{timeLeft(data.event.endsAt)} · HEAVIEST TOTAL WINS A TEE · EARLIEST SCORE WINS TIES</p>}
      </div>
      <ol className="w-full flex flex-col gap-1">
        {data.rows.length === 0 && (
          <li className="text-center py-4 flex flex-col gap-3 items-center">
            <span className="text-[10px]" style={{ color: CREAM }}>BE THE FIRST ON TEAM LFF</span>
            <a href={IG_PROFILE_URL} target="_blank" rel="noreferrer" className="text-[8px] leading-relaxed" style={{ color: BLUE }}>
              Follow @loverfighterfitness for the next comp drop
            </a>
          </li>
        )}
        {data.rows.map((r) => (
          <li
            key={r.rank}
            className="flex items-center gap-2 px-2 py-1.5 text-[10px]"
            style={{
              backgroundColor: r.handle === highlightHandle ? BLUE : r.rank === 1 ? BROWN : "transparent",
              color: r.handle === highlightHandle ? INK : undefined,
            }}
          >
            <span className="w-6 text-right">{r.rank}</span>
            <img src={poseUrl(r.character, "stance")} alt="" style={{ imageRendering: "pixelated", height: 36, width: "auto" }} />
            <span className="flex-1 truncate">@{r.handle}</span>
            <span>{r.total}KG</span>
          </li>
        ))}
      </ol>
      <p className="text-[8px] text-center -mb-2 opacity-80">TEAMS</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {data.teams.map((t) => (
          <div key={t.character} className="p-2" style={{ border: `2px solid ${CREAM}`, backgroundColor: "rgba(84,65,47,0.5)" }}>
            <p className="text-[8px]">{CHARACTER_INFO[t.character].name}</p>
            <p className="text-[10px] mt-2">{t.top}KG</p>
            <p className="text-[8px] mt-1 opacity-75">{t.players} LIFTERS</p>
          </div>
        ))}
      </div>
    </div>
  );
}
