# Contributing to Kalandka

Thank you for helping. Kalandka is a set of Hungarian thinking games for children aged 5–7, so every change is checked against what a five-year-old will see and hear.

## Before you start

- For a bug, open an issue with what you did, what you expected and the device and browser.
- For a new game, level or bigger change, open an issue first so we can agree on it before you build it.
- For a security problem, do not open an issue: see [SECURITY.md](SECURITY.md).

## Ground rules for the games

- Every new game or level needs an easy start that a five-year-old can do.
- Every world stays open to every child: no locks by age or progress.
- No failure states, timers or red: a wrong answer gets "Hoppá" orange and a gentle hint.
- Calm motion: no looping decorative animations. Finishing a task must be clearly visible.
- Praise effort ("Ügyes vagy!"), never cleverness.
- Rewards are only ever added: nothing is taken away, nothing is random, nothing depends on time played.
- Text the child sees or hears is in correct, simple Hungarian; speech uses number words (see `src/lib/numbers.ts`).
- Touch targets are at least 64 px on the tablet stage and 44 px on phones.

The README has the full rules under "Design rules carried into code".

## Making a change

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

- Keep game rules in the game's `logic.ts` (pure functions with tests) and the drawing in `screens/`.
- Update the docs when a game's behaviour changes (`docs/garden-games.md`, `docs/robot-games.md`, `docs/levels.md`).
- PR titles must be Conventional Commits (`feat:`, `fix:`, `docs:` …); they become the commit message.
- CI runs the tests, the build, a secret scan and Lighthouse; a PR is merged once they pass and it has been reviewed.

## Adding a game

Each game is its own rules plus a screen. Everything the games share — the level ladder, the reward, the parents' notes, the frame around the screen — is built once and the game plugs into it. Start by adding the game to the list; the type checker and `npm test` then point at every place that still needs it.

1. **Rules** — `src/worlds/<world>/games/` (a garden game in `games/<id>/logic.ts`, a workshop game in `games/<id>.ts`) with its test beside it: the levels (an array of `{ name, … }`, easiest first, with an easy first level for five-year-olds), a pure function that builds round `n` on level `l`, and Csepi's or Csavar's lines.
2. **The game list** — add the id to `GAME_IDS` and an entry to `GAMES` in `src/state/games.ts` (world, name, and the save fields that count its rounds), then add those two fields to `Progress` and `DEFAULT_PROGRESS` in `src/state/progress.tsx`. The order in `GAME_IDS` is the order on the island.
3. **The ladder** — the game's levels in `LADDER_LEVELS` and how many tasks step up and down in `LADDER_RULES` (`src/state/ladder.ts`). The parents' level settings and their hint text are made from these.
4. **The screen** — `src/worlds/<world>/screens/<Name>.tsx`, registered in `GAME_SCREENS` (`src/screens/gameScreens.ts`; a workshop screen also goes in `src/worlds/robot/screens/world.ts`, as its world loads on its own). App keys the screen by round, so each task starts fresh:

   ```tsx
   export function Example({ onBack }: { onBack: () => void }) {
     const { progress } = useProgress();
     const { level, win, meter, levelUp } = useLadderRound('example');
     const [round] = useState(() => buildRound(level, progress.exampleRound));
     const [solved, setSolved] = useState(false);
     // On the right answer: setSolved(true); win(neededHelp);

     return (
       <GameShell game="example" className="screen--example" title="Példa" meter={meter} justSolved={solved}
         levelUp={levelUp} onBack={onBack} onReplay={() => speak(feedback.speech)}>
         {/* the game itself; a workshop game shows <WinCard onNext={levelUp.advance} /> when solved */}
       </GameShell>
     );
   }
   ```

   `win` counts the task once: the seed or bolt, the parents' task log and the ladder step. `GameShell` draws the back button, title, level meter, replay button and level-up card in the world's look.
5. **The island** — the game's place in `TILES` in `src/worlds/garden/screens/Home.tsx` or `src/worlds/robot/screens/RobotHome.tsx` (label and picture). Each island has room for seven games: an eighth needs a new spot and trail in every island shape in `src/components/island.tsx`.
6. **The parents' corner** — `STEP_WORDS` in `src/state/levels.ts`, `ABOUT` in `src/screens/parents/LevelsPage.tsx`, the game's note texts in `GAME_TEXTS` (`src/state/insights.ts`), and what it counts in `COUNTED` (`src/screens/parents/Overview.tsx`), if anything.
7. **Stickers** — an album row in `STICKER_GAMES` and the game's stickers in `STICKERS` (`src/state/rewards.ts`).
8. **Printable sheets** — a `spec({ … })` in `src/worlds/<world>/print.tsx`, added to that file's sheet list. Its tasks' fingerprint goes in `src/print/revisions.json` as `"<id>@1"`: the failing test in `src/print/catalog.test.ts` prints the value.
9. **Opening later** (garden only, optional) — an entry in `UNLOCKS` (`src/state/unlocks.ts`), a flag in `Progress`, and Csepi's lines in `UNLOCK_TEXT` (`Home.tsx`). Remember the rule above: worlds stay open to every child.
10. **Docs** — the game's row in `docs/garden-games.md` or `docs/robot-games.md` and its ladder numbers in `docs/levels.md`.

## Adding a world

A world is a folder in `src/worlds/<world>/` with the same parts as the garden and the workshop: `games/`, `screens/` (its home, its reward place and its games), its art, its `print.tsx` and its styles. A world imports only shared code (everything outside `src/worlds/`), never another world. Then:

1. **The list** — the world in `WORLDS` (`src/state/worlds.ts`). Adding its id to `WorldId` makes the type checker point at every `Record<WorldId, …>`: its look (`WORLD_LOOK` in `src/components/worldLook.ts`, `LOOK` in `WorldHub.tsx`), its play-time gauge (`GAUGES` in `PlayTimer.tsx`), its island and boat route on the map (`WorldMap.tsx`), and its home and reward place (`HUBS` and `REWARDS` in `App.tsx`).
2. **Two-way checks** — the type checker does not see these: shared code still asks `world === 'robot'` and treats every other world as the garden (the reward and its balance in `LevelMeter.tsx`, `PageReceipt.tsx` and `ScanSheet.tsx`, the task clock in `src/state/pod.ts`, the guide in `App.tsx` and `StickerPop.tsx`, the island art in `island.tsx`, the map in `WorldMap.tsx`). `git grep -n "=== 'robot'|=== 'garden'" -- src` lists them.
3. **Loading** — like the workshop, it can load as its own chunk: a `world.ts` that exports its screens and a `lazy.ts` beside it (see `src/worlds/robot/screens/`).
4. **Its games** — each one as in *Adding a game* above.

Steps 2–4 and 6's `STEP_WORDS` and `ABOUT` are checked by the type checker; `src/state/gameCoverage.test.ts` checks stickers, sheets, notes and the island's room. The hub tiles are not checked: open both worlds in `npm run dev` before sending the PR.

## License

By sending a pull request you agree that your contribution is published under the project's license, the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only).
