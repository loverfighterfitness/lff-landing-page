# LFF Motion Graphics (Remotion)

Motion graphics for Lover Fighter Fitness short-form content. Self-contained —
its own `package.json`, kept out of the landing page's dependency tree.

## Compositions

### `VolumeCurve` — Growth Stimulus vs Fatigue

1080×1920 (9:16), 20s, 30fps. A recreation of the whiteboard demo: growth
stimulus saturates, fatigue doesn't, and the gap between them is where training
decisions live.

**Beats**

| Frames | Beat |
|---|---|
| 0–78 | Title slam |
| 55–115 | Axes wipe out from the origin |
| 115–207 | Teal growth-stimulus curve draws, steep then flat |
| 215–303 | Red fatigue line draws, straight and unrelenting |
| 312+ | Gold band slams over the 4–8 sweet spot |
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
npm run render          # MP4, opaque background
npm run render:alpha    # ProRes 4444 .mov with alpha — use this for Resolve
npm run render:webm     # VP8 .webm with alpha — for web/preview
npm run still           # single PNG frame
```

`render:alpha` is the one for overlays: ProRes 4444 at `yuva444p10le`, which
keys straight over footage in DaVinci Resolve. Both alpha formats need the
explicit `--pixel-format` flag that's already in the scripts — without it
ProRes silently falls back to `yuv422p12le` and you lose the transparency. VP9
drops alpha regardless, which is why the webm script uses VP8.

## Editing without touching code

Open `npm run studio` and use the right-hand props panel — colour swatches for
both curves, the band, the ink and the background, plus curve thickness and the
transparency switch.

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

## Fonts

Montserrat is self-hosted at `public/fonts/Montserrat-variable.woff2` rather than
pulled from Google Fonts, so renders work offline and stay identical run to run.
