import { useEffect, useMemo, useState } from 'react';
import { KalandkaIcon } from '../components/ui';
import { restartApp } from '../lib/update';
import { openLink } from '../print/catalog';
import type { ReadLink } from '../print/link';
import { AnswerList, OtherAnswers } from '../print/sheet';
import { WORLDS } from '../state/worlds';

/**
 * Where the QR code on a printed page leads: that page's answers, for the grown-up with the paper in hand.
 * It stands in place of the whole game, so it works on a phone that has never seen Kalandka: no profile
 * is read or made, nothing is saved, and the play clock does not run.
 */
export function Answers({ link, onClose }: { link: ReadLink; onClose: () => void }) {
  const opened = useMemo(() => openLink(link), [link]);
  // Ticks only help check the paper here; nothing is saved. A page is marked done in the app, where the child's progress is.
  const [ticked, setTicked] = useState<boolean[]>([]);

  useEffect(() => {
    const title = document.title;
    document.title = 'Kalandka – Megoldások';
    return () => {
      document.title = title;
    };
  }, []);

  return (
    <div className="pa pa--print">
      <header className="pa-printbar">
        <div className="pa-nav__brand">
          <KalandkaIcon size={44} />
          <div>
            <div className="pa-nav__title">Megoldások</div>
            <div className="pa-nav__sub">Kalandka · nyomtatható játékok</div>
          </div>
        </div>
        <button type="button" className="pa-nav__back" onClick={onClose}>
          Kalandka megnyitása
        </button>
      </header>
      <main className="pa-main">
        <div className="pa-page">
          {opened.kind === 'page' ? (
            <>
              <header className="pa-head">
                <div>
                  <h1 className="pa-h1">{opened.spec.game}</h1>
                  <p className="pa-lead">
                    {WORLDS.find((w) => w.id === opened.spec.world)!.name} · {opened.ref.level + 1}. szint · {opened.ref.page + 1}. lap
                  </p>
                </div>
              </header>
              <p className="pa-muted">
                Pipáld ki a feladatokat, ahogy átnézed őket. A kész lapot a gyerkőc eszközén jelöld meg: <b>Szülői sarok → Nyomtatás → Lap beolvasása</b>, és matrica jár érte.
              </p>
              <OtherAnswers spec={opened.spec} level={opened.ref.level} />
              <AnswerList spec={opened.spec} tasks={opened.tasks} ticked={ticked} onTick={(i) => setTicked((t) => Object.assign([...t], { [i]: !t[i] }))} />
            </>
          ) : (
            <section className="pa-card" role="status">
              {opened.kind === 'older' && <p className="pa-lead">Ez a lap a Kalandka egy régebbi verziójához készült, ezért a megoldása már nem érhető el.</p>}
              {opened.kind === 'bad' && <p className="pa-lead">Ehhez a kódhoz nem találunk feladatlapot.</p>}
              {opened.kind === 'newer' && (
                <>
                  <p className="pa-lead">Ez a lap a Kalandka újabb verziójával készült. Frissítsd az alkalmazást, és megnézheted a megoldásokat.</p>
                  <div className="pa-row">
                    <button type="button" className="pa-btn" onClick={restartApp}>
                      Frissítés
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
