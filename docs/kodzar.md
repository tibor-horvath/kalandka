# Kódzár: design

The sixth Robotműhely machine (skill: *Jelek és kódok*). A crate in the workshop is shut with a code lock. The code is shown in signs and the child presses the keypad buttons to fill the lock, one slot after another. When the last slot fills, the lock opens the crate and the child gets a bolt.

What it teaches: one thing can stand for another (sign → meaning), reading a code key, keeping the order, encoding as well as decoding, and finally working out a missing rule from an example. It sits between Mintagép (rules in a row) and Robotút (programs made of signs).

## The machine

| Part | What it is |
| --- | --- |
| Láda | The crate, centre stage, with the lock on its front. It opens once when the code is right, with no idle animation. |
| Zár | A row of 2–4 slots (lamps) under the code. The slot to fill next has a dashed teal ring, and filled slots stay lit. |
| Kód | The signs to read, above the slots: colour lamps, dice dots or pictures. Tapping a sign makes Csavar name it ("piros lámpa"). |
| Kódtábla | The code key, a board to the left of the crate (from level 3). Each row is *sign → meaning*. Tapping a row makes Csavar read it ("A piros lámpa: fogaskerék."). |
| Gombsor | The keypad under the crate: 3–4 big buttons (210 × 184, like Mintagép's cards). Each press fills the next slot. |

Colours are red, blue and yellow, the same as in Válogatógép and Mintagép (`COLORS` in `sort.ts`), so they also differ in lightness. The pictures are fogaskerék (gear), elem (battery), villáskulcs (spanner) and mágnes (magnet), each with a different outline. *Csavar* isn't used as a picture name because it's also the guide and the reward.

## Levels

Seven levels, five rounds each (`CODE_ROUNDS_PER_LEVEL = 5`), on the shared ladder: up after 4 rounds in a row without help, down after 2 that needed help, cooldown 3.

| # | Name | Age | The task | Keypad | Tasks/round |
| --- | --- | --- | --- | --- | --- |
| 1 | Színzár | 5 | Copy 2 colour lamps in order. Never two of the same colour. | 3 colours | 3 |
| 2 | Hosszabb zár | 5+ | Copy 3–4 colour lamps. Repeats are allowed (piros, piros, kék) but the lamps are never all the same colour. | 3 colours | 3 |
| 3 | Kódtábla | 5+ | The lock shows colour lamps and the keypad shows pictures. Read each lamp's picture from the 3-row key. 2–3 signs. The key stays the same for the round. | 3 pictures | 3 |
| 4 | Új kódtábla | 6 | As level 3, but with 3–4 signs. The key is mixed up again for **every task**, so the child has to read it and can't rely on memory. The keypad gets a 4th picture that no lamp means (there are only three lamp colours). | 4 pictures | 3 |
| 5 | Pöttykód | 6 | The code is dice faces (1–6 dots) and the keypad shows numerals. This links back to Számkertész (Magvillantás, Számvetés). A dots → digits key shows faded and lights up on "Mutasd!". | 4 numerals | 3 |
| 6 | Üzenet | 6–7 | Encoding: Csavar wants to send Kutyabot a message. The message is 2–3 pictures and the keypad shows colour lamps, so the child reads the key backwards (picture → sign). The lamps travel along a wire to Kutyabot, who fetches the thing shown by the first picture. | 3 colours | 3 |
| 7 | Hiányzó jel | 7 | One key row is covered (?). A note stuck on the crate shows an opened code with its answer, and the child picks the hidden meaning from 3 cards (first step, like Hibavadász). The row then uncovers and the child opens the lock (second step). | 3 pictures | 2 |

Generator rules (`src/games/robot/code.ts`):
- A code never repeats the previous task's code within a round.
- Level 1: two different colours. Level 2: at least two different colours.
- Levels 3, 4, 6 and 7: the key maps the three lamps to three of the four pictures, one-to-one. On level 4 the mapping changes every task. On level 7 the note shows two different lamps, the covered one among them, and the cards are its meaning, another row's meaning and the picture no lamp means.
- Level 5: dot counts 1–6. The keypad holds the numerals in the code plus their nearest neighbours (±1, further out at the ends of 1–6), four buttons in all.
- Seeded `rng` (from `flash/layout`) so tests are deterministic.

## Feedback

Nothing fails and nothing is red. The rules are the same as the other machines:

- **Right press:** the button's sign drops into the slot with a click, the slot lights teal and the next slot gets the ring.
- **Wrong press:** the sign sits in the slot a moment with an orange cross (`MissMark`), then pops back out, and the button dims once. Csavar says what to look at:
  - Copy levels: "Nézd meg a második lámpát!"
  - Key levels: "Keresd meg a kék lámpát a kódtáblán!", and that key row glows once.
- **Second miss on the same slot:** the right button glows (`hint-glow`, 2 iterations). Filled slots are never cleared.
- **Mutasd!:** the current sign, its key row and the right button glow together until the slot is filled.
- **Lock opens:** the shackle lifts, the lid tips open, a bolt sits inside, and Csavar cheers "Kinyílt!". The animation plays once. With reduced motion the crate just shows open.
- "Needed help" for the ladder means a wrong press, a glow or Mutasd! anywhere in the round, except that one slip in a round is fine (as on the other machines).

## Rewards

- One bolt per finished round.
- Stickers: **Első zár** (first round), **Kódtábla** (level 3), **Pöttykód** (level 5), then **Üzenetküldő** (level 6) and **Kódfejtő** (level 7).
- On RobotHome, Kódzár replaces its entry in `COMING` and gets a "Új gép!" tile with a crate-and-lock picture. Hibakereső is the only machine left in `COMING`.

## Printable sheet

Each task becomes a crate with empty boxes under the code and the key beside it. The child colours or draws the meaning into each box, and on level 5 writes the digit. Red boxes are also striped and blue ones dotted, with a key on the sheet. On level 7 the child first draws the hidden row. Answers show on screen only.

## Files

- `src/games/robot/code.ts`: levels, task generator, key, Csavar's lines. Plus `code.test.ts`.
- `src/screens/robot/Code.tsx`: the screen.
- `src/styles/robot.css`: `.code-*` styles, phone layout (the key folds above the crate in portrait).
- `src/state/ladder.ts`: `code` entry. Also update `levels.ts`, `rewards.ts` (stickers) and `insights.ts` (parents' note).
- `src/print/`: the sheet.
- README: a Robotműhely table row, the stickers and the Structure line.
