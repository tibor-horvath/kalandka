import type { ReactNode } from 'react';
import { podArcs } from '../../components/LevelMeter';
import { LADDER_LEVELS } from '../../state/ladder';
import { PRACTICE_PAY_PER_DAY, podFill, tasksPerReward } from '../../state/pod';
import { useProgress } from '../../state/progress';
import { FRIENDS, FRIEND_GIFTS_EACH, PARTS, SECOND_ROBOT_AFTER, boltBalance } from '../../state/robotParts';
import { FLOWERS, PAGE_STEPS, PLANT_OPTIONS, RECIPES, STICKER_GAMES, VEG_COST, seedBalance, stickerRow, type StickerGameId } from '../../state/rewards';
import { WORLDS, type WorldId } from '../../state/worlds';
import { Seed } from '../../worlds/garden/art';
import { Bolt } from '../../worlds/robot/art';
import { WorldGroup } from './controls';

// What seeds, bolts and stickers are, for grown-ups: the rules from the reward code itself (so the page never
// drifts from what the games do), and where the child stands now. The child never sees this page.

const range = (costs: number[]) => {
  const paid = costs.filter((c) => c > 0);
  const lo = Math.min(...paid);
  const hi = Math.max(...paid);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
};

/** "Every second task": the pod sizes in words. */
const ORDINAL: Record<number, string> = { 1: '', 2: 'második', 3: 'harmadik', 4: 'negyedik', 5: 'ötödik' };

/** Album rows without a ladder: what their stickers count. */
const ROW_ABOUT: Partial<Record<StickerGameId, string>> = {
  learn: 'a számok felismerése a játékban vagy kész lapon',
  kiskert: 'ajándékok a kert lakóinak',
  robotepito: 'alkatrészek, második robot, robotbarátok és ajándékaik',
  'paper-garden': `kész lapok: ${PAGE_STEPS.join(', ')}`,
  'paper-robot': `kész lapok: ${PAGE_STEPS.join(', ')}`
};

/** The child's reward pod as it is now, drawn like the one in the games' top bar. */
function Pod({ world, icon }: { world: WorldId; icon: ReactNode }) {
  const { progress } = useProgress();
  const parts = tasksPerReward(world);
  const fill = podFill(progress, world);
  return (
    <span className="ps-pod" role="img" aria-label={`A gyűjtőkör most ${fill} / ${parts} részig tele`}>
      <svg className="ps-pod__ring" viewBox="0 0 44 44" aria-hidden="true">
        {podArcs(parts).map((d, i) => (
          <path key={i} d={d} className={`ps-pod__quarter${i < fill ? ' is-full' : ''}`} />
        ))}
      </svg>
      <span className="ps-pod__reward" aria-hidden="true">
        {icon}
      </span>
    </span>
  );
}

function Rule({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="pa-card pa-card--tight pa-rw-rule">
      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      <h3 className="pa-h3">{title}</h3>
      <p className="pa-muted">{children}</p>
    </div>
  );
}

