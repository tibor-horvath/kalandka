# Levels

Every game but Számmagok shares one difficulty ladder (`src/state/ladder.ts`), and the level follows the child on its own, one step at a time:

| Game | Steps up after | Steps down after |
| --- | --- | --- |
| Locsolás, Virágsor, Villámszem | 4 answers in a row without help | 3 in a row that needed help |
| Mézút | every digit of its level in a row | 3 in a row that needed help |
| Méhkas, Cserépbarátok | 5 answers in a row without help | 3 in a row that needed help |
| Robotműhely games | 4 rounds in a row without help (one slip in a round is fine) | 2 rounds in a row that needed help |

"Needed help" means a wrong pick, a lit-up answer or "Mutasd!". The level meter shows the level as a staircase whose current step fills up with the streak. A step up plays once in the meter itself, about three seconds, with no card between rounds: the full step locks in dark, a star hops onto the next step, which lifts and takes the current outline, an "Új szint!" chip shows under the meter and Csepi says it. A step down is quiet ("A következőt egy kicsit könnyebben gyakoroljuk."). After any step there are three tasks before the next step down, going back up after a step down takes one more in a row, and the game never steps below the starting level a parent set in Szintek. The level is kept apart from the solved counts, so a step down never takes back a sticker, a seed or a bolt; stickers come from the highest level reached. A new child starts each ladder at a level for their age, deliberately low and with no floor, so they can still step down. Számmagok moves in order instead.
