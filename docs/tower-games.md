# Óratorony games

Kakuk's clock tower, the third Kalandka world: times of day, the week, the seasons and the clock. Kakuk is a purple cuckoo whose crest is two clock hands. Every game is open from the start: the world asks for nothing from the other worlds, so an older child can come straight here. How each game steps up and down is in [Levels](levels.md); what a solved task pays is in [Rewards](rewards.md#óratorony).

Every clock time is said through `src/lib/time.ts`, the Hungarian way: the half and the quarters name the hour the hour hand is heading to (2:30 is *fél három*, 7:15 *negyed nyolc*, 7:45 *háromnegyed nyolc*), other minutes as *három óra tíz perc*. On every dial the hour hand is short, thick and dark, and the minute hand long, thin and lighter blue, so they differ in more than colour.

| Game | Skill | How it plays |
| --- | --- | --- |
| Napirend | Order of a day, parts of the day | Pictures of a child's day (getting up, breakfast, setting off to kindergarten, lunch, playground, dinner, bath, sleep). Five levels: Mi jön utána? (one card stands in the row, pick the next of two, the other one came earlier; for 5-year-olds), three cards in order, four cards in order, Napszakok (pick reggel, délben, délután or este for a picture), Mi volt előbb? (which of two came first). A wrong card shakes once and stays dimmed; Kakuk says whether it came earlier or later; two misses light the right one up. No numbers and no clock. |
| Évszakok | Seasons, days of the week, months | Six levels: Melyik évszak? (a tree in blossom, fruit, falling leaves or snow; pick the season), Sorban jönnek (four trees in the seasons' circle, one missing), A hét napjai (the week, one day missing), Tegnap és holnap (today is marked, pick yesterday or tomorrow), Holnapután (the day after tomorrow, the day before yesterday), Hónapok (which season a month is in). |
| Óraállító | Setting a clock | A cuckoo clock: the child drags its hands (or nudges them with the arrow buttons) and presses Kész. Five levels: only the short hand on whole hours, both hands on whole hours, halves, quarters, five minutes. The long hand snaps to quarters until the last level. On a whole hour the cuckoo calls the hour ("Kakukk, kakukk, kakukk!"). A wrong clock gets one hint at a time, the minute hand first; two misses light up the number. |
| Hány óra? | Reading a clock | A dial and three time cards. The same five steps as Óraállító. The wrong cards are the usual mix-ups: the hour left instead of the coming one (*fél kettő* for 2:30), the hands read the other way round, the other quarter. After a miss on a half or quarter hour the hour hand's way between its two numbers is tinted. |
| Digitóra | Dial and digital display | A dial with the time in words under it, and three digital displays. Whole hours, halves, quarters, five minutes, then Délután: the afternoon's 24-hour reading (*délután három óra* is 15:00). |
| Kakuk alszik | Time gone by | Two clocks: Kakuk lay down, Kakuk woke up; how long did he sleep? Four levels: one to three hours, up to five, over twelve o'clock, half hours (*másfél óra*). After a miss the first dial tints the hour hand's way to the second. |
| Homokóra | How long things take | No clock and no numbers. Three levels: which of two takes longer, which is shorter (the two always at least ten times apart: a clap and a bath, brushing teeth and a night's sleep, a day at kindergarten and washing hands), then whether something takes a moment, minutes or hours. |

Every solved task fills half of the reward pod, and every second one pays a bell (see [Rewards](rewards.md#óratorony)).

## Printed sheets

Each game has a sheet per level (`src/worlds/tower/print.tsx`), drawn from the same task generators so a page matches the child's level: Napirend's cards get a box to write 1, 2, 3 under them (the cards given in the app carry their number already, a card that does not belong is crossed out on the answers); Óraállító's dials have no hands and the child draws them; the other games circle the right card. The Óratorony's Feladatlapok row in the album counts these pages.
