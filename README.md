# Kalandka

Hungarian thinking games for children aged 5–7, built as an offline-capable tablet PWA.
Kalandka is the umbrella brand with three worlds, each an island on the Kalandka map:

- **Számkertész**: the counting garden, guided by Csepi the water drop.
- **Robotműhely**: the robot workshop for the bigger ones, guided by Csavar the robot.
- **Óratorony**: times of day, the week, the seasons and the clock, guided by Kakuk the cuckoo.

Every world is open to every child; the boat waits at the island chosen last, and the app opens there. Foggy islands stand for worlds still to come.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # game logic tests (vitest)
npm run build    # type-check + production build with service worker, then the offline check:
                 # every built file must be precached and every precached file must exist
```

## Documentation

| Page | What it covers |
| --- | --- |
| [Számkertész games](docs/garden-games.md) | The seven garden games and how each plays |
| [Robotműhely games](docs/robot-games.md) | The seven workshop machines and how each plays |
| [Óratorony games](docs/tower-games.md) | The seven clock-tower games, the Kisváros and how Hungarian clock times are said |
| [Levels](docs/levels.md) | The shared difficulty ladder: when a game steps up or down |
| [Rewards](docs/rewards.md) | The reward pod, Kiskert, visitors and gifts, the robot builder and friends, the Kisváros, stickers |
| [For parents](docs/parents.md) | The parents' area, printable sheets and screen time |
| [Design rules](docs/design.md) | The rules every screen keeps: no failure, praise effort, colour-blind friendly, touch sizes, stages |
| [Code structure](docs/structure.md) | Where each world, game and piece of state lives in `src/` |
| [CI](docs/ci.md) | The GitHub Actions workflows and Dependabot |
| [Deploy](docs/deploy.md) | Azure Static Web Apps setup, releases, custom domains and rollback |
| Design notes | [Kódzár](docs/kodzar.md), [Hibavadász](docs/hibakereso.md) |

## Not done yet

- Recorded Hungarian voices for the guides (the browser voice is a stand-in).
- Parents' overview of stickers and the garden.

## Contributing

Bug reports, ideas and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Copyright (C) 2026 Tibor Horváth. Kalandka is free software under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only): anyone may use, change and share it, and anyone who shares a changed version, or runs one for others over a network, must publish its source under the same license.
