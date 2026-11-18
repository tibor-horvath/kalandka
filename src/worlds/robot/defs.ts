import type { GameDefsOf } from '../types';
import { CODE_LEVELS } from './games/code';
import { FIX_LEVELS } from './games/fix';
import { MIRROR_LEVELS } from './games/mirror';
import { PATH_LEVELS } from './games/path';
import { SCALE_LEVELS } from './games/scale';
import { SEQ_LEVELS } from './games/seq';
import { SORT_LEVELS } from './games/sort';

// What shared code needs to know about each of the world's games, besides its name in the manifest: its look in the
// album and the parents' corner, and for a levelled game its ladder, the words and notes about it, and its level stickers.
// Shared tables (ladder rules, stickers, parents' notes and tiles) are built from these; a new game adds its entry here.

export const robotDefs = {
  path: {
    look: { skill: 'programozás', glyph: '↑→', tile: 'pa-tile--sky', color: '#138A86', ink: '#FFFFFF' },
    ladder: {
      levels: PATH_LEVELS,
      up: 4,
      down: 2,
      stepWords: { good: 'jó pálya', hard: 'nehéz pálya' },
      notes: {
        where: 'A Robotútban',
        unit: 'pálya',
        hard: 'A legutóbbi pályákon többször nekiment valaminek, vagy megnézte az utat.',
        home: 'Legyél te a robot: ő mondja el lépésenként, hogyan jutsz el az ajtótól a konyháig.'
      },
      counted: 'pálya',
      ageStart: { '7+': 2 },
      stickers: [
        { from: 0, mark: '1', label: 'Első út', praise: 'Elvezetted a robotot az elemhez!', legacy: ['path-first'] },
        { from: 1, mark: '▣', label: 'Dobozok között', praise: 'A dobozok között is elvezetted a robotot!' },
        { from: 2, mark: '▶', label: 'Tervező', praise: 'Előre megtervezted a robot útját!', legacy: ['path-plan'] },
        { from: 3, mark: '▶▣', label: 'Kerülő terv', praise: 'Előre megtervezted a kerülőutat is!' },
        { from: 4, mark: '→→', label: 'Hosszú út', praise: 'A hosszú úton is elvezetted a robotot!' },
        { from: 5, mark: '×3', label: 'Ismétlő', praise: 'Az ismétléssel rövid lett a programod!' },
        { from: 6, mark: '↻', label: 'Fordulós', praise: 'A robot arra megy, amerre néz, és te tudod, merre fordítsd!', legacy: ['path-turn'] },
        { from: 7, mark: '↻▣', label: 'Fordulj, kerüld ki', praise: 'Fordulva is kikerülöd a dobozokat!' },
        { from: 8, mark: '×↻', label: 'Ismételd és fordulj', praise: 'Egy programban ismételsz és fordulsz is!', legacy: ['path-repeat'] },
        { from: 9, mark: '2', label: 'Két elem', praise: 'Egy programmal két elemet is összegyűjtöttél!', legacy: ['path-two'] }
      ]
    }
  },
  sort: {
    look: { skill: 'csoportosítás, szabályok', glyph: '●▲', tile: 'pa-tile--sand', color: '#5E7184', ink: '#FFFFFF', albumName: 'Válogató­gép' },
    ladder: {
      levels: SORT_LEVELS,
      up: 4,
      down: 2,
      stepWords: { good: 'jó kör', hard: 'nehéz kör' },
      notes: {
        where: 'A Válogatógépben',
        unit: 'kör',
        hard: 'A legutóbbi körökben többször is rossz dobozba tette az alkatrészt.',
        home: 'Válogassátok szét a zoknikat előbb szín, aztán méret szerint.'
      },
      counted: 'kör',
      ageStart: { '6': 1, '7+': 3 },
      stickers: [
        { from: 0, mark: '2', label: 'Első válogatás', praise: 'Minden darabot a helyére tettél!', legacy: ['sort-first'] },
        { from: 1, mark: '3', label: 'Három szín', praise: 'Már három színt is szétválogatsz!' },
        { from: 2, mark: '▲', label: 'Formák', praise: 'Már formák szerint is válogatsz!', legacy: ['sort-shape'] },
        { from: 3, mark: '●•', label: 'Nagy és kicsi', praise: 'Már nagyság szerint is válogatsz!' },
        { from: 4, mark: '?', label: 'Kakukktojás', praise: 'Megtalálod, melyik nem illik a többihez!', legacy: ['sort-odd'] },
        { from: 5, mark: '2+', label: 'Két szabály', praise: 'Egyszerre két dologra is figyelsz!', legacy: ['sort-two'] },
        { from: 6, mark: '!', label: 'Szabálykereső', praise: 'Kitaláltad a gép titkos szabályát!', legacy: ['sort-rule'] }
      ]
    }
  },
  scale: {
    look: { skill: 'több, kevesebb, egyenlő', glyph: '=', tile: 'pa-tile--sun', color: '#F2B33D', ink: '#10233A' },
    ladder: {
      levels: SCALE_LEVELS,
      up: 4,
      down: 2,
      stepWords: { good: 'jó kör', hard: 'nehéz kör' },
      notes: {
        where: 'A Mérlegnél',
        unit: 'kör',
        hard: 'Többször is Csavar segített megszámolni a két oldalt.',
        home: 'Egy vállfa két végére akasszatok zacskót, és tegyetek bele ugyanannyi kupakot.'
      },
      counted: 'kör',
      ageStart: { '6': 1, '7+': 2 },
      stickers: [
        { from: 0, mark: '↓', label: 'Első mérés', praise: 'Megmondtad, melyik oldal a nehezebb!', legacy: ['scale-first'] },
        { from: 1, mark: '≈', label: 'Egyforma', praise: 'Észreveszed, ha a két oldal egyforma nehéz!' },
        { from: 2, mark: '=', label: 'Egyensúly', praise: 'Egyensúlyba hoztad a mérleget!', legacy: ['scale-even'] },
        { from: 3, mark: '10', label: 'Egyensúly tízig', praise: 'Már tízig is egyensúlyba hozod a mérleget!' },
        { from: 4, mark: '2', label: 'Kettes súly', praise: 'Már a kettes súlyokkal is kiméred!', legacy: ['scale-two'] },
        { from: 5, mark: '?', label: 'Hiányzó súly', praise: 'Kitaláltad, melyik súly hiányzik!', legacy: ['scale-missing'] },
        { from: 6, mark: 'x', label: 'Titkos doboz', praise: 'Kitaláltad, mennyit nyom a titkos doboz!', legacy: ['scale-secret'] }
      ]
    }
  },
  seq: {
    look: { skill: 'mintázatok, szabályok', glyph: 'AB?', tile: 'pa-tile--blue', color: '#2E5FA8', ink: '#FFFFFF' },
    ladder: {
      levels: SEQ_LEVELS,
      up: 4,
      down: 2,
      stepWords: { good: 'jó kör', hard: 'nehéz kör' },
      notes: {
        where: 'A Mintagépben',
        unit: 'kör',
        hard: 'A legutóbbi körökben többször is rossz kártyát választott a hézagba.',
        home: 'Tapsoljatok mintát: taps, taps, dobbantás – és ő folytatja.'
      },
      counted: 'kör',
      ageStart: { '7+': 2 },
      stickers: [
        { from: 0, mark: 'AB', label: 'Első minta', praise: 'Folytattad a gép első mintáját!', legacy: ['seq-first'] },
        { from: 1, mark: 'ABB', label: 'Hosszú minta', praise: 'A hosszabb mintát is folytatod!' },
        { from: 2, mark: '●■', label: 'Szín és forma', praise: 'Egyszerre figyeled a színt és a formát!', legacy: ['seq-both'] },
        { from: 3, mark: '123', label: 'Növekvő sor', praise: 'Tudod, hogyan nő tovább a sor!' },
        { from: 4, mark: '↻', label: 'Forgató', praise: 'Tudod, merre fordul a nyíl!', legacy: ['seq-turn'] },
        { from: 5, mark: '!', label: 'Hibavadász', praise: 'Megtalálod, hol csúszott el a gép!', legacy: ['seq-fix'] },
        { from: 6, mark: '⇄', label: 'Mintafordító', praise: 'Ugyanazt a mintát nyilakkal is felismered!', legacy: ['seq-translate'] }
      ]
    }
  },
  mirror: {
    look: { skill: 'tükrözés, szimmetria', glyph: '•|•', tile: 'pa-tile--sky', color: '#7FE9F0', ink: '#10233A' },
    ladder: {
      levels: MIRROR_LEVELS,
      up: 4,
      down: 2,
      stepWords: { good: 'jó kör', hard: 'nehéz kör' },
      notes: {
        where: 'A Tükörgépben',
        unit: 'kör',
        hard: 'A legutóbbi körökben többször is rossz helyre tette a lámpát.',
        home: 'Tegyetek egy kézitükröt a rajz mellé: mi kerül a másik oldalra?'
      },
      counted: 'kör',
      ageStart: { '7+': 1 },
      stickers: [
        { from: 0, mark: '•|•', label: 'Első tükör', praise: 'Megtaláltad az első tükörképet!', legacy: ['mirror-first'] },
        { from: 1, mark: '••|', label: 'Több lámpa', praise: 'Több lámpát is jól tükrözöl!' },
        { from: 2, mark: '♥', label: 'Fél kép', praise: 'A tükörrel egész képet rajzolsz!', legacy: ['mirror-picture'] },
        { from: 3, mark: '◐', label: 'Színes kép', praise: 'A színes képet is pontosan tükrözöd!' },
        { from: 4, mark: '⇅', label: 'Fel-le tükör', praise: 'A fekvő tükörrel is boldogulsz!', legacy: ['mirror-flat'] },
        { from: 5, mark: 'b|d', label: 'Tükörkép', praise: 'Már nem téveszted össze a tükörképet a másolattal!', legacy: ['mirror-pick'] },
        { from: 6, mark: '!', label: 'Tükörjavító', praise: 'Megtalálod, hol tévedett a tükörgép!', legacy: ['mirror-fix'] }
      ]
    }
  },
  code: {
    look: { skill: 'jelek és kódok', glyph: '●→?', tile: 'pa-tile--sand', color: '#C98F4E', ink: '#10233A' },
    ladder: {
      levels: CODE_LEVELS,
      up: 4,
      down: 2,
      stepWords: { good: 'jó kör', hard: 'nehéz kör' },
      notes: {
        where: 'A Kódzárnál',
        unit: 'kör',
        hard: 'A legutóbbi körökben többször is rossz gombot nyomott, vagy Csavar mutatta meg a kódot.',
        home: 'Találjatok ki titkos jeleket: a piros kocka azt jelenti, ugorj, a kék, hogy guggolj. Ő olvassa a kódot!'
      },
      counted: 'kör',
      ageStart: { '7+': 2 },
      stickers: [
        { from: 0, mark: '●●', label: 'Első zár', praise: 'Kinyitottad az első kódzárat!', legacy: ['code-first'] },
        { from: 1, mark: '●●●', label: 'Hosszú zár', praise: 'A hosszabb zárat is kinyitod!' },
        { from: 2, mark: '●→', label: 'Kódtábla', praise: 'Már a kódtáblát is el tudod olvasni!', legacy: ['code-key'] },
        { from: 3, mark: '■→', label: 'Új kódtábla', praise: 'Az új kódtáblát is el tudod olvasni!' },
        { from: 4, mark: '•3', label: 'Pöttykód', praise: 'A pöttyökből számot csinálsz!', legacy: ['code-dots'] },
        { from: 5, mark: '→●', label: 'Üzenetküldő', praise: 'Titkos üzenetet küldtél Kutyabotnak!', legacy: ['code-send'] },
        { from: 6, mark: '?', label: 'Kódfejtő', praise: 'Kitaláltad a letakart jelet!', legacy: ['code-crack'] }
      ]
    }
  },
  fix: {
    look: { skill: 'hibakeresés a programban', glyph: '↑✗', tile: 'pa-tile--pink', color: '#D9741A', ink: '#FFFFFF', albumName: 'Hiba­vadász' },
    ladder: {
      levels: FIX_LEVELS,
      up: 4,
      down: 2,
      stepWords: { good: 'jó kör', hard: 'nehéz kör' },
      notes: {
        where: 'A Hibavadásznál',
        unit: 'kör',
        hard: 'A legutóbbi körökben többször is jó kártyára koppintott, vagy Csavar mutatta meg a hibát.',
        home: 'Adj neki rossz utasítást az ajtóig, például egy lépéssel többet: ő keresse meg, hol csúszott el!'
      },
      counted: 'kör',
      ageStart: { '7+': 1 },
      stickers: [
        { from: 0, mark: '↑✓', label: 'Első javítás', praise: 'Megjavítottad az első programot!', legacy: ['fix-first'] },
        { from: 1, mark: '↑↑', label: 'Hosszú program', praise: 'A hosszabb programban is megtalálod a hibát!' },
        { from: 2, mark: '▣', label: 'Dobozkerülő', praise: 'A dobozok között is megtalálod a hibát!', legacy: ['fix-crates'] },
        { from: 3, mark: '✕', label: 'Kártyaszedő', praise: 'Megtalálod a felesleges kártyát!' },
        { from: 4, mark: '×3', label: 'Számjavító', praise: 'Már a rossz számot is kijavítod!', legacy: ['fix-times'] },
        { from: 5, mark: '↰', label: 'Fordulójavító', praise: 'A fordulós programban is megtalálod a hibát!', legacy: ['fix-turn'] },
        { from: 6, mark: '!!', label: 'Dupla javítás', praise: 'Két hibát is megtaláltál egy programban!', legacy: ['fix-two'] }
      ]
    }
  }
} satisfies GameDefsOf<'robot'>;
