# LFF Motion Graphics (Remotion)

Motion graphics for Lover Fighter Fitness short-form content. Self-contained —
its own `package.json`, kept out of the landing page's dependency tree.

## Compositions

Four palettes of one graphic — 1080×1920 (9:16), 20s, 30fps, all with
**transparent backgrounds** by default. A recreation of the whiteboard demo:
growth stimulus saturates, fatigue doesn't, and the gap between them is where
training decisions live.

| Composition | Look |
|---|---|
| `VolumeCurveEmber` | Teal stimulus, ember fatigue, gold band — the original |
| `VolumeCurveVoltage` | Bold blue builds, red costs, yellow band — broadcast primaries |
| `VolumeCurveHeritage` | Cream stimulus, rust fatigue, muted gold — brand-true and tonal |
| `VolumeCurveMarker` | Teal and hot pink — the whiteboard's own marker colours |

They share the entire component tree. Only the palette differs, and every
colour stays editable per-composition in Studio.

**Beats**

| Frames | Beat |
|---|---|
| 0–78 | Title slam |
| 55–115 | Axes wipe out from the origin |
| 115–207 | Growth-stimulus curve draws, steep then flat |
| 215–303 | Fatigue line draws, straight and unrelenting |
| 312+ | Band slams over the 4–8 sweet spot |
| 402+ | Crossover ring pulses, junk-volume X lands past it |
| 492+ | Band slides **left** to 3–5 — the payoff |

## Running it

```bash
cd remotion
npm install
npm run studio          # interactive editor at localhost:3000
```

## Rendering

```bash
npm run render:ember      # ProRes 4444 + alpha
npm run render:voltage
npm run render:heritage
npm run render:marker
npm run render:all        # all four, one after another
npm run render:webm       # VP8 .webm with alpha — for web
npm run preview           # opaque MP4, for checking timing quickly
npm run still             # single PNG frame
```

Every `render:*` script outputs ProRes 4444 at `yuva444p10le` — transparent,
keys straight over footage in DaVinci Resolve.

Both alpha formats need the explicit `--pixel-format` flag that's already in
the scripts. Without it ProRes silently falls back to `yuv422p12le` and you
lose the transparency with no error. VP9 drops alpha regardless, which is why
the webm script uses VP8.

## Editing without touching code

Open `npm run studio`, pick a composition, and use the right-hand props panel —
swatches for both curves, the band, the ink and the legend pills, plus curve
thickness, glow strength, band fill and the transparency switch.

Only base hues are exposed. Glows, soft band fills and badge ink are *derived*
from them in `src/usePalette.tsx`, so no combination of swatches can put the
graphic into an inconsistent state — the badge label, for instance, flips
between dark and light ink based on the band colour's luminance.

To add a fifth look, add a palette to `src/palettes.ts`; `Root.tsx` maps over
them, so it registers itself.

Two things live in code, deliberately, because they're the graphic's argument:

- **`src/timing.ts`** — every beat's frame number and all caption copy. Retime or
  rewrite the whole piece here.
- **`src/curves.ts`** — the dose-response model. `growth()` is a saturating
  exponential, `fatigue()` is linear, and the crossover is *solved from those two
  functions* rather than hardcoded, so if you retune the constants the ring
  still lands in the right place.

## On the numbers

The x-axis is **effective sets per week** — hard sets taken close enough to
failure to count as a stimulus — not total sets logged. That's why the sweet
spot reads 4–8 rather than the 10–20 usually quoted for total weekly volume.
They're different metrics, and the graphic says so on the axis label.

With the curve as tuned: set 4 buys ~80% of the available stimulus, set 8 buys
~96%, and fatigue overtakes stimulus at ~10.9 sets.

## A note on light footage

The ink is light in every palette, carried over footage by drop shadows. That's
tuned for typical gym footage, which is mid-to-dark. Over a bright, blown-out
background the axis labels get marginal — if you hit that, darken `inkColor` in
the props panel for that shot rather than reaching for a different palette.

## Fonts

Montserrat is self-hosted at `public/fonts/Montserrat-variable.woff2` rather than
pulled from Google Fonts, so renders work offline and stay identical run to run.
