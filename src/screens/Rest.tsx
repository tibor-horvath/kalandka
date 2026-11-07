import { useEffect, useState, type CSSProperties, type ComponentType } from 'react';
import { AVATARS, Avatar } from '../components/avatars';
import { Csepi } from '../components/Csepi';
import { useModal } from '../components/Modal';
import { StickerDisc } from '../components/stickers';
import { LockIcon, SpeakerIcon } from '../components/ui';
import { speak, type Speaker } from '../lib/speech';
import type { Mood } from '../lib/types';
import { kidName, progressOf, useProfiles, type Kid } from '../state/profiles';
import { useProgress } from '../state/progress';
import { todaysStickers } from '../state/rewards';
import { formatMinutes, remainingSeconds, today } from '../state/screenTime';
import { tasksOn } from '../state/taskLog';
import { currentWorld, type WorldId } from '../state/worlds';
import { CsepiResting } from '../worlds/garden/art';
import { Csavar, CsavarCharging } from '../worlds/robot/art';

interface RestGuide {
  name: string;
  speaker: Speaker;
  Figure: ComponentType<{ mood?: Mood; width?: number; className?: string }>;
  Scene: ComponentType<{ night?: boolean }>;
  /** The voice button, the ticks and the "play" step take the world's colour. */
  accent: { fill: string; deep: string; tint: string };
  day: string;
  evening: string;
}

/** The guide of the world the child played last rests on the rest screen; a new world adds its guide here. */
const GUIDES: Record<WorldId, RestGuide> = {
  garden: {
    name: 'Csepi',
    speaker: 'csepi',
    Figure: Csepi,
    Scene: CsepiResting,
    accent: { fill: '#2E86DE', deep: '#1F5C9E', tint: '#E3F1FC' },
    day: 'Csepi is pihen egy kicsit.',
    evening: 'Este van, Csepi is alszik.'
  },
  robot: {
    name: 'Csavar',
    speaker: 'robot',
    Figure: Csavar,
    Scene: CsavarCharging,
    accent: { fill: '#138A86', deep: '#0C5F5C', tint: '#DDF3F2' },
    day: 'Csavar is töltődik egy kicsit.',
    evening: 'Este van, Csavar is töltődik.'
  }
};

/** Ticks shown for the day's tasks; more than this still shows this many. */
const MAX_TICKS = 12;
/** Earlier stickers of the day shown beside the newest. */
const MORE_STICKERS = 3;

function accentStyle(g: RestGuide): CSSProperties {
  return { '--accent': g.accent.fill, '--accent-deep': g.accent.deep, '--accent-tint': g.accent.tint } as CSSProperties;
}

function MoonIcon({ size = 32 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32">
      <path d="M20 4 A12 12 0 1 0 28 22 A9 9 0 1 1 20 4 Z" fill="#FFE08A" />
    </svg>
  );
}

function SunIcon({ size = 36 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="8" fill="#FFC93C" />
      <path d="M18 2v5M18 29v5M2 18h5M29 18h5M6.7 6.7l3.5 3.5M25.8 25.8l3.5 3.5M6.7 29.3l3.5-3.5M25.8 10.2l3.5-3.5" stroke="#E8A400" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="rest-next__arrow" aria-hidden="true" width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10h34M28 3l8 7-8 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2" />
      <path d="M9 2.5h6" />
    </svg>
  );
}

/** The sky behind both pages: the sun by day, the moon and a few stars in the evening. Still, like the rest of the screen. */
function Sky({ night }: { night: boolean }) {
  if (!night) return <span className="rest__sun" aria-hidden="true" />;
  return (
    <svg className="rest__moon" aria-hidden="true" viewBox="0 0 420 300">
      <path d="M118 30 A62 62 0 1 0 170 120 A48 48 0 1 1 118 30 Z" fill="#FFE08A" />
      <circle cx="260" cy="40" r="4" fill="#FFFFFF" />
      <circle cx="340" cy="110" r="3" fill="#FFFFFF" />
      <circle cx="30" cy="200" r="3" fill="#FFFFFF" />
      <circle cx="220" cy="190" r="2.5" fill="#FFFFFF" />
      <circle cx="390" cy="30" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="rest__replay" aria-label="Meghallgatom újra" onClick={onClick}>
      <SpeakerIcon size={34} />
    </button>
  );
}

