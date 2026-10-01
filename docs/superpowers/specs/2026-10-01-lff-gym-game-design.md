# LFF Gym — 8-bit Workout Game — Design

**Date:** 2026-10-01
**Status:** Approved
**Owner:** Levi

## Goal

A small, fun, browser-based 8-bit game at `/game` on the LFF site. Players run a short gym circuit (inspired by NBA 2K's gym workouts), post a score to a live leaderboard, and the top score at the end of a two-week launch event wins a free LFF tee. It doubles as brand content (easter eggs, merch, coaching CTA) and an email-list builder.

**Success looks like:** people replay it, share their scores, land on `/shop` and DM "TRANSFORM", and the winner is clear and fairly earned.

## Scope

In scope: the game, three playable characters, live leaderboard (individual + team), entry capture, server-side score checks, admin controls, one event window.

Out of scope (later, if wanted): extra lifts, more characters, real-time sockets, accounts/logins, automated prize fulfilment, multiple simultaneous events.

## 1. Gameplay

**Flow:** Title → Character select → Circuit (3 lifts back to back, ~90s) → Score screen → Enter IG handle + email (+ marketing opt-in) → Leaderboard with your rank → "Run it back".

**Input:** one input for everything — tap/hold anywhere on mobile, spacebar on desktop.

**Characters (cosmetic only — identical gameplay):**

| Character | Outfit | Flavour |
|---|---|---|
| Levi | Black LFF tee | Coach mode; quotes use Levi's real phrases ("mark my words", "that's the meta", "pretty damn good") |
| Ruby | Cream LFF tee | Comp stage; "🥈 → 🥇" gag on a perfect run (2nd at her first ICN show) |
| Benny | Brown LFF tee | 55-year-old old-school lifter, nearly benching 3 plates. The resident gym bro (more than Levi). Quotes Ronnie Coleman: "YEAH BUDDY!", "LIGHT WEIGHT BABY!", "Ain't nothin' but a peanut!" |

Sprites are drawn as pixel art from existing photos (shop tee shots, program photos). Ruby and Benny have approved use of their likeness.

**The circuit:**

| Lift | Duration | Mechanic | Lift score |
|---|---|---|---|
| Bench press | ~25s | A marker sweeps across a meter; tap in the green zone to complete a rep. Zone shrinks and marker speeds up each rep. 3 misses ends the set. | Sum per rep: 100 for green, 200 for "perfect" (centre band) |
| Squats | ~20s | Mash to drive the bar up. A form bar fills if mashing is too fast/erratic; if it maxes, the rep is lost. | 150 per clean rep |
| Deadlift | ~20s | Hold to pull; a power gauge climbs; release in the sweet spot to lock out. Plates get heavier each round; a miss ends the lift. | Heaviest successful lockout (kg) × 10 |

**Combo:** consecutive perfects (any lift) build a multiplier (×1.0 → max ×2.0), reset on a miss. Applied per rep as it's scored.

**Run total** = bench + squat + deadlift (combo included). A player's best total counts on the board.

Exact numbers (zone widths, speeds, durations) are tuning values in one config file and will be adjusted by playtesting.

## 2. LFF flavour & easter eggs

- **Palette & art:** LFF brown/cream palette, 8-bit LFF logo on the title, gym backdrop inspired by LFF training spots, plus an "under the bridge" stage.
- **Pop-up text in Levi's voice (never bro):** "SMASHED IT", "INSANE", "GOAT REP", "MECHANICAL TENSION ✓", "0 RIR".
- **TUT trap:** if a player deliberately goes very slow on squats, pixel-Levi appears: "TUT doesn't grow muscle. Mechanical tension does." Small score penalty.
- **Benny's 3-plate quest:** when Benny's bench bar reaches 3 plates a side (140kg), the bar visibly "almost" goes, then a gag: "55 years young. 3 plates loading..." If a Benny run clears it with a perfect, the bar explodes in confetti and "LIGHT WEIGHT BABY!" — the 3-plate PR he's chasing in real life.
- **Old school vs science banter:** Benny's bro-isms ("YEAH BUDDY!") occasionally get a deadpan pixel-Levi reply ("…technically that's mechanical tension, Benny"). Gym bro vs coach, played for laughs.
- **"Just eat whole foods bro" NPC** cameo that gets shut down.
- **Merch cosmetics:** LFF straps glow on the deadlift, cuffs visible on bench. Cosmetic only.
- **Cheat code:** typing `TRANSFORM` on the title screen unlocks a gold "Coached by Levi" skin. Cosmetic only.
- **Mystery 4th character:** locked silhouette on select screen, reserved for a future reveal/drop.
- **Score-screen CTAs:** "Rep the same tee as [character] → /shop" (deep-links to that tee colour) and "Want coaching built for you? DM me 'TRANSFORM'".

Copy follows `/Users/levihurst/AI context/brand-voice.md`.

## 3. Architecture

Lives inside the existing `lff-landing-page` app (React + Vite, Express + tRPC, Drizzle/MySQL, deployed on Railway behind a Cloudflare Worker). **No changes to shop, Stripe, or checkout code.**

### Front end

- New lazy-loaded route `/game` (`client/src/pages/Game.tsx`) so the game code doesn't add weight to other pages.
- Game lives in `client/src/game/`, split into focused units:
  - `engine/` — fixed-timestep loop, canvas scaling (low internal resolution, e.g. 256×144, integer-scaled with `image-rendering: pixelated`), input (tap/hold/space unified), audio.
  - `lifts/bench.ts`, `lifts/squat.ts`, `lifts/deadlift.ts` — each a pure state machine: `update(state, input, dt) → state` plus a renderer. Scoring logic is pure and shared with the server.
  - `scenes/` — title, select, circuit, score, leaderboard.
  - `content/` — characters, quotes, pop-ups, easter eggs (data, not logic).
  - `config.ts` — all tuning numbers.
- Assets: sprite sheets (PNG) + small chiptune SFX/music in `client/public/game/`.

### Shared

- `shared/game/scoring.ts` — pure scoring + plausibility rules, imported by both client and server so they can't drift.

### Back end

- New tRPC router `server/routers/game.ts`:
  - `game.startRun({ character })` → `{ runToken }` — one-time signed token with server start time. Rejected when no event is active.
  - `game.submitRun({ runToken, character, handle, email, marketingOptIn, events })` → `{ total, rank }` — server re-computes the score from the input event log using shared scoring and validates plausibility.
  - `game.leaderboard()` → top 20 (handle, character, best total), team totals, event end time. Public; never returns emails.
  - `game.myRank({ email })` (or returned from submit) → player's rank.
  - Admin (behind existing admin auth): `game.admin.list`, `game.admin.removeRun`, `game.admin.setEvent`, `game.admin.exportEntrants`.
- Client polls `leaderboard` every ~10s while visible (no websockets — avoids Cloudflare Worker issues).

### Data (Drizzle, new migration)

- `game_events`: id, name, startsAt, endsAt, isActive.
- `game_runs`: id, eventId, handle, email, character (`levi|ruby|benny`), benchScore, squatScore, deadliftScore, total, runTokenId, ip hash, createdAt, removed (bool).
- `game_run_tokens`: id, issuedAt, usedAt — for one-time use.
- Opted-in entrants are also inserted into the existing `leads` table (source: `game`) so they enter email nurture. Non-opted-in emails are used only to contact the winner.

### Anti-cheat (deter casual cheating, not impossible)

- Valid one-time run token required; token expires (e.g. 5 min).
- Server recomputes score from the event log; client-claimed totals are ignored.
- Plausibility: run duration within expected range, input timing ≥ human minimum, reps/time within bounds, per-lift caps.
- Rate limit submissions per email and per IP.
- Admin can remove runs; winner confirmed by DM before the tee is sent.

### Errors

- Network failure on submit: keep the run locally and offer "Retry"; the score is not lost while the page stays open.
- Event not active: game still playable for fun; board shows "Next event coming soon" and submissions are refused with a clear message.
- Rejected run (failed checks): friendly "That run didn't check out — run it back" message, no detail on which check failed.

### Admin

New "Game" tab in the existing password-protected `/admin`: leaderboard with emails, remove run, set event name/dates, export entrants CSV.

## 4. Testing

- Unit tests (vitest) for each lift state machine, shared scoring, combo logic and plausibility checks — including crafted cheating logs that must be rejected.
- Router tests for startRun/submitRun/leaderboard (token reuse, expired token, rate limits, no email leakage).
- `pnpm check` and `pnpm test` pass.
- Manual playthrough in the browser at phone width (375px) and desktop before launch; confirm `/shop` and checkout untouched.

## Open items

- Event dates and which tee/size the winner gets.
