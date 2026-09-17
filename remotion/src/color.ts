/** Small colour helpers so palettes only have to declare base hues. */

const toRgb = (color: string): [number, number, number] | null => {
  const hex = color.trim();
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (m6)
    return [parseInt(m6[1], 16), parseInt(m6[2], 16), parseInt(m6[3], 16)];
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  if (m3)
    return [
      parseInt(m3[1] + m3[1], 16),
      parseInt(m3[2] + m3[2], 16),
      parseInt(m3[3] + m3[3], 16),
    ];
  return null;
};

/** Hex -> rgba(). Non-hex input is returned untouched rather than mangled. */
export const withAlpha = (color: string, alpha: number): string => {
  const rgb = toRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

const linear = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

/**
 * Pick text that stays legible on a given fill. Band colours differ a lot
 * between palettes, so the badge label can't assume a dark or light ink.
 */
export const readableInk = (
  bg: string,
  dark = "#221B14",
  light = "#FFFFFF"
): string => {
  const rgb = toRgb(bg);
  if (!rgb) return dark;
  const l =
    0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
  return l > 0.42 ? dark : light;
};
