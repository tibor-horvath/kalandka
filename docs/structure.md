# Code structure

Where things live in `src/`. A world imports only shared code (everything outside `worlds/`), never another world.

## Worlds

Each world has its own folder: its games, screens, art, printable sheets and styles.

```
worlds/garden/            Számkertész, Csepi's world
  games/water/logic.ts      pure watering rules: status, feedback text and speech, ten-frame slots
  games/patterns/logic.ts   pure pattern rounds and hints
  games/learn/logic.ts      Számmagok rounds, number naming, Villámszem unlock rule
  games/flash/logic.ts      Villámszem levels and answers
  games/flash/layout.ts     seed layouts shared by both seed games
  games/add/logic.ts        Méhkas levels, sums, bouquets
  games/trace/logic.ts      Mézút digit trails, forgiving finger following, honey-drop checkpoints
  games/pots/logic.ts       Cserépbarátok levels, rounds, pot layout and Csepi's lines
  screens/                  Home, Garden (Kiskert), Learn, Water, Patterns, Flash, Add, Trace, Pots
  art.tsx, seeds.tsx        drops, flowers, pots, bees and the seed fields
  kiskert.tsx               the Kiskert's plants, fruit, visitors, treats and decorations
  print.tsx                 the garden's sheet list; each game's sheets are in games/<game>/print.tsx, shared drawing in printKit.tsx

worlds/robot/             Robotműhely, Csavar's world
  games/path.ts             Robotút levels, course generator (shortest-way search), running a program, energy, Csavar's lines
  games/seq.ts              Mintagép levels, pattern rows and choices, reading the row aloud, Csavar's lines
  games/mirror.ts           Tükörgép levels, reflecting across the mirror, pictures, reflection-or-copy shapes, the board with one fault, Csavar's lines
  games/sort.ts             Válogatógép levels, parts and boxes, odd-one-out rows, hidden-rule examples, Csavar's lines
  games/scale.ts            Mérleg levels and tasks, tilt, weights on a pan, Csavar's lines
  games/code.ts             Kódzár levels, codes and code keys, the covered row and its note, Csavar's lines
  games/fix.ts              Hibavadász levels, programs with a mistake put in, the check that only one change fixes them, Csavar's lines
  screens/                  RobotHome, Workshop (Robotépítő), Path, Sort, Scale, Seq, Mirror, Code, Fix; a chunk of their own (lazy.ts)
  art.tsx, parts.tsx        Csavar, the robot parts and the workshop art
  floor.tsx                 the workshop floor (Robotút, Hibavadász)
  print.tsx                 the workshop's sheet list; each game's sheets are in games/<game>.print.tsx, shared helpers in printKit.ts
  robot.css                 the workshop's styles (and the Kalandka map's)

worlds/tower/             Óratorony, Kakuk's world
  games/activities.ts       a day's things: when in the day each comes and how long it takes (Napirend, Homokóra)
  games/day.ts              Napirend levels, rounds and Kakuk's lines
  games/season.ts           Évszakok: seasons, days of the week, yesterday and tomorrow, months
  games/clock.ts            Óraállító, Hány óra? and Digitóra: clock levels, the usual mix-ups as wrong cards, Kakuk's lines
  games/sleep.ts            Kakuk alszik: time gone by between two clocks
  games/sand.ts             Homokóra: which takes longer, a moment, minutes or hours
  games/common.ts           Kakuk's line type, seeded shuffles, the two-misses rule
  screens/                  TowerHome, Town (Kisváros), Day, SeasonGame, SetClock, ReadClock and Digital, Sleep, Sand, and the shared kit; a chunk of their own (lazy.ts)
  art.tsx                   Kakuk, the clock face, bells, the day's pictures, seasons, the places and the Kisváros buildings
  print.tsx                 the Óratorony's sheets
  tower.css                 the Óratorony's styles
```

## Shared code

```
lib/numbers.ts            Hungarian number words 1–100 ("két csepp" vs. counting "kettő", articles)
lib/time.ts               Hungarian clock times ("fél három", "negyed nyolc"), digital readings, hand angles, time gone by
lib/rng.ts                the seeded random every game draws its rounds from
lib/speech.ts             the guides' voices via browser hu-HU text-to-speech (placeholder for recorded audio)
lib/sound.ts              synthesised pops and chimes (Web Audio) and light vibration
app/                      routing, device (tablet or phone) and the screen-time hook

state/games.ts            every game in one list: id, world, name and the save fields that count its rounds
state/worlds.ts           the Kalandka worlds and which one the child is in
state/progress.tsx        rewards, task clocks, gardens, towns and rounds, saved to localStorage
state/profiles.tsx        several children on one device, each with their own progress
state/transfer.ts         moving every profile to a new device by QR codes
state/ladder.ts           the shared difficulty ladder: levels per game, when to step up and down
state/levelMeter.ts       what the in-game level meter shows
state/unlocks.ts          which garden games open after Számmagok progress (inside the garden only)
state/pod.ts              the reward pod: solved tasks pay a seed, a bolt or a bell; the task clock per world
state/balance.ts          each world's reward to spend, and its name
state/garden/beds.ts      Kiskert seeds, beds and plots, tree and flower kinds (Magtár), the border
state/garden/harvest.ts   care (thirst and fruit), the basket and Kamra recipes
state/garden/veg.ts       the Veteményes and the bee's pollen
state/garden/visitors.ts  visitors and the way to the next one, gifts, decorations and snacks
state/robotParts.ts       Robotépítő parts, buying and wearing them, robot friends and the way to the next one, battery and oil
state/town.ts             the Kisváros: buildings, bells, the square's time of day
state/stickers.ts         the album: sticker rows, level stickers, worksheet pages, which stickers are new
state/screenTime.ts       daily limit, play clock and 14-day history, bonus, rest now, evening rest
state/taskLog.ts          the last few solved tasks per game, for the parents' notes
state/insights.ts         plain-language notes for parents; the multiplication gate
state/levels.ts           per-game level settings for the parents' corner (read current, apply new start)

print/                    the worksheet frame and the catalog of every world's sheets, the cut-out pages (extras.tsx), QR links
components/               the guides, the islands, sticker art, buttons, speech bubble, game frame and level meter, home-screen top-bar controls (hub), scaling stage (1180×820 tablet, 390 px phone)
screens/                  screens of no one world: Landing, WorldMap, Picker (Ki játszik?), Album (Matricáim), PrintArea, Rest, the list of game screens (gameScreens.ts); parents/ (Gate, ParentArea and its pages)
```
