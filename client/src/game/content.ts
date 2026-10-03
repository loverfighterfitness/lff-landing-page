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
  bench: "TAP in the zone. Dead centre = PERFECT = +10KG. Faster every rep. 3 misses = done.",
  squat: "MASH to drive up, fast as you like but STEADY. Off-rhythm taps barely move it. Fail a rep = done.",
  deadlift: "HOLD to pull, RELEASE in the zone. Dead centre = +10KG. Miss the zone = done.",
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

/**
 * Every finisher's consolation prize: half-price first month of coaching. Stripe promotion code GAME
 * (coupon LFF_GAME_HALF_MONTH: 50% off for 1 month, both coaching packages, first-time customers,
 * expires with the comp). The link pre-applies it at coaching checkout.
 */
/**
 * Grand prize: first verified lifter to YEAR_PRIZE_KG wins a year of coaching. One winner: when it's
 * claimed, set `claimedBy` to their handle and the banners switch to "CLAIMED".
 */
export const YEAR_PRIZE = {
  claimedBy: null as string | null,
};

export const PRIZE = {
  code: "GAME",
  endsAt: new Date("2026-10-17T09:30:00Z"),
  title: "CONSOLATION PRIZE",
  body: "Every finisher gets a half-price first month of LFF online coaching.",
  fine: "New clients · ends 17 Oct",
  cta: "CLAIM 50% OFF",
  url: "/?promo=GAME#coaching",
};
export const NEXT_FIGHTER_TITLE = "THIS COULD BE YOU";
export const NEXT_FIGHTER_BODY = "Join Team LFF and you could be the next playable fighter.";
export const PRACTICE_LINE = "Next comp drops soon. Follow @loverfighterfitness so you don't miss it.";
export const COACHED_BY_LINE = "TOP 10. COACHED BY LEVI.";
