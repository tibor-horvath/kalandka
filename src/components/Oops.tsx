import { Component, type ErrorInfo, type ReactNode } from 'react';
import { restartApp } from '../lib/update';
import { canSpeak, speak } from '../lib/speech';
import { Csepi } from './Csepi';
import { SpeakerIcon } from './ui';

const SAY_LOST = 'Hoppá, eltévedtem! Kezdjük újra együtt?';
const SAY_GOING = 'Megvan az út! Indulunk haza.';
/** Long enough for the child to see the pressed button and Csepi's smile before the page reloads. */
const RESTART_DELAY_MS = 700;

function RestartIcon() {
  return (
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v5h-5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/**
 * Last resort when a screen throws while drawing: instead of a blank page, Csepi says (and reads aloud) that
 * they got lost, and one big button starts the app again on the home screen. After the tap the button stays
 * pressed and Csepi cheers, so the child sees the tap worked while the page reloads. Progress is saved as it
 * happens, so nothing is lost; a quiet line on the grass tells the grown-up so.
 * It stands outside the Stage, so it still shows if the Stage itself is what broke, and it sizes itself.
 */
export class Oops extends Component<{ children: ReactNode }, { broken: boolean; restarting: boolean }> {
  state = { broken: false, restarting: false };

  static getDerivedStateFromError() {
    return { broken: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Kalandka crashed', error, info.componentStack);
    speak(SAY_LOST, { as: 'csepi' });
  }

  restart = () => {
    if (this.state.restarting) return;
    this.setState({ restarting: true });
    speak(SAY_GOING, { as: 'csepi' });
    window.setTimeout(restartApp, RESTART_DELAY_MS);
  };

  render() {
    if (!this.state.broken) return this.props.children;
    const { restarting } = this.state;
    return (
      <div className="oops" role="alertdialog" aria-labelledby="oops-title" aria-describedby="oops-text">
        <svg className="oops__ground" aria-hidden="true" viewBox="0 0 1180 220" preserveAspectRatio="none">
          <path d="M0 90 C 240 30, 520 40, 760 80 C 940 110, 1080 70, 1180 50 V220 H0 Z" fill="var(--grass)" />
          <path d="M0 150 C 300 110, 700 120, 1180 140 V220 H0 Z" fill="var(--grass-deep)" />
        </svg>

        <div className="oops__main">
          <div className="oops__guide">
            <Csepi mood={restarting ? 'cheer' : 'oops'} width={200} className="oops__csepi" />
            <div className={`oops__bubble${restarting ? ' oops__bubble--going' : ''}`} role="status">
              <div className="oops__words">
                <h1 id="oops-title" className="oops__title">
                  {restarting ? 'Megvan az út!' : 'Hoppá, eltévedtem!'}
                </h1>
                <p id="oops-text" className="oops__text">
                  {restarting ? 'Indulunk haza…' : 'Kezdjük újra együtt?'}
                </p>
              </div>
              {!restarting && canSpeak() && (
                <button type="button" className="oops__voice" aria-label="Felolvasás újra" onClick={() => speak(SAY_LOST, { as: 'csepi' })}>
                  <SpeakerIcon size={30} />
                </button>
              )}
            </div>
          </div>

          <button type="button" className="oops__btn" onClick={this.restart} disabled={restarting} aria-busy={restarting} autoFocus>
            {restarting ? <HomeIcon /> : <RestartIcon />}
            {restarting ? 'Haza' : 'Újra'}
          </button>
        </div>

        <p className="oops__note">
          <SavedIcon />
          Szülőknek: minden matrica és szint megmaradt.
        </p>
      </div>
    );
  }
}
