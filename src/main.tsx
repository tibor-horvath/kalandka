import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Latin + Latin Extended only: Hungarian needs both (á é … and ő ű).
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-ext-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-ext-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/baloo-2/latin-ext-800.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-ext-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-ext-700.css';
import './styles/global.css';
import './styles/rewards.css';
import './styles/robot.css';
// Here rather than in the parents' area, which loads later: the gate needs it too, and phone.css must come after it.
import './styles/parents.css';
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
