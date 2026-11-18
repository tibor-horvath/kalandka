import { useState } from 'react';
import { Door, type DoorPlace } from './Door';
import { KidChip, MapButton, ParentsButton, VoiceButton } from './hub';
import { Island, MixArt, RewardDock, useEnter, useLeave, type Place, type RewardPlace } from './island';
import { PlayTimer, pausedLabel, useTimeLeft } from './PlayTimer';
import { useForm } from './Stage';
import { StickerPop } from './StickerPop';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, RoundButton, SpeakerIcon, type GuideId } from './ui';
import type { Mood, Tone } from '../lib/types';
import { useProfiles } from '../state/profiles';
import { useProgress } from '../state/progress';
import { earnedStickers, gameOf, markStickerSeen, type Sticker } from '../state/stickers';
import { REVIEW_NEEDS, reviewOpen, reviewPlayed } from '../state/review';
import { WORLDS, type WorldId } from '../state/worlds';
import { speak } from '../lib/speech';

/** What the guide says when the sleeping Vegyes kör is tapped. */
const MIX_ASLEEP = 'A vegyes kör még alszik. Játssz két játékkal a szigeten, és felébred!';
const MIX_ONE_MORE = 'Már csak egy másik játék kell, és felébred a vegyes kör!';

/** The place the child just left (a game, or the reward place), and whether they solved a task there this time. */
export interface PlaceReturn {
  place: DoorPlace;
  solved: boolean;
}

/** The buttons every world's home screen hands back to App, and the place the child is coming back from. */
export interface HubActions {
  onParents: () => void;
  onSwitch: () => void;
  onMap: () => void;
  onAlbum: () => void;
  /** Vegyes kör: a short round of tasks from this world's games (see state/review.ts). */
  onReview: () => void;
  back: PlaceReturn | null;
}

export interface HubBubble {
  kicker: string;
  title: string;
  mood: Mood;
  tone?: Tone;
}

const LOOK: Record<WorldId, { className: string; guide: GuideId; accent?: string }> = {
  garden: { className: 'screen screen--home screen--island', guide: 'csepi' },
  robot: { className: 'screen screen--home screen--robot-home world--robot screen--island', guide: 'csavar', accent: '#0C6E6A' },
  tower: { className: 'screen screen--home screen--tower-home world--tower screen--island', guide: 'kakukk', accent: '#5B4B9A' }
};

/**
 * A world's home screen: the top bar, the guide's bubble with its replay button, the island of games
 * with the reward place and the sticker album on Kincseim (an islet on tablets, a bar under the island on phones), and the celebration of a sticker earned since the last visit.
 */
export function WorldHub({
  world,
  places,
  reward,
  bubble,
  onReplay,
  sticker,
  onParents,
  onSwitch,
  onMap,
  onAlbum,
  onReview,
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
  const rewardDoor = { ...reward, id: 'reward', onClick: () => enter('reward', reward.onClick) };
  // Vegyes kör opens its first game straight away; that game's own door plays as it opens. Until two of the island's
  // games were played it sleeps, and a tap has the guide say what wakes it.
  const played = reviewPlayed(progress, world).length;
  const mix: Place = reviewOpen(progress, world)
    ? { id: 'review', name: 'Vegyes kör', label: 'Vegyes kör: öt feladat a sziget játékaiból, egymás után', art: <MixArt guide={look.guide} />, onOpen: onReview }
    : {
        id: 'review',
        name: 'Vegyes kör',
        label: 'Vegyes kör: még alszik. Játssz két játékkal, és felébred.',
        art: <MixArt guide={look.guide} />,
        locked: { progress: played / REVIEW_NEEDS, onTap: () => speak(played === 0 ? MIX_ASLEEP : MIX_ONE_MORE) }
      };
  const info = WORLDS.find((w) => w.id === world)!;
  // With a daily limit, the island shows today's time left in this world's gauge; the clock stands at home.
  const time = useTimeLeft();
  const timer = time && <PlayTimer world={world} remaining={time.remaining} total={time.allowance} paused label={pausedLabel(time.remaining)} />;
  const book = { count: earnedStickers(progress).filter((s) => gameOf(s).world === world).length, onOpen: onAlbum };

  return (
    <>
      <div className={look.className}>
        <header className="topbar">
          <div className="topbar__left">
            {/* Tablets: the way back to the map in the top-left corner, where every game keeps its back button; it takes the logo's place. Phones have it in the bar under the island. */}
            {!phone && <MapButton onClick={leaveForMap} />}
            <div className="brand">
              {phone && <KalandkaIcon size={56} />}
              <div className="brand__text">
                <KalandkaWordmark size={phone ? 15 : 22} accent={look.accent} />
                <div className="brand__world">{info.name}</div>
              </div>
            </div>
          </div>
          <div className="topbar__right">
            {profiles.kids.length > 1 && <KidChip onSwitch={onSwitch} />}
            {/* Phones keep the play-time sign up here, clear of the places' names; tablets plant it on the island. */}
            {phone && timer}
            <VoiceButton guide={info.guide} />
            {/* Printing lives in the parents' corner (Szülőknek → Nyomtatás), so the child's screen holds no adult tools. */}
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
          mix={mix}
          reward={rewardDoor}
          book={book}
          leaving={leaving}
          opening={opening}
          back={back && { id: back.place, solved: back.solved, landed }}
          timer={phone ? null : timer}
        />
        {/* Phones have no boat to tap: the way back to the map leads the bar under the island. */}
        {phone && <RewardDock reward={rewardDoor} book={book} onMap={leaveForMap} />}

        {sticker && <StickerPop key={sticker.id} sticker={sticker} seen={progress.stickersSeen} onDone={() => update((p) => markStickerSeen(p, sticker.id))} />}
      </div>
      {opening && <Door place={opening as DoorPlace} world={world} way="in" />}
      {returned && !landed && <Door place={returned.place} world={world} way="out" onDone={() => setLanded(true)} />}
    </>
  );
}

