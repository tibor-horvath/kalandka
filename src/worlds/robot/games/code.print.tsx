import { CodePic, CodeSign } from '../art';
import { CODE_LEVELS, PICS, PIC_NAMES, buildCodeRound, type CodeTask, type Sign } from './code';
import { ladderOf } from '../../../state/ladder';
import { At, FAINT, Gap, INK, Pic, flatTasks, spec } from '../../../print/sheet';
import { pickGrid } from '../printKit';

// Kódzár on paper.

const SIGN = 100;
const SIGN_STEP = 112;
const KEY_W = 320;

function SignAt({ sign, x, y, s = 0.9 }: { sign: Sign; x: number; y: number; s?: number }) {
  return (
    <At x={x + (SIGN * (1 - s)) / 2} y={y + (SIGN * (1 - s)) / 2} s={s}>
      <CodeSign sign={sign} textured />
    </At>
  );
}

/** One lock on paper: the key on the left, the code with an empty box under each sign, the note on the right. */
function CodeLock({ task, answers }: { task: CodeTask; answers: boolean }) {
  const hidden = task.hidden;
  // Pöttykód's key would give every answer away on paper: there the child counts.
  const key = task.code[0].kind === 'dots' ? [] : task.key;
  const keyW = key.length ? KEY_W : 0;
  const n = task.code.length;
  const codeW = n * SIGN_STEP;
  const noteX = keyW + codeW + 40;
  const w = hidden ? noteX + 2 * SIGN_STEP + 20 : keyW + codeW;
  const h = Math.max(270, key.length * SIGN_STEP);
  return (
    <Pic w={w} h={h}>
      {key.length > 0 && (
        <g>
          <rect x="0" y="0" width={KEY_W - 30} height={key.length * SIGN_STEP} rx="18" fill="#F4F7FA" stroke={FAINT} strokeWidth="3" />
          {key.map((row, r) => {
            const y = r * SIGN_STEP + 6;
            const covered = hidden?.row === r;
            return (
              <g key={r}>
                <SignAt sign={row.sign} x={8} y={y} s={0.8} />
                <path d={`M112 ${y + 50} H150 M138 ${y + 38} L150 ${y + 50} L138 ${y + 62}`} stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {covered ? (
                  <g>
                    <Gap x={166} y={y} w={SIGN} h={SIGN} />
                    {answers && (
                      <g opacity="0.45">
                        <SignAt sign={row.meaning} x={166} y={y} s={0.8} />
                      </g>
                    )}
                  </g>
                ) : (
                  <SignAt sign={row.meaning} x={166} y={y} s={0.8} />
                )}
              </g>
            );
          })}
        </g>
      )}
      {task.code.map((s, i) => {
        const x = keyW + i * SIGN_STEP;
        return (
          <g key={i}>
            <SignAt sign={s} x={x} y={0} />
            <path d={`M${x + 50} 108 V136 M${x + 40} 126 L${x + 50} 136 L${x + 60} 126`} stroke={FAINT} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Gap x={x} y={150} w={SIGN} h={SIGN} />
            {answers && (
              <g opacity="0.45">
                <SignAt sign={task.answer[i]} x={x} y={150} />
              </g>
            )}
          </g>
        );
      })}
      {hidden && (
        <g>
          <rect x={noteX} y="0" width={2 * SIGN_STEP + 20} height="260" rx="10" fill="#FFFBEA" stroke={FAINT} strokeWidth="3" />
          {hidden.note.map((r, i) => (
            <g key={i}>
              <SignAt sign={r.sign} x={noteX + 14 + i * SIGN_STEP} y={8} s={0.8} />
              <SignAt sign={r.meaning} x={noteX + 14 + i * SIGN_STEP} y={150} s={0.8} />
            </g>
          ))}
          <path d={`M${noteX + 126} 100 V150 M${noteX + 114} 138 L${noteX + 126} 150 L${noteX + 138} 138`} stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </Pic>
  );
}

/** The pictures a lamp can mean, named for the grown-up. */
function PicLegend() {
  return (
    <>
      {PICS.map((p) => (
        <span key={p} className="ps-legend__item">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <CodePic pic={p} />
          </svg>
          {PIC_NAMES[p]}
        </span>
      ))}
    </>
  );
}

export const code = spec<CodeTask>({
  id: 'code',
  rev: 1,
  // Lamps are on every sheet but the dice one, in the code or in the answer.
  colorKey: (level) => CODE_LEVELS[level].kind !== 'dots',
  levels: CODE_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'code').level,
  grid: (level, d) => {
    const kind = CODE_LEVELS[level].kind;
    if (kind === 'copy' || kind === 'long' || kind === 'dots') return pickGrid(d, [2, 3], [2, 5], [3, 6]);
    return pickGrid(d, [1, 3], [1, 5], [2, 6]);
  },
  ask: (level) => {
    switch (CODE_LEVELS[level].kind) {
      case 'copy':
      case 'long':
        return 'Színezd ki a dobozokat ugyanolyan színűre, mint a lámpák fölöttük!';
      case 'dots':
        return 'Számold meg a pöttyöket, és írd a dobozba a számot!';
      case 'send':
        return 'Küldj üzenetet! Keresd meg a képet a kódtáblán, és színezd a dobozt a lámpa színére!';
      case 'missing':
        return 'Az egyik sort letakarták. Nézd meg a cetlit, rajzold be a hiányzó jelet, aztán fejtsd meg a kódot!';
      default:
        return 'Mit jelentenek a lámpák? Nézd meg a kódtáblát, és rajzold a dobozokba!';
    }
  },
  tip: (level) => {
    switch (CODE_LEVELS[level].kind) {
      case 'copy':
      case 'long':
        return 'Balról jobbra haladjanak, és mondják ki a színeket hangosan.';
      case 'dots':
        return 'Ujjal érintsék meg a pöttyöket, miközben számolnak.';
      case 'send':
        return 'Itt fordítva olvassák a kódtáblát: a képtől a lámpáig. Segíthet, ha ujjal követik a sort.';
      case 'missing':
        return 'A cetlin az egyik lámpa a letakart sorból van: abból derül ki, mit jelent.';
      default:
        return 'Minden lámpánál keressék meg a kódtáblán ugyanazt a színt, és nézzék meg, mi áll mellette.';
    }
  },
  legend: (level) => (['copy', 'long', 'dots'].includes(CODE_LEVELS[level].kind) ? null : <PicLegend />),
  tasks: (req) => flatTasks(req, (r) => buildCodeRound(req.level, r).tasks),
  Task: ({ task, answers }) => <CodeLock task={task} answers={answers} />
});
