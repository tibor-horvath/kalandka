import { Seed } from './art';

/** The garden's sign on a Feladatlapok sticker's badge: a sprout. Drawn in the sticker's 100 × 100 box, over a badge at (76, 76). */
function SheetMark() {
  return (
    <>
      <path d="M76 84V73" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M76 77C69.5 77 68.5 71.5 68.5 69C73 69 76 71.5 76 77Z" fill="#FFFFFF" />
      <path d="M76 74.5C82.5 74.5 83.5 69 83.5 66.5C79 66.5 76 69 76 74.5Z" fill="#FFFFFF" />
    </>
  );
}

export const gardenMarks = { RewardIcon: Seed, SheetMark };
