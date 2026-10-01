import type { Character, LiftId, Outcome } from "@shared/game/types";

export const IG_DM_URL = "https://ig.me/m/loverfighterfitness";
export const IG_PROFILE_URL = "https://www.instagram.com/loverfighterfitness/";
export const GAME_NAME = "LOVER FIGHTER";
export const GAME_URL = "loverfighterfitness.com/game";

export const CHARACTER_INFO: Record<
  Character,
  { name: string; tee: "black" | "cream" | "brown"; tagline: string; winQuotes: string[]; perfectQuotes: string[] }
> = {
  levi: {
    name: "LEVI",
    tee: "black",
    tagline: "The coach. Science first.",
    winQuotes: ["Mark my words.", "That's the meta.", "Pretty damn good."],
    perfectQuotes: ["MECHANICAL TENSION!", "GOAT REP", "0 RIR"],
  },
  ruby: {
    name: "RUBY",
    tee: "cream",
    tagline: "2nd at her first ICN show.",
    winQuotes: ["Prep starts now.", "Stage-ready.", "Smashed it."],
    perfectQuotes: ["STAGE READY", "SMASHED IT", "INSANE"],
  },
  benny: {
    name: "BENNY",
    tee: "brown",
    tagline: "55. Old school. Chasing 3 plates.",
    winQuotes: ["YEAH BUDDY!", "Ain't nothin' but a peanut!", "LIGHT WEIGHT BABY!"],
    perfectQuotes: ["YEAH BUDDY!", "LIGHT WEIGHT!", "AIN'T NOTHIN' BUT A PEANUT!"],
  },
};

export const POPUPS: Record<Exclude<Outcome, null>, string[]> = {
  perfect: ["GOAT REP", "PERFECT", "INSANE"],
  good: ["SMASHED IT", "THAT'S THE META", "PRETTY DAMN GOOD"],
  miss: ["MISSED", "FAILED REP", "GO AGAIN"],
  formbreak: ["FORM BREAK", "TOO FAST!", "CONTROL IT"],
  tut: ["TUT?!"],
};

export const LIFT_NAMES: Record<LiftId, string> = { bench: "BENCH PRESS", squat: "SQUATS", deadlift: "DEADLIFT" };

export const LIFT_TIPS: Record<LiftId, string> = {
  bench: "TAP when the marker hits the green. Dead centre = PERFECT.",
  squat: "TAP to drive up. Steady rhythm - mash too fast and your form breaks.",
  deadlift: "HOLD to pull. RELEASE in the green to lock out.",
};

export const TUT_LINE = "TUT doesn't grow muscle. Mechanical tension does.";
export const WHOLE_FOODS_BRO = "Just eat whole foods bro";
export const LEVI_REPLY_WHOLE_FOODS = "You can overeat whole foods. Track it.";
export const BENNY_BANTER_REPLY = "...technically that's mechanical tension, Benny.";
export const BENNY_3_PLATES_LOADING = "55 YEARS YOUNG. 3 PLATES LOADING...";
export const BENNY_3_PLATES_DONE = "3 PLATES! LIGHT WEIGHT BABY!";
export const RUBY_PODIUM_LINE = "2ND > 1ST";

export function SHOP_CTA(c: Character) {
  return `Rep the same ${CHARACTER_INFO[c].tee} tee as ${CHARACTER_INFO[c].name[0]}${CHARACTER_INFO[c].name.slice(1).toLowerCase()}`;
}
export const COACHING_CTA = "Want coaching built for you? DM me 'TRANSFORM'";
export const NEXT_FIGHTER_TITLE = "THIS COULD BE YOU";
export const NEXT_FIGHTER_BODY = "Join Team LFF and you could be the next playable fighter.";
export const PRACTICE_LINE = "Next comp drops soon. Follow @loverfighterfitness so you don't miss it.";
export const COACHED_BY_LINE = "TOP 10. COACHED BY LEVI.";
