import { Bolt } from './art';

/** The workshop's sign on a Feladatlapok sticker's badge: a nut. */
function SheetMark({ color }: { color: string }) {
  return (
    <>
      <polygon points="84.5,76 80.25,83.36 71.75,83.36 67.5,76 71.75,68.64 80.25,68.64" fill="#FFFFFF" />
      <circle cx="76" cy="76" r="3.4" fill={color} />
    </>
  );
}

export const robotMarks = { RewardIcon: Bolt, SheetMark };
