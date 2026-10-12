# Kalandka – Számkertész

Hungarian thinking games for children aged 5–7, built as an offline-capable tablet PWA.
Kalandka is the umbrella brand; Számkertész (the counting garden) is its first world, and Csepi the water drop is the guide.

## Games

| Game | Skill | How it plays |
| --- | --- | --- |
| Locsolás | Counting 1–20, ten-frames | Tap the cloud to water the plant with exactly N drops. Csepi counts aloud; too much water gets a gentle "Hoppá". First lap of plants needs 2–10 drops (one ten-frame); after that 11–20 (two ten-frames) and a watering can pours 5 at once. |
| Virágsor | Patterns (AB, ABC, AAB, ABB) | Pick the flower that continues the row. A wrong pick reads the row back as a hint. |
| Számvetés | Meeting the numbers 1–20 | Open from the start. Numbers come in order; the child taps each seed so it sprouts while Csepi counts, then the numeral, its dots and its word appear. No timer. 6–10 show as a five plus the rest, 11–20 as a full ten-frame plus the rest. |
| Magvillantás | Recognising amounts at a glance | Opens after numbers 1–5 in Számvetés. Seeds show for 2.5–3 s, then the child picks how many; "Mutasd újra!" shows them again any time. A wrong pick uncovers the seeds and counts them together. |
| Méhecske | Addition, 5 to 100 | Opens after numbers 1–10 in Számvetés. Two groups of flowers, "a + b = ?", pick the total. Tap a flower and the bee counts it; a wrong pick sends the bee round everything, counting aloud. Eight levels (up to 5, up to 10, counting on from a basket, up to 20, crossing ten, round tens, up to 100, up to 100 with carrying); from 20 on a bouquet stands for ten. Adaptive and child-led: after five first-try answers Csepi offers "harder or stay?" (tree / flower), after three tasks in a row that needed help she offers "easier or stay?" (sprout / flower). Always one step, the child decides. |
| Mézút | Writing the digits 0–9 | Open from the start. The child leads the bee along a dotted honey trail in writing order (1–9, then 0); 4, 5 and 7 take two strokes. The trail is forgiving: the finger may wander within a soft lane, and the honey always follows the trail, never the wobble. Off the lane nothing fails: the bee waits, the next stretch glows, a thread leads back and Csepi says "Gyere vissza a mézes útra!". Honey drops pop with a rising bubble sound (and a light vibration where supported); a see-through bee shows the way at the start, on "Mutasd az utat!" and after a quiet spell. |

Each solved task earns a seed; each watered plant is added to the garden on the home screen.
The parents' area opens through a gate (a two-digit multiplication such as 6 × 9 on a keypad, which 5–7 year olds cannot do yet). It is a separate full-screen space with a menu: **Áttekintés** (today's time ring, the last 7 days, plain-language notes on what is going well or hard, progress per game), **Képernyőidő** (daily limit, +10 minutes, rest now, warning and finish-the-task switches, evening rest), **Szintek** (a starting level per game with −/+ steppers, all games open) and **Beállítások** (Csepi's voice and speaking speed, sound effects, privacy, a two-step progress reset).

Screen time: only active play counts (app visible, parents' area closed) and the count starts again each day. Two minutes before the end a badge appears and Csepi says so; at the limit a child in a game may finish the task (up to 2 minutes), then a rest screen appears that only the parents' gate dismisses. "Pihenő most" ends play for today; evening rest blocks play from 18–20:00 until 7:00. Resetting progress does not reset today's play time.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # game logic tests (vitest)
npm run build    # type-check + production build with service worker
```

## Structure

```
src/
  games/water/logic.ts      pure watering rules: status, feedback text and speech, ten-frame slots
  games/patterns/logic.ts   pure pattern rounds and hints
  games/learn/logic.ts      Számvetés rounds, number naming, Magvillantás unlock rule
  games/flash/logic.ts      Magvillantás levels and answers
  games/flash/layout.ts     seed layouts shared by both seed games
  games/add/logic.ts        Méhecske levels, sums, bouquets, level-up rule
  games/trace/logic.ts      Mézút digit trails, forgiving finger following, honey-drop checkpoints
  lib/numbers.ts            Hungarian number words 1–100 ("két csepp" vs. counting "kettő", articles)
  lib/speech.ts             Csepi's voice via browser hu-HU text-to-speech (placeholder for recorded audio)
  lib/sound.ts              synthesised pops and chimes (Web Audio) and light vibration
  state/progress.tsx        seeds, garden and rounds, saved to localStorage
  state/screenTime.ts       daily limit, play clock and 14-day history, bonus, rest now, evening rest
  state/insights.ts         plain-language notes for parents; the multiplication gate
  state/levels.ts           per-game level settings for the parents' corner (read current, apply new start)
  components/               Csepi, artwork, buttons, speech bubble, 1180×820 scaling stage
  screens/                  Home, Learn, Water, Patterns, Flash, Add, Trace, Rest; parents/ (Gate, ParentArea and its pages)
```

## Design rules carried into code

- No failure states, timers or red: feedback is "Hoppá" orange and Csepi's surprised face.
- Praise effort ("Ügyes vagy!"), never cleverness.
- Bubble text shows digits; speech uses number words with correct Hungarian forms.
- Pattern flowers differ in shape and lightness as well as colour (colour-blind friendly).
- Touch targets are at least 64 px; the layout is a fixed 1180×820 stage scaled to the screen.

## Not done yet

- Recorded Hungarian voice for Csepi (the browser voice is a stand-in).
- PNG app icons for iOS home screens (the manifest has an SVG icon only).
- Locked games: Cserépbarátok and Szüret (subtraction); tapping them makes Csepi say they open soon.

## Deploy

The app is hosted on Azure Static Web Apps; see [docs/deploy.md](docs/deploy.md) for setup, releases, custom domains and rollback.
