# Design rules carried into code

- No failure states, timers or red: feedback is "Hoppá" orange and the guide's surprised face.
- Praise effort ("Ügyes vagy!"), never cleverness.
- Bubble text shows digits; speech uses number words with correct Hungarian forms. Clock times always go through `lib/time.ts`, so the half and the quarters name the coming hour everywhere (*fél három* is 2:30).
- Things a child must tell apart differ in shape or lightness as well as colour (colour-blind friendly): the pattern flowers, the sorting parts, the clock's dark short hand and light long hand.
- Every world is open to every child, and a world never waits on progress in another one.
- A child should not need to read: badges, signs and how-to hints are pictures, and the words stay in the spoken line and the accessible name. A game's "show me" help is always the same sun-yellow eye in the top bar beside the speaker (`components/PeekButton.tsx`), whatever it shows; its label ("Mutasd az utat!", "Mutasd újra a magokat!") is what screen readers hear.
- A win stays a win: once a task is solved, the play that could undo it stops taking taps (Locsolás's cloud falls asleep), and only the way on is left to press.
- Touch targets are at least 64 px; the layout is a fixed 1180×820 stage scaled to the screen.
- Phones get a 390 px phone stage instead, portrait or landscape (`components/Stage.tsx`, `styles/phone.css`), for every screen. A tablet held upright gets the portrait layout too, on a wider stage drawn about 1.4× larger (`.stage--tall-tablet`). Fixed-size drawings (seed beds, flower beds, the honey trail, the Kalandka map) scale into the room left for them (`components/FitBox.tsx`); in portrait the seed beds and Méhkas's flower beds fold, the second group under the first, so they can be drawn bigger. Turning the device re-lays the screen out with a short tilt-and-settle (skipped with reduced motion). On phones, targets are at least 44 px and the game's choices stay large.
