/**
 * Four looks for the same graphic. Each declares base hues only — glows, soft
 * fills and badge ink are derived, so a palette can't drift out of sync with
 * itself.
 */
export type Palette = {
  /** Composition id suffix and Studio label. */
  id: string;
  label: string;
  growth: string;
  fatigue: string;
  /** Sweet-spot band and kicker accent. */
  band: string;
  /** Headline and axis ink. */
  ink: string;
  /** Legend pill and kicker chip fill. */
  panel: string;
  /** Background used only when transparency is switched off. */
  background: string;
  /** Glow multiplier on the curves — 0 flat, 1 default, 2 heavy. */
  glowStrength: number;
  /** Band fill opacity. */
  bandFill: number;
};

/** The original: teal stimulus, ember fatigue, gold band. */
export const EMBER: Palette = {
  id: "Ember",
  label: "Ember (original)",
  growth: "#2EC4B6",
  fatigue: "#FF4D3D",
  band: "#F2B33D",
  ink: "#EAE6D2",
  panel: "#54412F",
  background: "#171310",
  glowStrength: 1,
  bandFill: 0.18,
};

/** Bold primaries — broadcast scorebug energy. Blue builds, red costs. */
export const VOLTAGE: Palette = {
  id: "Voltage",
  label: "Voltage (red / blue)",
  growth: "#2F6BFF",
  fatigue: "#FF2D2D",
  band: "#FFC93C",
  ink: "#F2F5FF",
  panel: "#0E1330",
  background: "#070A1A",
  glowStrength: 1.35,
  bandFill: 0.2,
};

/** Brand-true and tonal: cream stimulus, rust fatigue, muted gold band. */
export const HERITAGE: Palette = {
  id: "Heritage",
  label: "Heritage (brown / cream)",
  growth: "#F2EAD3",
  fatigue: "#C0563A",
  band: "#D9A441",
  ink: "#E8E0CB",
  panel: "#443428",
  background: "#241C15",
  glowStrength: 0.7,
  bandFill: 0.16,
};

/** A nod to the whiteboard itself — teal marker, pink annotation marker. */
export const MARKER: Palette = {
  id: "Marker",
  label: "Marker (whiteboard)",
  growth: "#17BEBB",
  fatigue: "#FF2D87",
  band: "#FFD23F",
  ink: "#F4F6F8",
  panel: "#23262E",
  background: "#12141A",
  glowStrength: 1.15,
  bandFill: 0.15,
};

export const PALETTES: readonly Palette[] = [EMBER, VOLTAGE, HERITAGE, MARKER];
