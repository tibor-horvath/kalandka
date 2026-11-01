# Kalandka

Hungarian thinking games for children aged 5–7, built as an offline-capable tablet PWA.
Kalandka is the umbrella brand with two worlds: Számkertész (the counting garden, guided by Csepi the water drop) and Robotműhely (the robot workshop for the bigger ones, guided by Csavar the robot).

## Worlds

The Kalandka map (Térkép button on each world's home screen) shows the worlds as islands joined by a bridge, with a pin on the one the child was on last. Every world is open to every child; the app opens in the world chosen last. Foggy islands stand for worlds still to come.

## Számkertész games

| Game | Skill | How it plays |
| --- | --- | --- |
| Locsolás | Counting 1–20, ten-frames | Tap the cloud to water the plant with exactly N drops. Csepi counts aloud; too much water gets a gentle "Hoppá". First lap of plants needs 2–10 drops (one ten-frame); after that 11–20 (two ten-frames) and a watering can pours 5 at once. |
| Virágsor | Patterns (AB, ABC, AAB, ABB) | Pick the flower that continues the row. After the first lap of the four patterns, the missing flower moves into the row ("Melyik virág hiányzik?"). A wrong pick reads back a whole repeat the gap doesn't touch, then the whole row with the gap. |
| Számvetés | Meeting the numbers 1–20 | Open from the start. Numbers come in order; the child taps each seed so it sprouts while Csepi counts, then the numeral, its dots and its word appear. No timer. 6–10 show as a five plus the rest, 11–20 as a full ten-frame plus the rest. |
| Magvillantás | Recognising amounts at a glance | Opens after numbers 1–5 in Számvetés. Seeds show for 2.5–3 s, then the child picks how many; "Mutasd újra!" shows them again any time. A wrong pick uncovers the seeds and counts them together. |
| Méhecske | Addition and subtraction, 5 to 100 | Opens after numbers 1–10 in Számvetés. Two groups of flowers, "a + b = ?", pick the total; on the take levels the child taps b of the a flowers, the bee carries them to the hive, and they pick how many are left ("a − b = ?"). Tap a flower and the bee counts it; a wrong pick sends the bee round everything, counting aloud. Seventeen levels, adding and taking away in turn (up to 5, up to 10 gathering or counting on from a basket, up to 20, crossing ten, round tens, up to 100, up to 100 with carrying); from 20 on a bouquet stands for ten. The level follows the child (see Levels below): five first-try answers in a row step up, three sums in a row that needed help quietly step down. |
| Mézút | Writing the digits 0–9 | Open from the start. The child leads the bee along a dotted honey trail in writing order (1–9, then 0); 4, 5 and 7 take two strokes. The trail is forgiving: the finger may wander within a soft lane, and the honey always follows the trail, never the wobble. Off the lane nothing fails: the bee waits, the next stretch glows, a thread leads back and Csepi says "Gyere vissza a mézes útra!". Honey drops pop with a rising bubble sound (and a light vibration where supported); a see-through bee shows the way at the start, on "Mutasd az utat!" and after a quiet spell. After the first lap comes Halvány út: the digits in mixed order on a faint trail (thin dots and a few arrows, no lane or honey drops to follow) and no see-through bee at the start, so the child writes from memory; the finger is followed just as forgivingly. |
| Cserépbarátok | Number friends of 5 and 10 | Opens after numbers 1–10 in Számvetés. A window box of 5 or 10 pots (rows of five, like a ten-frame); some already flower, and the child picks how many more fill the box. Tapping an empty pot plants a sprout and Csepi counts it; a wrong pick has Csepi count the empty pots together. A right answer makes them bloom in a second colour and shows "3 + 7 = 10". Three levels: friends of five, friends of ten in order, friends of ten scattered. |

Each solved task earns a seed; each watered plant is added to the garden on the home screen.

## Levels

Magvillantás, Méhecske, Cserépbarátok and every Robotműhely game share one difficulty ladder (src/state/ladder.ts), and the level follows the child on its own, one step at a time:

| Game | Steps up after | Steps down after |
| --- | --- | --- |
| Magvillantás | 4 answers in a row without help | 3 in a row that needed help |
| Méhecske, Cserépbarátok | 5 answers in a row without help | 3 in a row that needed help |
| Robotműhely games | 4 rounds in a row without help (one slip in a round is fine) | 2 rounds in a row that needed help |

"Needed help" means a wrong pick, a lit-up answer or "Mutasd!". The row of the level meter is the streak: a step up shows the level-up card, a step down is quiet ("A következőt egy kicsit könnyebben gyakoroljuk."). After any step there are three tasks before the next step down, going back up after a step down takes one more in a row, and the game never steps below the starting level a parent set in Szintek. The level is kept apart from the solved counts, so a step down never takes back a sticker, a seed or a bolt; stickers come from the highest level reached. Locsolás, Virágsor, Mézút and Számvetés move by laps instead.

## Robotműhely games

| Game | Skill | How it plays |
| --- | --- | --- |
| Robotút | Algorithmic thinking, planning, debugging | Lead the little robot across the workshop floor to its battery. Ten levels, five courses each: stepping with arrows (each tap moves at once), with crates in the way; planning a whole program of arrow cards and pressing Indulás; long courses; repeat cards (×2, ×3) with arrows; turning the way the robot faces (Előre, Fordulj balra/jobbra); turning round crates; repeats with turns; two batteries in one program. On the advanced levels a battery under the floor limits the program to the shortest way plus one or two steps: teal cells are charge, yellow what the plan will use; a plan too long shows orange ghost cells past the battery. When the charge runs out the robot sputters, leans over and dims, and orange dots show the steps it was short of. Courses are generated from the level and round and always checked to be possible. A bump plays once (the robot squashes against the crate or wall, sparks, a crate wobbles or the wall edge flashes) and stops the robot; Csavar names the card ("Az első kártyánál…"), and the robot rolls back to the start; nothing fails. "Mutasd az utat!" dots the way on the floor. A finished course shows "Feltöltve!" and earns a bolt. |

| Válogatógép | Sorting and classifying, finding a rule | Parts come down the belt one at a time and the child taps the box each belongs in (the parts still to come wait in closed crates, so nothing on the belt looks "small" by comparison). Tapping the part has Csavar say what it is ("nagy piros kör"). Seven levels: two colours with nothing else changing (for 5-year-olds), three colours, shapes, big and small; Kakukktojás (three rows of four parts, tap the one that is different; exactly one feature singles it out); Két szabály (one box for one colour and shape together, e.g. red circles, the other for the rest, with near misses); Mi a szabály? (the boxes have no labels, Csavar puts in two examples that differ only in the rule, the child carries on). A part in the wrong box gets "Hoppá" and Csavar names what to look at; after a second try the right box lights up (the odd part after a third). A finished round shows "Kész!" and earns a bolt. Colours differ in lightness too (light yellow, mid red, dark blue). |
| Mérleg | More, fewer, the same; balancing; missing addends | A balance scale whose beam tips towards the heavier pan (more difference, more tilt). Seven levels: Melyik a nehezebb? (the beam is held level by two props; the child says which side will go down, 3–5 weights against at least two fewer, for 5-year-olds), then "or the same" up to 8; Tedd egyensúlyba! and Egyensúly tízig (put weights on the right pan, or take them off with Levesz, until the beam levels out); Kettes súlyok (a wide weight counts two); Hiányzó súly (pick the weight missing from the right pan); Titkos doboz (pick what the closed crate on the left weighs). A wrong compare answer has Csavar count both sides with the child, the counts showing over the pans; a wrong weight goes on the pan, the scale tips so the child sees too much or too little, then it comes off. After three tries the right answer lights up. Three tasks a round (two when balancing); a finished round earns a bolt. |
| Mintagép | Harder patterns, finding the rule | Parts ride the belt in a row that follows a rule; the child picks what fills the gap from three cards. Seven levels (four tasks a round, three on the last two levels): Két szín (red-blue-red-blue, one shape, for 5-year-olds); Hosszabb ismétlés (ABC, AAB, ABB, AABB); Szín és forma (colour and shape repeat on cycles of two and three, each wrong card off by one feature); Növekvő sor (towers growing by one, then by two); Forgó sor (an arrow turning a quarter each step, clockwise or back, later changing colour as well); Hibavadász (one part out of place after two whole repeats: tap it, it lifts off the belt, then pick what belongs there); Mintafordító (the pattern in colours above, the same pattern in arrows below, one arrow per colour). The row always shows at least two whole repeats. A right card lands in the gap with a green tick on the gap and the card, and Csavar reads the finished row aloud. A wrong card sits in the gap a moment with an orange cross, then goes back and stays dimmed; Csavar reads the row up to the gap and brackets mark each repeat. After two misses the right card lights up (after three, on Hibavadász, the part out of place). Tapping a part has Csavar name it. A finished round shows "Kész!" and earns a bolt. |
| Tükörgép | Mirroring and symmetry | A lamp board with a mirror across it: what shines on one side has to shine on the other, just as far from the mirror. Seven levels (three tasks a round, two on the picture levels): Egy lámpa (one lamp, tap where its reflection goes, for 5-year-olds); Több lámpa (two to four lamps); Fél kép (half a picture to finish: a heart, a robot, a rocket, a house, a butterfly, a flower; whole, Csavar names it); Színes kép (the same pictures in their colours: pick a paint pot, then tap); Fel-le tükör (the mirror lies flat, top to bottom); Tükör vagy másolat? (pick the true reflection of a shape from a plain copy and a quarter turn); Hibás tükör (the machine lit the other half with one lamp missing or one too many: tap the place). A right lamp lights with a pop; a whole board makes the mirror flash once. A wrong lamp blinks orange and goes out, and Csavar counts the steps from the mirror ("két lépésre van a tükörtől"); after two misses the lamp and its place across the mirror glow, with dots between them. "Mutasd!" shows the next pair the same way. A wrong card sits in the frame a moment and stays dimmed. A finished round shows "Kész!" and earns a bolt. |
| Kódzár | Signs and codes, reading a code key, encoding and decoding | A crate shut with a code lock: the lock shows the code in signs, and each keypad press fills the next slot, left to right. Seven levels (three tasks a round, two on the last): Színzár (copy two colour lamps, for 5-year-olds); Hosszabb zár (three or four lamps, repeats allowed); Kódtábla (a code key beside the crate says what each lamp means, the keypad shows pictures: fogaskerék, elem, villáskulcs, mágnes); Új kódtábla (three or four signs, the key mixed up for every task, a fourth picture on the keypad that no lamp means); Pöttykód (dice faces to numerals, with a faded dots → numeral key); Üzenet (a picture message for Kutyabot, turned into lamps by reading the key backwards; Kutyabot fetches the first picture); Hiányzó jel (one key row covered: a note stuck beside the crate shows two lamps and their meanings, the child picks the covered meaning from three cards, then opens the lock). Tapping a sign or a key row has Csavar name it. A wrong button sits in the slot a moment with an orange cross and pops back out; Csavar names what to look at ("Nézd meg a második lámpát!", "Keresd meg a kék lámpát a kódtáblán!", or counts the dots aloud) and that key row glows once. After a second miss on a slot the right button lights up; filled slots are never cleared. "Mutasd!" lights the sign, its key row and the right button. The last slot opens the crate once (the shackle lifts, the lid tips, a bolt inside); a finished round shows "Kész!" and earns a bolt. On an upright phone the key goes above the crate when they do not fit side by side. |
| Hibakereső | Finding and fixing bugs in a program | The robot's program is already laid out, but it does not reach the battery. The child presses Indulás and watches: the card running lights up and the robot leaves an orange trail on the floor, then rolls back to the start. They tap the card to blame, it lifts, and they pick what belongs there; the robot tries again. Seven levels (three tasks a round, two on the last): Rossz nyíl (one wrong arrow on a small floor, with the right way dotted, for 5-year-olds); Hosszabb program (more cards, a crate or two, still dotted); Dobozok között (no dots); Felesleges kártya (one card too many: tap it and it comes out); Rossz szám (a repeat with the wrong number: pick ×1, ×2 or ×3); Fordulós hiba (the robot goes the way it faces); Két hiba (two wrong cards, one at a time, the robot getting further after the first). Every task is built so exactly one change puts it right. A card that is fine wobbles and stays dimmed, and Csavar says which way to look ("Ez a kártya jó, idáig jól ment a robot."); a wrong pick is run, so the child sees it does not get there, and stays dimmed. After two misses the wrong card or the right choice lights up. "Mutasd!" does the same and dots the way on the floor. A charged battery and a green card show each task done; a finished round shows "Kész!" and earns a bolt. |

### Robotműhely rewards

| Part | How it works |
| --- | --- |
| Robotépítő | The child's own robot. Each solved Robotút course and Válogatógép, Mérleg, Mintagép, Tükörgép, Kódzár or Hibakereső round earns a bolt (csavar); bolts buy parts in six slots (head, antenna, body, arms, legs, paint), 2–7 bolts each. A bought part stays the child's: swapping back is free. Every part on the cards is drawn on the child's own robot, so they see it before buying. |
| Robot friends | Kutyabot at 2 new parts, a drone at 5, Csavarka at 8, Macskabot at 12. Each is welcomed once with its own screen and stays on the shelf and in the workshop; tapping one makes it hop. |
| Stickers | Robotműhely has its own album page (the album opens on the world it was opened from, with a tab for the other). Robotút: Első út, Tervező, Fordulós, then Ismétlő and Két elem. Válogatógép: Első válogatás, Formák, Kakukktojás, then Két szabály and Szabálykereső. Mérleg: Első mérés, Egyensúly, Kettes súly, then Hiányzó súly and Titkos doboz. Mintagép: Első minta, Szín és forma, Forgató, then Hibavadász and Mintafordító. Tükörgép: Első tükör, Fél kép, Fel-le tükör, then Tükörkép and Tükörjavító. Kódzár: Első zár, Kódtábla, Pöttykód, then Üzenetküldő and Kódfejtő. Hibakereső: Első javítás, Dobozkerülő, Számjavító, then Fordulójavító and Dupla javítás. Each world's new stickers pop on its own home screen. |

The same rules as the garden: rewards are only ever added, nothing is random, nothing depends on time played.

## Rewards

| Part | How it works |
| --- | --- |
| Kiskert | The child's own garden, opened from the eighth plot on the home screen. Seeds are planted in ten beds: a flower (3), a blueberry bush (6) or a pear tree (10). A planting starts as a seedling and grows as the child solves tasks in any game: a flower in 3, a bush in 5, a tree in 8 (shown as dots in rows of five, like a ten-frame). Once all ten are planted a second plot of ten opens (1. kert / 2. kert tabs). |
| Care and Kamra | A grown bush or tree ripens one fruit per solved task, picked one tap at a time and counted aloud. A few tasks after watering it gets thirsty and stops ripening until watered (free; it never wilts). In the Kamra the basket's fruit is counted out into treats for the shelf: Áfonyalekvár (3 berries), Körtebefőtt (3 pears), Gyümölcspite (2 + 2); once all twenty beds are planted, spare seeds bake a Magos kalács (5 seeds). |
| Visitors | A growing garden brings visitors who stay: Süni at 3 grown plants, Katica at 5, a butterfly at 8, a blackbird at 10, Béka at 14 and Mókus at 20. Each is welcomed once with its own screen, and Csepi says which treat they like. |
| Gifts and decorations | Tapping a visitor opens their corner: the treat they ask for and the three things they make in return. Each visitor takes three gifts from the pantry shelf, one treat, then two, then three, counted out aloud: Süni and the butterfly like Áfonyalekvár, Katica Gyümölcspite, Béka Körtebefőtt, the blackbird and Mókus Magos kalács. Every gift leaves a decoration in the visitor's lane for good (Süni: Gomba, Levélkupac, Sünház; Katica: Pöttyös kő, Kis kerítés, Százszorszép-csokor; butterfly: Levendula, Napraforgó, Virágkapu; blackbird: Madáretető, Madáritató, Madárodú; Béka: Kis nádas, Ugróköves ösvény, Kis tó; Mókus: Toboz, Fatönk, Hinta). A visitor whose gift is on the shelf shows that treat in a badge. After all eighteen, a "Kész a kert!" card shows every visitor once; the Kamra keeps working after that. |
| Matricáim | Three stickers per game, one for each skill step (e.g. Mézút: writing 1–5, 6–9, all digits); Mézút adds two for Halvány út (5 digits, then all ten on the faint trail). The Kiskert has a row of its own: Első ajándék, Minden lakónak (every visitor has had a gift) and Kész a kert (all eighteen). Empty places show what comes next; tapping a sticker has Csepi say what it is for. |
| New sticker | Back on the home screen, a newly earned sticker spins in, sparkles, then flies into its place in the game's album page and settles with a squash. Tapping it replays the animation; with reduced motion it simply appears in place. |

Rewards are only ever added: nothing wilts, nothing is taken away, nothing is random and nothing depends on time played. Stickers come from skill progress, never from the number of tasks; a starting level set by parents (or progress from before the stickers existed) fills the album without a celebration.
The parents' area opens through a gate (a two-digit multiplication such as 6 × 9 on a keypad, which 5–7 year olds cannot do yet). It is a separate full-screen space with a menu: **Áttekintés** (today's time ring, the last 7 days, plain-language notes on what is going well or hard, progress per game; every game keeps its last few solved tasks and whether each needed help, so each game gets a note: going well, could use help, or too little play this week, with an idea to try at home), **Képernyőidő** (daily limit, +10 minutes, rest now, warning and finish-the-task switches, evening rest), **Szintek** (a starting level per game with −/+ steppers, all games open) and **Beállítások** (Csepi's voice and speaking speed, sound effects, privacy, a two-step progress reset).

**Nyomtatás** (printable sheets): every game as an A4 worksheet for play without a device, one game per printout. It is in the parents' area, and also open without the gate from a Nyomtatás button on Ki játszik? and on both home screens (a full-screen Feladatlapok view with a child switch; like the parents' area it pauses the play clock). The tasks come from the games' own generators at the child's current level (a parent can pick another), and tapping becomes circling, colouring, drawing a line or crossing out: Számvetés shows the number (in the shape Mézút teaches) and the child colours that many seeds, Locsolás colours N drops in a ten-frame, Mézút traces each digit on a dotted trail with start dots and arrows and then writes it alone, Robotút draws the route and the program cards, Válogatógép joins each part to its box, Tükörgép colours the reflected lamps, Kódzár draws or colours the meaning into the box under each sign (on Hiányzó jel the covered key row first), Hibakereső crosses out the wrong card and draws the right one under it, and so on. Parents choose how many tasks go on a page (Kevesebb, nagyobb / Normál / Sok, kisebb) and up to five pages, each with new tasks. Every task has a star to colour when it is done, where colour is the task (Válogatógép, Mintagép, Tükörgép's coloured pictures, Kódzár's lamps) red is also striped and blue dotted, with a key on the sheet, so black-and-white printers work too; and every page carries the Kalandka logo, the world's name and the address the app runs at. The answers show only on screen (Feladatlap / Megoldások), never on paper; the last choice per child and game is kept on the device so a finished sheet can be checked later (src/print).

