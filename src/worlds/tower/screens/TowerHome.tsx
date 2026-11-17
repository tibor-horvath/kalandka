import { markOpened, welcome } from '../../../state/worlds';
import { useEffect, type ReactNode } from 'react';
import type { Badge, Place, RewardPlace } from '../../../components/island';
import { WorldHub, type HubActions } from '../../../components/WorldHub';
import { speak } from '../../../lib/speech';
import { gamesIn, isLadderGame, solvedOf, type GameId } from '../../../state/games';
import { ladderOf } from '../../../state/ladder';
import { kidName, useActiveKid, useProfiles } from '../../../state/profiles';
import { useProgress } from '../../../state/progress';
import { newStickers } from '../../../state/stickers';
import { bellBalance, canBuild } from '../../../state/town';
import { Bell, DayArt, DigiArt, ReadArt, SandArt, SeasonArt, SetArt, SleepArt, TownArt } from '../art';

const HELLO = 'Kakukk! Jó, hogy itt vagy a toronynál!';

/** Each game's place on the island: its accessible name and picture. */
const TILES: Partial<Record<GameId, { label: string; art: ReactNode }>> = {
  day: { label: 'Napirend – mi jön utána a napban?', art: <DayArt /> },
  season: { label: 'Évszakok – évszakok, napok, hónapok', art: <SeasonArt /> },
  set: { label: 'Óraállító – állítsd be az órát', art: <SetArt /> },
  read: { label: 'Hány óra? – olvasd le az órát', art: <ReadArt /> },
  digi: { label: 'Digitóra – melyik kijelző mutatja ugyanezt?', art: <DigiArt /> },
  sleep: { label: 'Kakukk alszik – mennyit aludt Kakukk?', art: <SleepArt /> },
  sand: { label: 'Homokóra – mi tart tovább?', art: <SandArt /> }
};

/** Óratorony: Kakukk's clock tower, the third Kalandka world. Every game is open from the start. */
export function TowerHome({ onOpen, onReward, ...actions }: HubActions & { onOpen: (game: GameId) => void; onReward: () => void }) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const shared = profiles.kids.length > 1;
  const sticker = newStickers(progress, 'tower')[0] ?? null;

  const hello = shared ? `Kakukk, ${kidName(kid)}! Jó, hogy itt vagy a toronynál!` : HELLO;
  const greeting = progress.worlds.tower.welcomed ? hello : 'Kakukk! Én Kakukk vagyok!';
  const question = progress.worlds.tower.welcomed ? 'Mit játsszunk ma?' : 'A toronyórában lakom.';
  const intro = progress.worlds.tower.welcomed
    ? `${greeting} ${question}`
    : 'Kakukk! Én Kakukk vagyok, a toronyóra madara. Itt a napokkal, az évszakokkal és az órával játszunk. Kezdjük a Napirenddel!';
  const sayIntro = () => speak(intro, { online: progress.worlds.tower.welcomed ? `${HELLO} ${question}` : intro });

  useEffect(() => {
    if (!sticker) sayIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  const welcomeOnce = () => {
    if (!progress.worlds.tower.welcomed) update((p) => welcome(p, 'tower'));
  };
  const open = (game: GameId) => {
    welcomeOnce();
    if (!progress.worlds.tower.opened.includes(game)) update((p) => markOpened(p, 'tower', game));
    onOpen(game);
  };

  const places: Place[] = gamesIn('tower').map(({ id, name }, i) => {
    const fresh = solvedOf(progress, id) === 0;
    const unopened = fresh && !progress.worlds.tower.opened.includes(id);
    const level = isLadderGame(id) ? ladderOf(progress, id).level : 0;
    const badge: Badge = i === 0 && fresh ? { text: 'Kezdd itt!', kind: 'new' } : unopened ? { text: 'Új!', kind: 'new' } : { text: `${level + 1}. szint`, kind: 'level', level: level + 1 };
    return { id, name, label: TILES[id]!.label, badge, start: i === 0 && fresh, art: TILES[id]!.art, onOpen: () => open(id) };
  });
  const reward: RewardPlace = {
    label: 'Kisváros – építsd fel a várost a harangokból',
    name: 'Kisváros',
    art: <TownArt />,
    icon: <Bell size={30} />,
    count: bellBalance(progress),
    unit: 'harang',
    badge: canBuild(progress) ? { text: 'Építhetsz!', kind: 'build' } : null,
    onClick: () => {
      welcomeOnce();
      onReward();
    }
  };

  return <WorldHub world="tower" places={places} reward={reward} bubble={{ kicker: greeting, title: question, mood: 'cheer' }} onReplay={sayIntro} sticker={sticker} {...actions} />;
}
