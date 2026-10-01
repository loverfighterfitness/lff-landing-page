export const CHARACTERS = ["levi", "ruby", "benny"] as const;
export type Character = (typeof CHARACTERS)[number];

export const LIFTS = ["bench", "squat", "deadlift"] as const;
export type LiftId = (typeof LIFTS)[number];

/** A change in the single game input (tap/hold/space), stamped with the tick it applies from. */
export type InputEvent = { tick: number; down: boolean };

export type Outcome = "perfect" | "good" | "miss" | "tut" | "formbreak" | null;

export type RunLogs = Record<LiftId, InputEvent[]>;
export type LiftScores = Record<LiftId, number>;
