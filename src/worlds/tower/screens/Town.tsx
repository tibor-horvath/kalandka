import { useEffect, useState } from 'react';
import { CountIn } from '../../../components/CountIn';
import { GuideSay } from '../../../components/GuideSay';
import { PlaceShell } from '../../../components/PlaceShell';
import { numberAttr } from '../../../lib/numbers';
import { fanfare, popBubble } from '../../../lib/sound';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';
import { BUILDINGS, bellBalance, build, builtCount, isBuilt, townTime, type Building } from '../../../state/town';
import { Bell, BuildingArt } from '../art';
import type { Say } from '../games/common';

const DAY_WORD = { morning: 'Reggel van a Kisvárosban.', noon: 'Dél van a Kisvárosban.', afternoon: 'Délután van a Kisvárosban.', evening: 'Este van a Kisvárosban.' };

/** The bells counted out for a building, like seeds into a bed. */
function BellBox() {
  return (
    <svg width="96" height="80" viewBox="0 0 96 80" aria-hidden="true">
      <path d="M8 26 H88 L80 76 H16 Z" fill="#E3DEF5" stroke="#5B4B9A" strokeWidth="5" strokeLinejoin="round" />
      <path d="M8 26 H88" stroke="#5B4B9A" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Kisváros: Óratorony's reward place. Ten buildings stand around the square as dashed outlines; the bells from
 * the games put them up, counted in one by one. The square's sky moves with the child's solved tasks.
 */
export function Town({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const balance = bellBalance(progress);
  const built = builtCount(progress);
  const [counting, setCounting] = useState<Building | null>(null);
  const [counted, setCounted] = useState(0);
  const [line, setLine] = useState<Say>(() => opening());

  function opening(): Say {
    const day = DAY_WORD[townTime(progress)];
    if (built === BUILDINGS.length) return { text: 'Kész a város! Jár a toronyóra.', speech: `${day} Kész a Kisváros, minden épület áll. Köszönöm!`, mood: 'cheer', tone: 'good' };
    if (built === 0) return { text: 'Építsünk várost!', speech: `${day} Itt még csak a tér van. A harangokból házakat építhetünk. Koppints egy házra!`, mood: 'cheer', tone: 'plain' };
    return { text: 'Mit építsünk most?', speech: `${day} Mit építsünk most? Koppints egy szaggatott házra!`, mood: 'smile', tone: 'plain' };
  }

  useEffect(() => {
    speak(line.speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Said once per visit.
  }, []);

  const tell = (s: Say) => {
    setLine(s);
    speak(s.speech);
  };

  const tap = (b: Building) => {
    popBubble(2);
    if (isBuilt(progress, b.id)) {
      tell({ text: `Ez a ${b.name.toLowerCase()}.`, speech: `Ez a ${b.name.toLowerCase()}. Te építetted!`, mood: 'cheer', tone: 'good' });
      return;
    }
    if (b.cost > balance) {
      const need = b.cost - balance;
      tell({ text: `Még ${need} harang kell.`, speech: `${b.name}: ${numberAttr(b.cost)} harang kell hozzá. Még ${numberAttr(need)} harangot gyűjts a játékokban!`, mood: 'think', tone: 'plain' });
      return;
    }
    setCounted(0);
    setCounting(b);
    tell({ text: `Számold be a harangokat: ${b.cost}!`, speech: `${b.name}! Tegyél be ${numberAttr(b.cost)} harangot, egyesével!`, mood: 'smile', tone: 'plain' });
  };

  const done = (b: Building) => {
    setCounting(null);
    fanfare();
    update((p) => build(p, b.id));
    tell({ text: `Felépült: ${b.name.toLowerCase()}!`, speech: `Felépült a ${b.name.toLowerCase()}! Nézd, milyen szép lett a város!`, mood: 'cheer', tone: 'good' });
  };

  return (
    <PlaceShell
      world="tower"
      className="screen--town"
      title="Kisváros"
      onBack={onBack}
      counters={
        <div className="pill" aria-label={`${balance} harang`}>
          <Bell />
          <span>
            {balance}
            <span className="pill__unit"> harang</span>
          </span>
        </div>
      }
    >
      <GuideSay world="tower" mood={line.mood} tone={line.tone} text={line.text} speech={line.speech} />
      <div className={`town town--${townTime(progress)}`}>
        <div className="town__square" aria-hidden="true" />
        <ul className="town__grid" aria-label={`Kisváros: ${built} épület áll a ${BUILDINGS.length}-ből`}>
          {BUILDINGS.map((b) => {
            const up = isBuilt(progress, b.id);
            return (
              <li key={b.id}>
                <button type="button" className={`town__spot${up ? ' is-built' : ''}${!up && b.cost <= balance ? ' is-ready' : ''}`} onClick={() => tap(b)} aria-label={up ? b.name : `${b.name}: ${b.cost} harang`}>
                  <span className={up ? 'pop-in' : undefined}>
                    <BuildingArt id={b.id} ghost={!up} />
                  </span>
                  <span className="town__name">{b.name}</span>
                  {!up && (
                    <span className="town__cost" aria-hidden="true">
                      <Bell size={20} />
                      {b.cost}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {counting && (
        <div className="town-count" role="dialog" aria-label={`${counting.name} építése`}>
          <div className="town-count__card">
            <span className={`town-count__building${counted >= counting.cost ? ' is-on' : ''}`} aria-hidden="true">
              <BuildingArt id={counting.id} ghost={counted < counting.cost} />
            </span>
            <CountIn
              cost={counting.cost}
              balance={balance}
              label={counting.name}
              unit="harang"
              unitObj="harangot"
              className="seed-count--bell"
              token={(size) => <Bell size={size} />}
              store={<BellBox />}
              onCount={setCounted}
              onDone={() => done(counting)}
            />
            <button type="button" className="big-btn big-btn--quiet" onClick={() => setCounting(null)}>
              Mégse
            </button>
          </div>
        </div>
      )}
    </PlaceShell>
  );
}
