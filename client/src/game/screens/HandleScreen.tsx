import { useState } from "react";
import { cleanHandle, HANDLE_RE, saveHandle } from "../player";
import { BAD } from "../theme";
import { ArcadeTitle, Panel, PixelButton, Screen } from "./ui";

/** Asked once, before fighter select: every run then posts to the leaderboard under this handle. */
export default function HandleScreen({ initial, onDone, onBack }: { initial: string; onDone: (handle: string) => void; onBack: () => void }) {
  const [value, setValue] = useState(initial ? `@${initial}` : "");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = cleanHandle(value);
    if (!HANDLE_RE.test(handle)) {
      setError("Enter your Instagram handle (letters, numbers, . and _)");
      return;
    }
    saveHandle(handle);
    onDone(handle);
  };

  return (
    <Screen dim={0.5}>
      <ArcadeTitle size={15} style={{ marginTop: 24 }}>
        WHO'S LIFTING?
      </ArcadeTitle>
      <Panel>
        <form onSubmit={submit} className="w-full flex flex-col gap-3 text-[10px]">
          <p className="leading-loose">Your Instagram handle goes on the leaderboard. Heaviest total wins a free tee.</p>
          <input
            autoFocus
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="@instagram"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full px-3 py-3 text-[12px]"
            style={{ backgroundColor: "#0d0b09", color: "#EAE6D2", border: "2px solid #EAE6D2", fontFamily: "inherit" }}
          />
          <p className="text-[8px] leading-relaxed opacity-70">Use your real handle: the winner gets a DM from @loverfighterfitness.</p>
          {error && <p style={{ color: BAD }} className="leading-relaxed">{error}</p>}
          <PixelButton type="submit" variant="gold" big>
            LET'S GO
          </PixelButton>
        </form>
      </Panel>
      <PixelButton variant="ghost" onClick={onBack}>BACK</PixelButton>
    </Screen>
  );
}
