# Kalandka

Hungarian thinking games for children aged 5–7, built as an offline-capable tablet PWA.
Kalandka is the umbrella brand with two worlds: Számkertész (the counting garden, guided by Csepi the water drop) and Robotműhely (the robot workshop for the bigger ones, guided by Csavar the robot).

## Worlds

The Kalandka map (Térkép button on each world's home screen) shows the worlds as islands joined by a bridge, with a pin on the one the child was on last. Every world is open to every child; the app opens in the world chosen last. Foggy islands stand for worlds still to come.

## Documentation

| Page | What it covers |
| --- | --- |
| [Számkertész games](docs/garden-games.md) | The seven garden games and how each plays |
| [Robotműhely games](docs/robot-games.md) | The seven workshop machines and how each plays |
| [Levels](docs/levels.md) | The shared difficulty ladder: when a game steps up or down |
| [Rewards](docs/rewards.md) | The reward pod, Kiskert, visitors and gifts, the robot builder and friends, stickers |
| [For parents](docs/parents.md) | The parents' area, printable sheets and screen time |
| [Deploy](docs/deploy.md) | Azure Static Web Apps setup, releases, custom domains and rollback |
| Design notes | [Kódzár](docs/kodzar.md), [Hibavadász](docs/hibakereso.md) |

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
  worlds/                   one folder per world: its games, screens, art, printable sheets and styles.
                            A world imports only shared code (everything outside worlds/), never another world.
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
    robot.css                 the workshop's styles
  lib/numbers.ts            Hungarian number words 1–100 ("két csepp" vs. counting "kettő", articles)
  lib/rng.ts                the seeded random every game draws its rounds from
  lib/speech.ts             Csepi's voice via browser hu-HU text-to-speech (placeholder for recorded audio)
  lib/sound.ts              synthesised pops and chimes (Web Audio) and light vibration
  app/                      routing, device (tablet or phone) and the screen-time hook
  state/games.ts            every game in one list: id, world, name and the save fields that count its rounds
  state/progress.tsx        seeds, bolts, task clocks, garden and rounds, saved to localStorage
  state/profiles.tsx        several children on one device, each with their own progress
  state/transfer.ts         moving every profile to a new device by QR codes
  state/ladder.ts           the shared difficulty ladder: levels per game, when to step up and down
  state/levelMeter.ts       what the in-game level meter shows
  state/unlocks.ts          which garden games open after Számmagok progress
  state/pod.ts              the reward pod: four solved tasks pay a seed or a bolt; the task clock per world
  state/garden/beds.ts      Kiskert seeds, beds and plots, tree and flower kinds (Magtár), the border
  state/garden/harvest.ts   care (thirst and fruit), the basket and Kamra recipes
  state/garden/veg.ts       the Veteményes and the bee's pollen
  state/garden/visitors.ts  visitors and the way to the next one, gifts, decorations and snacks
  state/stickers.ts         the album: sticker rows, level stickers, worksheet pages, which stickers are new
  state/worlds.ts           the Kalandka worlds and which one the child is in
  state/robotParts.ts       Robotépítő parts, buying and wearing them, robot friends and the way to the next one, battery and oil
  state/screenTime.ts       daily limit, play clock and 14-day history, bonus, rest now, evening rest
  state/taskLog.ts          the last few solved tasks per game, for the parents' notes
  state/insights.ts         plain-language notes for parents; the multiplication gate
  state/levels.ts           per-game level settings for the parents' corner (read current, apply new start)
  print/                    the worksheet frame and the catalog of every world's sheets, the cut-out pages (extras.tsx), QR links
  components/               Csepi, the islands, sticker art, buttons, speech bubble, game frame and level meter, home-screen top-bar controls (hub), scaling stage (1180×820 tablet, 390 px phone)
  screens/                  screens of no one world: Landing, WorldMap, Picker (Ki játszik?), Album (Matricáim), PrintArea, Rest, the list of game screens (gameScreens.ts); parents/ (Gate, ParentArea and its pages)
```
## Design rules carried into code

- No failure states, timers or red: feedback is "Hoppá" orange and Csepi's surprised face.
- Praise effort ("Ügyes vagy!"), never cleverness.
- Bubble text shows digits; speech uses number words with correct Hungarian forms.
- Pattern flowers differ in shape and lightness as well as colour (colour-blind friendly).
- Touch targets are at least 64 px; the layout is a fixed 1180×820 stage scaled to the screen.
- Phones get a 390 px phone stage instead, portrait or landscape (`components/Stage.tsx`, `styles/phone.css`), for every screen. A tablet held upright gets the portrait layout too, on a wider stage drawn about 1.4× larger (`.stage--tall-tablet`). Fixed-size drawings (seed beds, flower beds, the honey trail) scale into the room left for them (`components/FitBox.tsx`); in portrait the seed beds and Méhkas's flower beds fold, the second group under the first, so they can be drawn bigger. Turning the device re-lays the screen out with a short tilt-and-settle (skipped with reduced motion). On phones, targets are at least 44 px and the game's choices stay large.

## Not done yet

- Recorded Hungarian voice for Csepi (the browser voice is a stand-in).
- Parents' overview of stickers and the garden.

## Deploy

The app is hosted on Azure Static Web Apps; see [docs/deploy.md](docs/deploy.md).

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

## Contributing

Bug reports, ideas and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Copyright (C) 2026 Tibor Horváth. Kalandka is free software under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only): anyone may use, change and share it, and anyone who shares a changed version, or runs one for others over a network, must publish its source under the same license.
