# Contributing to Kalandka

Thank you for helping. Kalandka is a set of Hungarian thinking games for children aged 5–7, so every change is checked against what a five-year-old will see and hear.

## Before you start

- For a bug, open an issue with what you did, what you expected and the device and browser.
- For a new game, level or bigger change, open an issue first so we can agree on it before you build it.

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
- Update the README when a game's behaviour changes.
- PR titles must be Conventional Commits (`feat:`, `fix:`, `docs:` …); they become the commit message.
- CI runs the tests, the build, a secret scan and Lighthouse; a PR is merged once they pass and it has been reviewed.

## License

By sending a pull request you agree that your contribution is published under the project's license, the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only).
