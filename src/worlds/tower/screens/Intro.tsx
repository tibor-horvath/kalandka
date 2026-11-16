import { useEffect, useState, type ReactNode } from 'react';
import { useModal } from '../../../components/Modal';
import { speak } from '../../../lib/speech';
import type { GameId } from '../../../state/games';
import { useProgress } from '../../../state/progress';
import { ActivityPic, ClockFace, DayPartSign, DigitalDisplay, Kakukk, SeasonTree } from '../art';
import { ACTIVITIES, DAY_PARTS } from '../games/activities';
import { introFor, opensByItself, type IntroArt, type LevelIntro } from '../games/intros';
import { SEASONS } from '../games/season';

// The szint-bemutató on screen: Kakukk's slides over the game, turned only by the child (Tovább, Vissza),
// with Kihagyom to jump straight in. Nothing moves on its own; each slide is read out once when it shows.

const SEASON_NAMES = { spring: 'tavasz', summer: 'nyár', autumn: 'ősz', winter: 'tél' } as const;

/** Clock angles for a time on the 12-hour dial. */
const angles = (h: number, m: number) => ({ hour: ((h % 12) + m / 60) * 30, minute: m * 6 });

function Clock({ h, m, size, hourOnly = false, wedge = null, glow = null, label }: { h: number; m: number; size: number; hourOnly?: boolean; wedge?: [number, number] | null; glow?: number | null; label: string }) {
  const a = angles(h, m);
  return <ClockFace size={size} hour={a.hour} minute={hourOnly ? null : a.minute} wedge={wedge} glow={glow} label={label} className="tower-clock" />;
}

const pad = (m: number) => String(m).padStart(2, '0');

function SlideArt({ art }: { art: IntroArt }) {
  switch (art.kind) {
    case 'clock':
      return (
        <div className="intro__art-row">
          <Clock h={art.h} m={art.m} size={250} hourOnly={art.hourOnly} wedge={art.wedge ?? null} glow={art.glow ?? null} label={`Óra: ${art.h}:${pad(art.m)}`} />
          {art.digital && <DigitalDisplay text={art.digital} size={1.3} />}
        </div>
      );
    case 'sleep':
      return (
        <div className="intro__art-row">
          {[art.from, art.to].map(([h, m], i) => (
            <figure key={i} className="intro__fig">
              <Clock h={h} m={m} size={190} label={`${i ? 'Ébredés' : 'Elalvás'}: ${h}:${pad(m)}`} />
              <figcaption>
                {i ? 'Felébredt' : 'Elaludt'} · {h}:{pad(m)}
              </figcaption>
            </figure>
          ))}
        </div>
      );
    case 'quarters':
      return (
        <div className="intro__art-row">
          {(
            [
              [15, 'negyed', [0, 90]],
              [30, 'fél', [0, 180]],
              [45, 'háromnegyed', [0, 270]]
            ] as [number, string, [number, number]][]
          ).map(([m, word, wedge]) => (
            <figure key={m} className="intro__fig">
              <Clock h={2} m={m} size={170} wedge={wedge} label={`${word} három, 2:${m}`} />
              <figcaption>
                <b>{word} három</b> · 2:{m}
              </figcaption>
            </figure>
          ))}
        </div>
      );
    case 'pics':
      return (
        <div className="intro__art-row">
          {art.ids.map((id) => (
            <figure key={id} className="intro__fig">
              <ActivityPic id={id} size={130} />
              <figcaption>{ACTIVITIES[id].name}</figcaption>
            </figure>
          ))}
        </div>
      );
    case 'parts':
      return (
        <div className="intro__art-row">
          {DAY_PARTS.map((p) => (
            <figure key={p} className="intro__fig">
              <DayPartSign part={p} size={96} />
              <figcaption>{p}</figcaption>
            </figure>
          ))}
        </div>
      );
    case 'seasons':
      return (
        <div className="intro__art-row">
          {SEASONS.map((s) => (
            <figure key={s} className="intro__fig">
              <SeasonTree season={s} size={130} />
              <figcaption>{SEASON_NAMES[s]}</figcaption>
            </figure>
          ))}
        </div>
      );
    case 'chips':
      return (
        <ol className="intro__chips">
          {art.items.map((w, i) => (
            <li key={w} className={art.mark?.[i] ? 'is-marked' : undefined}>
              {art.mark?.[i] && <small>{art.mark[i]}</small>}
              {w}
            </li>
          ))}
        </ol>
      );
  }
}

/** Kakukk's slides for one idea, over the game. `onDone` runs on Kezdjük!, Kihagyom or Escape. */
export function IntroSlides({ intro, onDone }: { intro: LevelIntro; onDone: () => void }) {
  const [at, setAt] = useState(0);
  const modal = useModal<HTMLDivElement>(onDone);
  const slide = intro.slides[at];
  const last = at === intro.slides.length - 1;

  useEffect(() => {
    speak(`${slide.title}. ${slide.text}`);
  }, [slide]);

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title" ref={modal}>
      <div className="intro__card">
        <div className="intro__head">
          <Kakukk mood={last ? 'cheer' : 'smile'} width={64} />
          <h2 id="intro-title">{slide.title}</h2>
          <button type="button" className="intro__skip" onClick={onDone}>
            Kihagyom
          </button>
        </div>
        <div className="intro__art">
          <SlideArt art={slide.art} />
        </div>
        <p className="intro__text">{slide.text}</p>
        <div className="intro__foot">
          <button type="button" className="intro__btn intro__btn--back" onClick={() => setAt(at - 1)} disabled={at === 0}>
            Vissza
          </button>
          {intro.slides.length > 1 && (
            <ol className="intro__dots" aria-label={`${at + 1}. lap a ${intro.slides.length}-ből`}>
              {intro.slides.map((s, i) => (
                <li key={s.title} className={i === at ? 'is-on' : i < at ? 'is-done' : undefined} />
              ))}
            </ol>
          )}
          <button type="button" className="intro__btn intro__btn--go" onClick={() => (last ? onDone() : setAt(at + 1))} autoFocus>
            {last ? 'Kezdjük!' : 'Tovább'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A game screen's intro: `open` while it shows (the question waits to be read out until it closes), `help` for the
 * top bar's "?" button, and `render(onDone)` for the slides, `onDone` being what the game does next (say its line).
 */
export function useLevelIntro(game: GameId, level: number) {
  const { progress, update } = useProgress();
  const [found] = useState(() => introFor(game, level));
  const [open, setOpen] = useState(() => opensByItself(game, level, progress.introsSeen));

  const render = (onDone: () => void): ReactNode =>
    open && found ? (
      <IntroSlides
        intro={found.intro}
        onDone={() => {
          setOpen(false);
          const id = found.intro.id;
          update((p) => (p.introsSeen.includes(id) ? p : { ...p, introsSeen: [...p.introsSeen, id] }));
          onDone();
        }}
      />
    ) : null;

  return { open, help: found ? { label: found.intro.ask, onClick: () => setOpen(true) } : undefined, render };
}
