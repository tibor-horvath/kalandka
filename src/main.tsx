import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Baloo 2 and Nunito, split so a Hungarian page downloads Latin-1 plus a tiny ő ű file (see the file).
import './styles/fonts.css';
import './styles/global.css';
import './styles/rewards.css';
import './styles/seeds.css';
import './styles/kiskert.css';
import './worlds/robot/robot.css';
import './worlds/tower/tower.css';
import './styles/island.css';
// Here rather than in the parents' area, which loads later: the gate needs it too, and phone.css must come after it.
import './styles/parents.css';
import './styles/print.css';
import './styles/landing.css';
import App from './App';
// Last, so the phone layouts override everything above.
import './styles/phone.css';
import { probeBiometric } from './lib/biometric';
import { listenForInstall } from './lib/install';
import { registerUpdates } from './lib/update';

// Progress lives in localStorage; ask the browser not to evict it under storage pressure.
// Best effort: browsers may decline (or grant silently once the app is installed).
navigator.storage?.persist?.().catch(() => {});
listenForInstall();
// Known before the parents' gate first opens, so a fingerprint-first gate does not flash the question.
void probeBiometric();
registerUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
