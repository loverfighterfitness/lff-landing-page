/**
 * Game Tab — run the LFF Gym comp: set the event window, moderate scores, export entrants.
 */
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const CREAM = "#EAE6D2";
const muted = { color: "rgba(234,230,210,0.72)" };
const inputStyle = { backgroundColor: "rgba(0,0,0,0.25)", color: CREAM, border: "1px solid rgba(234,230,210,0.3)" };

export default function GameTab() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.game.admin.overview.useQuery();
  const setRemoved = trpc.game.admin.setRunRemoved.useMutation({
    onSuccess: () => utils.game.admin.overview.invalidate(),
  });
  const startEvent = trpc.game.admin.startEvent.useMutation({
    onSuccess: () => {
      toast.success("Comp started");
      utils.game.admin.overview.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const [name, setName] = useState("LFF Gym launch comp");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const exportCsv = async () => {
    const { csv } = await utils.game.admin.entrantsCsv.fetch();
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `lff-gym-entrants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={28} style={{ color: CREAM }} /></div>;
  if (error) return <p className="text-sm py-10 text-center" style={muted}>Couldn't load the game: {error.message}</p>;

  const event = data?.event;
  const runs = data?.runs ?? [];

  return (
    <div className="flex flex-col gap-6" style={{ color: CREAM }}>
      <section className="rounded-xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.18)" }}>
        <h3 className="font-bold mb-1">Current comp</h3>
        {event ? (
          <p className="text-sm" style={muted}>
            {event.name} · {new Date(event.startsAt).toLocaleString()} → {new Date(event.endsAt).toLocaleString()}
          </p>
        ) : (
          <p className="text-sm" style={muted}>No comp set. The game still works as practice until you start one.</p>
        )}
        <a href="/game" target="_blank" rel="noreferrer" className="text-xs underline mt-2 inline-block">Open /game</a>
      </section>

      <form
        className="rounded-xl p-4 grid gap-3 sm:grid-cols-4 items-end"
        style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
        onSubmit={(e) => {
          e.preventDefault();
          startEvent.mutate({ name, startsAt: new Date(startsAt), endsAt: new Date(endsAt) });
        }}
      >
        <label className="text-xs flex flex-col gap-1 sm:col-span-2">Name
          <input className="rounded px-2 py-1.5 text-sm" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="text-xs flex flex-col gap-1">Starts
          <input type="datetime-local" className="rounded px-2 py-1.5 text-sm" style={inputStyle} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </label>
        <label className="text-xs flex flex-col gap-1">Ends
          <input type="datetime-local" className="rounded px-2 py-1.5 text-sm" style={inputStyle} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
        </label>
        <button type="submit" disabled={startEvent.isPending} className="sm:col-span-4 rounded-lg py-2 text-sm font-bold" style={{ backgroundColor: CREAM, color: "#54412F" }}>
          {event ? "Start a new comp (resets the board)" : "Start comp"}
        </button>
      </form>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Runs ({runs.length})</h3>
          <button onClick={exportCsv} className="text-xs flex items-center gap-1 underline"><Download size={14} /> Export entrants CSV</button>
        </div>
        {runs.length === 0 ? (
          <p className="text-sm py-6 text-center" style={muted}>No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead style={muted}>
                <tr className="text-left">
                  <th className="py-1 pr-2">Handle</th><th className="pr-2">Email</th><th className="pr-2">Lifter</th>
                  <th className="pr-2 text-right">Bench</th><th className="pr-2 text-right">Squat</th><th className="pr-2 text-right">DL</th>
                  <th className="pr-2 text-right">Total</th><th className="pr-2">When</th><th />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ opacity: r.removed ? 0.4 : 1, borderTop: "1px solid rgba(234,230,210,0.12)" }}>
                    <td className="py-1.5 pr-2">@{r.handle}</td>
                    <td className="pr-2">{r.email}{r.marketingOptIn ? " ✓" : ""}</td>
                    <td className="pr-2 capitalize">{r.character}</td>
                    <td className="pr-2 text-right">{r.benchScore}</td>
                    <td className="pr-2 text-right">{r.squatScore}</td>
                    <td className="pr-2 text-right">{r.deadliftScore}</td>
                    <td className="pr-2 text-right font-bold">{r.total}</td>
                    <td className="pr-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="underline" onClick={() => setRemoved.mutate({ id: r.id, removed: !r.removed })}>
                        {r.removed ? "Restore" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
