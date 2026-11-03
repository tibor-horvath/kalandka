import { KidChip, MapButton, ParentsButton, PrintButton, VoiceButton } from './hub';
import { Island, useLeave, type Place, type RewardPlace } from './island';
import { useForm } from './Stage';
import { StickerPop } from './StickerPop';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, RoundButton, SpeakerIcon } from './ui';
import type { Mood, Tone } from '../lib/types';
import { useProfiles } from '../state/profiles';
import { useProgress } from '../state/progress';
import { markStickerSeen, type Sticker } from '../state/rewards';
import { WORLDS, type WorldId } from '../state/worlds';

/** The buttons every world's home screen hands back to App. */
export interface HubActions {
  onParents: () => void;
  onPrint: () => void;
  onSwitch: () => void;
  onMap: () => void;
}

export interface HubBubble {
  kicker: string;
  title: string;
  mood: Mood;
  tone?: Tone;
}

const LOOK: Record<WorldId, { className: string; guide: 'csepi' | 'csavar'; accent?: string }> = {
  garden: { className: 'screen screen--home screen--island', guide: 'csepi' },
  robot: { className: 'screen screen--home screen--robot-home world--robot screen--island', guide: 'csavar', accent: '#0C6E6A' }
};

/**
 * A world's home screen: the top bar, the guide's bubble with its replay button, the island of games
 * with the reward place last, and the celebration of a sticker earned since the last visit.
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
  onMap
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
  const look = LOOK[world];
  const info = WORLDS.find((w) => w.id === world)!;

  return (
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

      <Island world={world} places={places} reward={reward} leaving={leaving} />

      {sticker && <StickerPop key={sticker.id} sticker={sticker} seen={progress.stickersSeen} onDone={() => update((p) => markStickerSeen(p, sticker.id))} />}
    </div>
  );
}