Screen time: only active play counts (app visible, parents' area closed) and the count starts again each day. Two minutes before the end a badge appears and Csepi says so; at the limit a child in a game may finish the task (up to 2 minutes), then a rest screen appears that only the parents' gate dismisses. "Pihenő most" ends play for today; evening rest blocks play from 18–20:00 until 7:00. Resetting progress does not reset today's play time.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # game logic tests (vitest)
npm run build    # type-check + production build with service worker, then the offline check:
                 # every built file must be precached and every precached file must exist
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
  games/pots/logic.ts       Cserépbarátok levels, rounds, pot layout and Csepi's lines
  games/robot/path.ts       Robotút levels, course generator (shortest-way search), running a program, energy, Csavar's lines
  games/robot/seq.ts        Mintagép levels, pattern rows and choices, reading the row aloud, Csavar's lines
  games/robot/mirror.ts     Tükörgép levels, reflecting across the mirror, pictures, reflection-or-copy shapes, the board with one fault, Csavar's lines
  games/robot/sort.ts       Válogatógép levels, parts and boxes, odd-one-out rows, hidden-rule examples, Csavar's lines
  games/robot/scale.ts      Mérleg levels and tasks, tilt, weights on a pan, Csavar's lines
  games/robot/code.ts       Kódzár levels, codes and code keys, the covered row and its note, Csavar's lines
  games/robot/fix.ts        Hibakereső levels, programs with a mistake put in, the check that only one change fixes them, Csavar's lines
  lib/numbers.ts            Hungarian number words 1–100 ("két csepp" vs. counting "kettő", articles)
  lib/speech.ts             Csepi's voice via browser hu-HU text-to-speech (placeholder for recorded audio)
  lib/sound.ts              synthesised pops and chimes (Web Audio) and light vibration
  state/progress.tsx        seeds, garden and rounds, saved to localStorage
  state/rewards.ts          Kiskert planting and growth, care, Kamra recipes, visitors, gifts and decorations, stickers and which ones are new
  state/worlds.ts           the Kalandka worlds and which one the child is in
  state/robotParts.ts       Robotépítő parts, buying and wearing them, robot friends
  state/screenTime.ts       daily limit, play clock and 14-day history, bonus, rest now, evening rest
  state/insights.ts         plain-language notes for parents; the multiplication gate
  state/levels.ts           per-game level settings for the parents' corner (read current, apply new start)
  components/               Csepi, Csavar and the robot art, the workshop floor (Robotút, Hibakereső), artwork, buttons, speech bubble, home-screen top-bar controls (hub), scaling stage (1180×820 tablet, 390 px phone)
  screens/                  WorldMap, Home, Garden (Kiskert), Album (Matricáim), Learn, Water, Patterns, Flash, Add, Trace, Pots, Rest; robot/ (RobotHome, Path, Sort, Scale, Seq, Mirror, Code, Fix, Workshop); parents/ (Gate, ParentArea and its pages)
```

## Design rules carried into code

- No failure states, timers or red: feedback is "Hoppá" orange and Csepi's surprised face.
- Praise effort ("Ügyes vagy!"), never cleverness.
- Bubble text shows digits; speech uses number words with correct Hungarian forms.
- Pattern flowers differ in shape and lightness as well as colour (colour-blind friendly).
- Touch targets are at least 64 px; the layout is a fixed 1180×820 stage scaled to the screen.
- Phones get a 390 px phone stage instead, portrait or landscape (`components/Stage.tsx`, `styles/phone.css`), for every screen. Fixed-size drawings (seed beds, flower beds, the honey trail) scale into the room left for them (`components/FitBox.tsx`); in portrait the seed beds and Méhecske's flower beds fold, the second group under the first, so they can be drawn bigger. Turning the phone re-lays the screen out with a short tilt-and-settle (skipped with reduced motion). On phones, targets are at least 44 px and the game's choices stay large.

## Not done yet

- Recorded Hungarian voice for Csepi (the browser voice is a stand-in).
- Parents' overview of stickers and the garden.

## Deploy

The app is hosted on Azure Static Web Apps; see [docs/deploy.md](docs/deploy.md) for setup, releases, custom domains and rollback.

## CI

GitHub Actions, built from the reusable workflows in [tibor-horvath/ci-toolkit](https://github.com/tibor-horvath/ci-toolkit) (pinned to `@v1`).

| Workflow | When | What |
| --- | --- | --- |
| `ci.yml` | push to `main`, PRs | `npm test` (`vitest --run`) and `npm run build` (includes `tsc -b`); gitleaks secret scan of the new commits; on `main`, updates the release PR (release-please); merging that PR cuts a release and deploys the tested `dist/` to Azure Static Web Apps |
| `pr-quality.yml` | PRs | Lighthouse on `dist/` (performance ≥ 0.8, accessibility ≥ 0.9, best practices ≥ 0.75) |
| `pr-title.yml` | PRs | PR title must be a Conventional Commit (`feat:`, `fix:`, …) |
| `audit.yml` | PRs touching dependencies, Mondays | `npm audit` of runtime dependencies, fails on high or critical |
| `workflow-lint.yml` | changes under `.github/` | actionlint + shellcheck |

Dependabot (`.github/dependabot.yml`) opens grouped weekly npm and Actions update PRs.
