import { Component, type ErrorInfo, type ReactNode } from 'react';
import { restartApp } from '../lib/update';
import { Csepi } from './Csepi';

/**
 * Last resort when a screen throws while drawing: instead of a blank page, Csepi asks the child to tap once
 * and the app starts again on the home screen. Progress is saved as it happens, so nothing is lost.
 * It stands outside the Stage, so it still shows if the Stage itself is what broke.
 */
export class Oops extends Component<{ children: ReactNode }, { broken: boolean }> {
  state = { broken: false };

  static getDerivedStateFromError() {
    return { broken: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Kalandka crashed', error, info.componentStack);
  }

  render() {
    if (!this.state.broken) return this.props.children;
    return (
      <div className="oops" role="alertdialog" aria-labelledby="oops-title">
        <Csepi mood="oops" width={110} />
        <h1 id="oops-title" className="oops__title">
          Hoppá, eltévedtem!
        </h1>
        <p className="oops__text">Kezdjük újra?</p>
        <button type="button" className="big-btn" onClick={restartApp} autoFocus>
          Újra
        </button>
      </div>
    );
  }
}
