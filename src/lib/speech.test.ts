import { afterEach, describe, expect, it, vi } from 'vitest';

// speech.ts picks its voices when it loads, so each test sets up a fake browser and imports a fresh copy.
async function load(localService: boolean) {
  const spoken: string[] = [];
  const voice = { name: 'Hungarian', lang: 'hu-HU', localService };
  vi.stubGlobal('window', {
    speechSynthesis: {
      getVoices: () => [voice],
      speak: (u: { text: string }) => spoken.push(u.text),
      cancel: () => {},
      addEventListener: () => {}
    }
  });
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    }
  );
  vi.resetModules();
  const speech = await import('./speech');
  return { speech, spoken };
}

afterEach(() => vi.unstubAllGlobals());

describe('speak with an online fallback', () => {
  it('says the full line with a voice on the device', async () => {
    const { speech, spoken } = await load(true);
    speech.speak('Szia, Panni!', { online: 'Szia!' });
    expect(spoken).toEqual(['Szia, Panni!']);
  });

  it('says the fallback with an online voice, so the name never leaves the device', async () => {
    const { speech, spoken } = await load(false);
    speech.speak('Szia, Panni!', { online: 'Szia!' });
    expect(spoken).toEqual(['Szia!']);
  });

  it('says lines without a fallback unchanged with an online voice', async () => {
    const { speech, spoken } = await load(false);
    speech.speak('Melyik játékot választod?');
    expect(spoken).toEqual(['Melyik játékot választod?']);
  });
});

describe('pronounce', () => {
  it('respells matrica so the voice says c, not k, in every form', async () => {
    const { speech, spoken } = await load(true);
    speech.speak('Matricáim: egy új matricát kaptál!');
    expect(spoken).toEqual(['Matritsáim: egy új matritsát kaptál!']);
  });
});
