import { speak } from '../lib/speech';
import type { Mood, Tone } from '../lib/types';
import type { WorldId } from '../state/worlds';
import { GuideBubble, RoundButton, SpeakerIcon } from './ui';
import { WORLD_LOOK } from './worldLook';

/** A guide's line: what the bubble shows, and the longer sentence read aloud. */
export interface Say {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

/** The world's guide with their line, and the button that reads it again (the full speech, when there is one). */
export function GuideSay({
  world,
  text,
  speech = text,
  mood,
  tone = 'plain',
  className = 'guide-say'
}: {
  world: WorldId;
  text: string;
  speech?: string;
  mood: Mood;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={className}>
      <GuideBubble guide={WORLD_LOOK[world].guide} mood={mood} tone={tone} csepiWidth={56}>
        {text}
      </GuideBubble>
      <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(speech)}>
        <SpeakerIcon />
      </RoundButton>
    </div>
  );
}
