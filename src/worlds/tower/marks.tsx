import { Bell } from './art';

/** The Óratorony's sign on a Feladatlapok sticker's badge: a bell. */
function SheetMark() {
  return <path d="M76 68 C72 68 71 72 71 75 V79 L69 81 H83 L81 79 V75 C81 72 80 68 76 68 Z M74 83 H78" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />;
}

export const towerMarks = { RewardIcon: Bell, SheetMark };
