# Hibavadász: design

The seventh and last Robotműhely machine (skill: *Hiba a programban*). The robot's program is already laid out, but it does not reach the battery. The child runs it, watches where it goes astray, taps the card to blame and puts it right. Where Robotút asks for a program, this asks the child to read one.

## The machine

| Part | What it is |
| --- | --- |
| Padló | Robotút's floor (`components/floor.tsx`): tiles, crates, battery and the robot. On the first two levels the right way is dotted. |
| Program | The cards, numbered. The card running lights up, so a step on the floor can be matched to a card. |
| Nyom | Orange dots where the robot went on its last run. They stay after it rolls back, so the child can compare. |
| Választó | Comes in under the program once the wrong card is found: the arrows or turns, or ×1 ×2 ×3. |

## A task

1. **Indulás** runs the program. It never reaches the battery, which is not the child's slip, so Csavar has no "Hoppá" here. The child may run it as often as they like, or tap a card first.
2. **Tap a card.** The wrong card lifts. A fine card wobbles, stays dimmed, and Csavar says which way to look: "idáig jól ment a robot" if the mistake is later, "a hiba előbb van" if earlier.
3. **Pick what goes there.** The robot runs the new program. A wrong pick is run too, so the child sees it fail, then the card goes back and that choice stays dimmed. A card too many has no step 3: it comes out and the robot goes.
4. The robot reaches the battery: it charges, the mended card turns green, and the next task comes.

## Levels

Seven levels, five rounds each (`FIX_ROUNDS_PER_LEVEL = 5`), on the shared ladder: up after 4 rounds in a row without help, down after 2 that needed help, cooldown 3.

| # | Name | Age | The task | Floor | Tasks/round |
| --- | --- | --- | --- | --- | --- |
| 1 | Rossz nyíl | 5 | One wrong arrow in 2–3 cards, the way dotted | 4 × 3, no crates | 3 |
| 2 | Hosszabb program | 5+ | One wrong arrow in 4–5 cards, the way dotted | 5 × 4, 1–2 crates | 3 |
| 3 | Dobozok között | 5+ | One wrong arrow in 5–7 cards, no dots | 5 × 5, 3–4 crates | 3 |
| 4 | Felesleges kártya | 6 | One card too many; tapping it takes it out | 5 × 4, 1–2 crates | 3 |
| 5 | Rossz szám | 6 | A repeat with the wrong number; pick ×1, ×2 or ×3 | 6 × 5, 1–3 crates | 3 |
| 6 | Fordulós hiba | 6–7 | One wrong card among Előre and Fordulj | 5 × 4, 0–2 crates | 3 |
| 7 | Két hiba | 7 | Two wrong arrows, found one at a time | 6 × 5, 3–4 crates | 2 |

Generator rules (`src/games/robot/fix.ts`):
- A task is the shortest program for a random floor with mistakes put in. It is kept only if the program as found fails and **exactly one** change puts it right (`singleFixes`, `doubleFixes` try them all). So the card the child looks for is the card the game means, and a wrong pick can never reach the battery.
- A task never repeats within a round. Seeded `rng` (from `flash/layout`), so tests are deterministic.

## Feedback

- "Needed help" for the ladder means two or more wrong taps, wrong picks, glows or Mutasd! in a round; one slip is fine.
- After two misses on a step the wrong card, or the right choice, glows (`hint-glow`, 2 iterations).
- **Mutasd!** glows the same thing and dots the way on the floor for the rest of the task.

## Rewards

- One bolt per finished round.
- Stickers: one per level, from **Első javítás** (level 1) to **Dupla javítás** (level 7).

## Printable sheet

The floor with the program under it. The child follows the cards with a finger, crosses out the wrong card and draws the right one in the box below it; on Felesleges kártya they only cross out, and on Rossz szám they write the number. Dots print on the first two levels. Answers show on screen only.
