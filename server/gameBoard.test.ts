import { describe, expect, it } from "vitest";
import { buildBoard, entrantsCsv } from "./gameBoard";

const run = (_email: string, handle: string, character: string, total: number) => ({ handle, character, total });

describe("tie-breaks", () => {
  const at = (email: string, handle: string, createdAt: string, id: number) =>
    ({ ...run(email, handle, "levi", 800), createdAt: new Date(createdAt), id });

  it("ranks the earlier post first regardless of input order", () => {
    const early = at("e@x.com", "early", "2026-10-01T10:00:00Z", 5);
    const late = at("l@x.com", "late", "2026-10-01T11:00:00Z", 2);
    for (const input of [[early, late], [late, early]]) {
      expect(buildBoard(input).rows.map((r) => r.handle)).toEqual(["early", "late"]);
      expect(entrantsCsv(input).split("\n")[1]).toContain("early");
    }
  });
});

describe("buildBoard", () => {
  it("keeps each player's best run only, best first", () => {
    const board = buildBoard([
      run("a@x.com", "amy", "ruby", 500),
      run("b@x.com", "bob", "benny", 900),
      run("A@x.com", "@Amy", "levi", 700),
    ]);
    expect(board.rows).toEqual([
      { rank: 1, handle: "bob", character: "benny", total: 900 },
      { rank: 2, handle: "@Amy", character: "levi", total: 700 },
    ]);
    expect(board.ranks.get("amy")).toBe(2);
  });

  it("totals players and top score per team", () => {
    const board = buildBoard([run("a@x.com", "amy", "ruby", 500), run("b@x.com", "bob", "ruby", 300)]);
    expect(board.teams).toEqual([
      { character: "levi", players: 0, top: 0 },
      { character: "ruby", players: 2, top: 500 },
      { character: "benny", players: 0, top: 0 },
    ]);
  });
});

describe("entrantsCsv", () => {
  it("one row per player with best score and run count", () => {
    const csv = entrantsCsv([
      run("a@x.com", "amy", "ruby", 500),
      run("a@x.com", "Amy", "ruby", 800),
      run("b@x.com", 'b"ob', "benny", 100),
    ]);
    expect(csv.split("\n")).toEqual([
      "handle,character,best,runs",
      '"Amy","ruby",800,2',
      '"b""ob","benny",100,1',
    ]);
  });
});