function Currency({
  world,
  name,
  one,
  icon,
  balance,
  rule,
  spendTitle,
  spend,
  note
}: {
  world: WorldId;
  name: string;
  /** One of it, as in "a következő magig". */
  one: string;
  icon: (size: number) => ReactNode;
  balance: number;
  rule: string;
  spendTitle: string;
  spend: [string, string][];
  note: string;
}) {
  const { progress } = useProgress();
  const parts = tasksPerReward(world);
  const left = parts - podFill(progress, world);
  const unit = world === 'robot' ? 'kör' : 'feladat';
  const worldName = WORLDS.find((w) => w.id === world)!.name;
  const headId = `rw-${world}`;
  return (
    <section className={`pa-card pa-rw-cur pa-rw-cur--${world}`} aria-labelledby={headId}>
      <div className="pa-spread">
        <div className="pa-row">
          {icon(32)}
          <h3 id={headId} className="pa-rw-cur__name">
            {name}
          </h3>
          <span className="pa-muted">{worldName}</span>
        </div>
        <span className="pa-rw-pill">Most {balance}</span>
      </div>
      <div className="pa-rw-pod">
        <Pod world={world} icon={icon(24)} />
        <p className="pa-muted">
          Még <b>{left} {unit}</b> a következő {one}ig.
        </p>
      </div>
      <p className="pa-rw-cur__rule">{rule}</p>
      <div>
        <h4 className="pa-eyebrow">{spendTitle}</h4>
        <dl className="pa-rw-costs">
          {spend.map(([what, cost]) => (
            <div key={what}>
              <dt>{what}</dt>
              <dd>{cost}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="pa-muted">{note}</p>
    </section>
  );
}

function StickerTable({ world }: { world: WorldId }) {
  const { progress } = useProgress();
  const rows = STICKER_GAMES.filter((g) => g.world === world).map((g) => {
    const row = stickerRow(progress, g.id);
    const next = row.next;
    const meaning =
      next?.level !== undefined
        ? `${next.level + 1}. szint: ${LADDER_LEVELS[g.id as keyof typeof LADDER_LEVELS][next.level].name}`
        : ROW_ABOUT[g.id];
    return { id: g.id, name: g.name.replace(/\u00ad/g, ''), ...row, meaning };
  });
  return (
    <div className="pa-card pa-rw-table">
      <table>
        <thead>
          <tr>
            <th scope="col">Album sora</th>
            <th scope="col">Megvan</th>
            <th scope="col">Következő matrica</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.name}</th>
              <td>
                <b>{r.earned}</b> / {r.total}
              </td>
              <td>
                {r.next ? (
                  <>
                    <b>{r.next.label}</b>
                    {r.meaning && <span className="pa-rw-table__why"> – {r.meaning}</span>}
                  </>
                ) : (
                  <span className="pa-rw-table__done">Mind megvan</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RewardsPage() {
  const { progress } = useProgress();
  const flowerPackets = range(FLOWERS.map((f) => f.cost));
  const partCosts = range(PARTS.map((p) => p.cost));
  const loaf = RECIPES.find((r) => r.id === 'loaf')!;
  const seed = (size: number) => <Seed size={size} />;
  const bolt = (size: number) => <Bolt size={size} />;

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">Jutalmak</h1>
          <p className="pa-lead">
            Minden megoldott feladattal közelebb kerül egy maghoz vagy csavarhoz, és minden új szintért matricát kap. Itt látod, mi mennyit ér, mire jó,
            és hol tart most.
          </p>
        </div>
      </header>

      <div className="pa-rw-rules">
        <Rule title="Csak gyűlik" icon={<><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>}>
          Semmi nem hervad el, és semmit nem veszünk vissza – akkor sem, ha egy szintet visszalép.
        </Rule>
        <Rule title="Nincs szerencse" icon={<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}>
          Nincs sorsolás és meglepetésdoboz: ugyanaz a munka mindig ugyanannyit ér.
        </Rule>
        <Rule title="Nem a játékidőért" icon={<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>}>
          A megoldott feladat számít, nem a képernyő előtt töltött perc.
        </Rule>
      </div>

      <section className="pa-rw-section" aria-labelledby="rw-pod">
        <h2 id="rw-pod" className="pa-rw-h2">
          Magok és csavarok
        </h2>
        <p className="pa-lead">
          Minden játék felső sávjában, a szintlépcső mellett van egy gyűjtőkör. Megoldott feladatonként egy része megtelik; ha betelik, egy mag (a kertben)
          vagy egy csavar (a műhelyben) kerül a gyerek készletébe.
        </p>
        <div className="pa-grid2">
          <Currency
            world="garden"
            name="Magok"
            one="mag"
            icon={seed}
            balance={seedBalance(progress)}
            rule={`Minden ${ORDINAL[tasksPerReward('garden')]} megoldott feladat 1 mag.`}
            spendTitle="Mire költheti a Kiskertben"
            spend={[
              ...PLANT_OPTIONS.map((o): [string, string] => [`${o.name} (${o.grows} feladat alatt nő meg)`, `${o.cost} mag`]),
              ['Virágmag-csomag a Magtárban (egyszer, örökre)', `${flowerPackets} mag`],
              ['Zöldség a Veteményesben', `${VEG_COST} mag`],
              [`${loaf.name} a Kamrában`, `${loaf.seeds} mag`]
            ]}
            note="Az elültetett növények a további feladatokkal nőnek, termést hoznak, és vendégeket csalogatnak a kertbe."
          />
          <Currency
            world="robot"
            name="Csavarok"
            one="csavar"
            icon={bolt}
            balance={boltBalance(progress)}
            rule={`Minden ${ORDINAL[tasksPerReward('robot')]} megoldott kör 1 csavar.`}
            spendTitle="Mire költheti a Robotépítőben"
            spend={[
              ['Új alkatrész: fej, antenna, test, kar, láb vagy festés', `${partCosts} csavar`],
              ['Visszacserélés egy már megvett alkatrészre', 'ingyen'],
              [`Ajándék egy robotbarátnak, ha egy robot már kész (barátonként ${FRIEND_GIFTS_EACH})`, `1–${FRIEND_GIFTS_EACH} csavar`]
            ]}
            note={`Egy műhelykör több lépésből áll, ezért ritkábban jár csavar. ${SECOND_ROBOT_AFTER} alkatrész után jön a második robot, és robotbarátok költöznek be (${FRIENDS.map((f) => f.after).join(', ')} alkatrésznél). Egy drágább alkatrészre koppintva a gyerek kijelölheti, mire gyűjt; a játékokban látja, hány csavar hiányzik még.`}
          />
        </div>
        <div className="pa-rw-note">
          <p>
            <b>Papíron is számít.</b> A kinyomtatott és késznek jelölt feladatlap minden feladata ugyanúgy tölti a gyűjtőkört, mint a játékban – egyszer, a
            befejezésért, nem a hibátlanságért.
          </p>
          <p>
            <b>Végigjátszott játék.</b> Ha egy játék minden szintje megvan, gyakorlásként játékonként naponta legfeljebb {PRACTICE_PAY_PER_DAY} magot vagy
            csavart ad; utána másnapig csak a növények nőnek tőle.
          </p>
        </div>
      </section>

      <section className="pa-rw-section" aria-labelledby="rw-stickers">
        <h2 id="rw-stickers" className="pa-rw-h2">
          Matricák – tudásért, nem mennyiségért
        </h2>
        <div className="pa-rw-rules">
          <Rule title="Szintenként egy" icon={<><path d="M4 20h4v-6H4z" /><path d="M10 20h4V9h-4z" /><path d="M16 20h4V4h-4z" /></>}>
            Egy játék minden új szintje egy matrica, az ott megoldott első feladattal vagy egy kész lappal. Minden szintet külön kell teljesíteni, a sorrend mindegy. Játékonként legfeljebb hét.
          </Rule>
          <Rule title="A helyén marad" icon={<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.8z" />}>
            Ha a játék visszalép egy könnyebb szintre, a matrica akkor is megmarad.
          </Rule>
          <Rule title="Külön sorok" icon={<><path d="M6 2h9l4 4v16H6z" /><path d="M9 12l2 2 4-4" /></>}>
            A Kiskert és a Robotépítő mérföldkövei, és a kész feladatlapok ({PAGE_STEPS.slice(0, 5).join(', ')}… lap).
          </Rule>
        </div>
        {WORLDS.map((w) => (
          <WorldGroup key={w.id} world={w} heading="h3">
            <StickerTable world={w.id} />
          </WorldGroup>
        ))}
        <p className="pa-muted">Az albumot a gyerkőc a sziget lila könyvén nyitja meg; ott egy matricára koppintva Csepi gyerekszavakkal mondja el, mire kapta.</p>
      </section>
    </div>
  );
}
