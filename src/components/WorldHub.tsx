import { useState } from 'react';
import { Door, type DoorPlace } from './Door';
import { KidChip, MapButton, ParentsButton, PrintButton, VoiceButton } from './hub';
import { Island, useEnter, useLeave, type Place, type RewardPlace } from './island';
import { PlayTimer, pausedLabel, useTimeLeft } from './PlayTimer';
import { useForm } from './Stage';
import { StickerPop } from './StickerPop';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, RoundButton, SpeakerIcon } from './ui';
import type { Mood, Tone } from '../lib/types';
import { useProfiles } from '../state/profiles';
import { useProgress } from '../state/progress';
import { earnedStickers, gameOf, markStickerSeen, type Sticker } from '../state/rewards';
import { WORLDS, type WorldId } from '../state/worlds';

/** The place the child just left (a game, or the reward place), and whether they solved a task there this time. */
export interface PlaceReturn {
  place: DoorPlace;
  solved: boolean;
}

/** The buttons every world's home screen hands back to App, and the place the child is coming back from. */
export interface HubActions {
  onParents: () => void;
  onPrint: () => void;
  onSwitch: () => void;
  onMap: () => void;
  onAlbum: () => void;
  back: PlaceReturn | null;
}

export interface HubBubble {
  kicker: string;
  title: string;
  mood: Mood;
  tone?: Tone;
}

const LOOK: Record<WorldId, { className: string; guide: 'csepi' | 'csavar'; accent?: string; reward: DoorPlace }> = {
  garden: { className: 'screen screen--home screen--island', guide: 'csepi', reward: 'garden' },
  robot: { className: 'screen screen--home screen--robot-home world--robot screen--island', guide: 'csavar', accent: '#0C6E6A', reward: 'workshop' }
};

/**
 * A world's home screen: the top bar, the guide's bubble with its replay button, the island of games
 * with the reward place last, the sticker album beside them, and the celebration of a sticker earned since the last visit.
 */
export function WorldHub({
  world,
  places,
  reward,
  bubble,
  onReplay,
  sticker,
  onParents,
  onPrint,
  onSwitch,
  onMap,
  onAlbum,
  back
}: HubActions & {
  world: WorldId;
  places: Place[];
  reward: RewardPlace;
  bubble: HubBubble;
  onReplay: () => void;
  sticker: Sticker | null;
}) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const phone = useForm() !== 'tablet';
  const [leaving, leaveForMap] = useLeave(onMap);
  const [opening, enter] = useEnter();
  // Only the arrival from a game closes the door; a later re-render of the same visit keeps the island as it is.
  const [returned] = useState(() => (back && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? back : null));
  const [landed, setLanded] = useState(() => back !== null && returned === null);
  const look = LOOK[world];
  const doors = places.map((p) => (p.onOpen ? { ...p, onOpen: () => enter(p.id, p.onOpen!) } : p));
  const rewardDoor = { ...reward, id: look.reward, onClick: () => enter(look.reward, reward.onClick) };
  const info = WORLDS.find((w) => w.id === world)!;
  // With a daily limit, the island shows today's time left in this world's gauge; the clock stands at home.
  const time = useTimeLeft();
  const book = { count: earnedStickers(progress).filter((s) => gameOf(s).world === world).length, onOpen: onAlbum };

  return (
    <>
      <div className={look.className}>
        <header className="topbar">
          <div className="brand">
            <KalandkaIcon size={56} />
            <div className="brand__text">
              <KalandkaWordmark size={phone ? 15 : 22} accent={look.accent} />
              <div className="brand__world">{info.name}</div>
            </div>
          </div>
          <div className="topbar__right">
            {profiles.kids.length > 1 && <KidChip onSwitch={onSwitch} />}
            <MapButton onClick={leaveForMap} />
            <VoiceButton guide={info.guide} />
            <PrintButton onClick={onPrint} />
            <ParentsButton onClick={onParents} />
          </div>
        </header>

        <div className="home-guide">
          <GuideBubble guide={look.guide} mood={bubble.mood} tone={bubble.tone} csepiWidth={80}>
            <div className="bubble__row">
              <div>
                <div className="bubble__kicker">{bubble.kicker}</div>
                <h1 className="bubble__title">{bubble.title}</h1>
              </div>
              <RoundButton label="Meghallgatom újra" tint="blue" onClick={onReplay}>
                <SpeakerIcon />
              </RoundButton>
            </div>
          </GuideBubble>
        </div>

        <Island
          world={world}
          places={doors}
          reward={rewardDoor}
          book={book}
          leaving={leaving}
          opening={opening}
          back={back && { id: back.place, solved: back.solved, landed }}
          timer={time && <PlayTimer world={world} remaining={time.remaining} total={time.allowance} paused label={pausedLabel(time.remaining)} />}
        />

        {sticker && <StickerPop key={sticker.id} sticker={sticker} seen={progress.stickersSeen} onDone={() => update((p) => markStickerSeen(p, sticker.id))} />}
      </div>
      {opening && <Door place={opening as DoorPlace} way="in" />}
      {returned && !landed && <Door place={returned.place} way="out" onDone={() => setLanded(true)} />}
    </>
  );
}