/**
 * Shown when today's play time is used up, or during evening rest. The guide of the world played last rests here,
 * next to what the child did today and a picture of "sleep, then play again". Only the parents' gate leads on;
 * on a shared device a sibling whose own time is left can take over (onSwitchTo), after one more tap on their own page.
 */
export function Rest({ evening = false, onParents, onSwitchTo }: { evening?: boolean; onParents: () => void; onSwitchTo?: (id: string) => void }) {
  const { progress } = useProgress();
  const { profiles } = useProfiles();
  const modal = useModal<HTMLDivElement>();
  const [next, setNext] = useState<Kid | null>(null);
  const day = today();
  const guide = GUIDES[currentWorld(progress)];
  const copy = evening
    ? { title: 'Jó éjszakát!', text: `${guide.evening} Reggel újra várlak!`, speech: `${guide.evening} Jó éjszakát! Reggel újra várlak.` }
    : { title: 'Mára elég volt!', text: `${guide.day} Holnap újra várlak!`, speech: `Mára elég volt a játékból. ${guide.day} Holnap újra várlak!` };
  const say = () => speak(copy.speech, { as: guide.speaker });

  useEffect(() => {
    if (!next) speak(copy.speech, { as: guide.speaker });
  }, [copy.speech, guide.speaker, next]);

  const stickers = todaysStickers(progress, day);
  const tasks = tasksOn(progress, day);
  const siblings = onSwitchTo
    ? profiles.kids.filter((k) => k.id !== profiles.activeId).map((kid) => ({ kid, left: remainingSeconds(progressOf(profiles, kid.id), day) }))
    : [];
  // Siblings who are all resting too would only be grey buttons: the row shows when someone can take over.
  const showSiblings = siblings.some((s) => s.left > 0);
  const nextLeft = next ? siblings.find((s) => s.kid.id === next.id)?.left ?? 0 : 0;

  return (
    <div ref={modal} className={`rest${evening ? ' rest--evening' : ''}`} role="dialog" aria-modal="true" aria-labelledby="rest-title">
      <div className="rest__stage">
        <Sky night={evening} />
        {next && onSwitchTo ? (
          <Handoff kid={next} left={nextLeft} onStart={() => onSwitchTo(next.id)} onCancel={() => setNext(null)} />
        ) : (
          <>
            <div className="rest__art">
              <guide.Scene night={evening} />
              <span className="rest__zz" aria-hidden="true">
                z<small>z</small>
              </span>
            </div>
            <div className="rest__body" style={accentStyle(guide)}>
              <div className="rest__head">
                <ReplayButton onClick={say} />
                <h1 id="rest-title" className="rest__title">
                  {copy.title}
                </h1>
              </div>
              <p className="rest__text">{copy.text}</p>

              {(stickers.length > 0 || tasks > 0) && (
                <section className="rest-today" aria-labelledby="rest-today-title">
                  <h2 id="rest-today-title" className="rest-today__title">
                    Ma ezt csináltad
                  </h2>
                  <div className="rest-today__row">
                    {stickers.length > 0 && (
                      <span className="rest-today__new" role="img" aria-label={`Új matrica: ${stickers[0].label}`}>
                        <StickerDisc sticker={stickers[0]} />
                        <span className="rest-today__badge">Új!</span>
                      </span>
                    )}
                    <div className="rest-today__more">
                      {tasks > 0 && (
                        <span className="rest-today__ticks" role="img" aria-label={`Ma ${tasks} feladatot oldottál meg`}>
                          {Array.from({ length: Math.min(tasks, MAX_TICKS) }, (_, i) => (
                            <span key={i} className="rest-today__tick">
                              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 8.5l3.2 3L13 4.5" />
                              </svg>
                            </span>
                          ))}
                        </span>
                      )}
                      {stickers.length > 1 && (
                        <span className="rest-today__stickers" role="img" aria-label={`Még ${stickers.length - 1} matrica ma`}>
                          {stickers.slice(1, 1 + MORE_STICKERS).map((s) => (
                            <StickerDisc key={s.id} sticker={s} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div className="rest-next" role="img" aria-label="Most alvás, reggel újra játszunk">
                <span className="rest-next__step">
                  <span className="rest-next__dot rest-next__dot--night">
                    <MoonIcon />
                  </span>
                  Alvás
                </span>
                <ArrowIcon />
                <span className="rest-next__step">
                  <span className="rest-next__dot rest-next__dot--sun">
                    <SunIcon />
                  </span>
                  Reggel
                </span>
                <ArrowIcon />
                <span className="rest-next__step">
                  <span className="rest-next__dot rest-next__dot--play">
                    <guide.Figure width={26} className="rest-next__guide" />
                  </span>
                  Játék
                </span>
              </div>

              {showSiblings && (
                <div className="rest-sibs">
                  <span className="rest-sibs__title">Testvér jön játszani?</span>
                  <div className="rest-sibs__row">
                    {siblings.map(({ kid, left }) => {
                      const out = left <= 0;
                      return (
                        <button key={kid.id} type="button" className="rest-sib" disabled={out} onClick={() => setNext(kid)}>
                          <span className="rest-sib__face">
                            <Avatar id={kid.avatar} size={48} />
                            {out && (
                              <span className="rest-sib__moon">
                                <MoonIcon size={14} />
                              </span>
                            )}
                          </span>
                          <span className="rest-sib__text">
                            <span className="rest-sib__name">{kidName(kid)}</span>
                            {out ? <span className="rest-sib__note">ma már pihen</span> : Number.isFinite(left) && <span className="rest-sib__note">még {formatMinutes(left)}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <button type="button" className="parents-btn rest__parents" onClick={onParents}>
          <LockIcon size={20} />
          <span className="parents-btn__label">Szülőknek</span>
        </button>
      </div>
    </div>
  );
}

/** A sibling tapped on the rest screen: their own page, greeted by the guide of their own last world, before the switch. */
function Handoff({ kid, left, onStart, onCancel }: { kid: Kid; left: number; onStart: () => void; onCancel: () => void }) {
  const { profiles } = useProfiles();
  const guide = GUIDES[currentWorld(progressOf(profiles, kid.id))];
  const name = kidName(kid);
  const speech = `${name}, te jössz! ${guide.name} már nagyon vár. Koppints a Kezdjük gombra!`;

  useEffect(() => {
    speak(speech, { as: guide.speaker });
  }, [speech, guide.speaker]);

  return (
    <>
      <div className="rest__art rest-handoff__art">
        <span className="rest-handoff__kid" style={{ '--ring': AVATARS[kid.avatar].ring } as CSSProperties}>
          <Avatar id={kid.avatar} size={230} />
        </span>
        <guide.Figure mood="cheer" width={180} className="rest-handoff__guide" />
      </div>
      <div className="rest__body" style={accentStyle(guide)}>
        <div className="rest__head">
          <ReplayButton onClick={() => speak(speech, { as: guide.speaker })} />
          <h1 id="rest-title" className="rest__title">
            {name}, te jössz!
          </h1>
        </div>
        <p className="rest__text">{guide.name} már nagyon vár téged.</p>
        {Number.isFinite(left) && (
          <span className="rest-handoff__time">
            <ClockIcon />
            Még {formatMinutes(left)} játék
          </span>
        )}
        {/* The page just changed under the finger: focus goes to its one action. */}
        <button type="button" className="rest-handoff__start" onClick={onStart} autoFocus>
          <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
          Kezdjük!
        </button>
        <button type="button" className="rest-handoff__cancel" onClick={onCancel}>
          Mégse
        </button>
      </div>
    </>
  );
}

/** Small badge in the last two minutes: "Még 2 perc". */
export function TimeBanner({ remaining }: { remaining: number }) {
  const minutes = Math.max(1, Math.ceil(remaining / 60));
  const text = remaining <= 0 ? 'Ez az utolsó feladat!' : `Még ${minutes} perc játék`;
  return (
    <div className="time-banner" role="status">
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2" />
        <path d="M9 2.5h6" />
      </svg>
      {text}
    </div>
  );
}
