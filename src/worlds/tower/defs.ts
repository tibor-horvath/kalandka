import type { GameDefsOf } from '../types';
import { DIGI_LEVELS, READ_LEVELS, SET_LEVELS } from './games/clock';
import { DAY_LEVELS } from './games/day';
import { SAND_LEVELS } from './games/sand';
import { SEASON_LEVELS } from './games/season';
import { SLEEP_LEVELS } from './games/sleep';

// What shared code needs to know about each of the world's games, besides its name in the manifest: its look in the
// album and the parents' corner, and for a levelled game its ladder, the words and notes about it, and its level stickers.
// Shared tables (ladder rules, stickers, parents' notes and tiles) are built from these; a new game adds its entry here.

export const towerDefs = {
  day: {
    look: { skill: 'napirend, napszakok', glyph: '☀→☾', tile: 'pa-tile--sun', color: '#F2B33D', ink: '#10233A' },
    ladder: {
      levels: DAY_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Napirendben',
        unit: 'feladat',
        hard: 'A legutóbbi feladatokban többször is rossz kártyát választott.',
        home: 'Este meséljétek el együtt a napot sorban: mi volt reggel, délben, délután?'
      },
      stickers: [
        { from: 0, mark: '→', label: 'Mi jön utána?', praise: 'Tudod, mi jön utána a napodban!' },
        { from: 1, mark: '123', label: 'Három kártya', praise: 'Három kártyát is sorba raksz!' },
        { from: 2, mark: '1234', label: 'Négy kártya', praise: 'Egy egész napot sorba raktál!' },
        { from: 3, mark: '☀', label: 'Napszakok', praise: 'Tudod, mi van reggel, délben, délután és este!' },
        { from: 4, mark: '?←', label: 'Mi volt előbb?', praise: 'Mindig tudod, mi volt előbb!' }
      ]
    }
  },
  season: {
    look: { skill: 'évszakok, a hét napjai, hónapok', glyph: '❀', tile: 'pa-tile--pink', color: '#3D8F3F', ink: '#FFFFFF' },
    ladder: {
      levels: SEASON_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'Az Évszakokban',
        unit: 'feladat',
        hard: 'A legutóbbi feladatokban többször is rosszul választott.',
        home: 'Reggelente mondjátok ki: ma kedd van, tegnap hétfő volt, holnap szerda lesz.'
      },
      stickers: [
        { from: 0, mark: '❀', label: 'Évszak', praise: 'Egy fáról is megmondod, melyik évszak van!' },
        { from: 1, mark: '↻', label: 'Évszakkör', praise: 'Tudod, hogyan jönnek egymás után az évszakok!' },
        { from: 2, mark: '7', label: 'A hét napjai', praise: 'Sorban tudod a hét napjait!' },
        { from: 3, mark: '±1', label: 'Tegnap, holnap', praise: 'Tudod, mi volt tegnap és mi lesz holnap!' },
        { from: 4, mark: '±2', label: 'Holnapután', praise: 'Már a holnaputánt is kiszámolod!' },
        { from: 5, mark: '12', label: 'Hónapok', praise: 'Tudod, melyik hónap melyik évszakban van!' }
      ]
    }
  },
  set: {
    look: { skill: 'óra beállítása', glyph: '3:00', tile: 'pa-tile--blue', color: '#5B4B9A', ink: '#FFFFFF', albumName: 'Óra­állító' },
    ladder: {
      levels: SET_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jól beállított óra', hard: 'nehéz feladat' },
      notes: {
        where: 'Az Óraállítóban',
        unit: 'feladat',
        hard: 'A legutóbbi feladatokban többször is rossz helyre állította a mutatót.',
        home: 'Egész órakor kérdezd meg: hova mutat most a kis mutató? Egy papíróra is sokat segít.'
      },
      stickers: [
        { from: 0, mark: '3', label: 'Kis mutató', praise: 'Beállítod a kis mutatót!' },
        { from: 1, mark: '3:00', label: 'Egész óra', praise: 'Két mutatóval is beállítod az egész órát!' },
        { from: 2, mark: '½', label: 'Fél óra', praise: 'Beállítod a fél órát is!' },
        { from: 3, mark: '¼', label: 'Negyedek', praise: 'A negyedeket is beállítod!' },
        { from: 4, mark: '5p', label: 'Öt percek', praise: 'Percre pontosan beállítod az órát!' }
      ]
    }
  },
  read: {
    look: { skill: 'óra leolvasása', glyph: '?:30', tile: 'pa-tile--sky', color: '#2E86DE', ink: '#FFFFFF' },
    ladder: {
      levels: READ_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Hány óra? játékban',
        unit: 'feladat',
        hard: 'A legutóbbi feladatokban többször is rossz időt választott.',
        home: 'Nézzétek meg együtt a falióra mutatóit: melyik a kicsi, merre tart?'
      },
      stickers: [
        { from: 0, mark: '3', label: 'Kis mutató', praise: 'Leolvasod, hova mutat a kis mutató!' },
        { from: 1, mark: '3:00', label: 'Egész óra', praise: 'Leolvasod az egész órát!' },
        { from: 2, mark: '½', label: 'Fél óra', praise: 'Leolvasod a fél órát is!' },
        { from: 3, mark: '¼', label: 'Negyedek', praise: 'Leolvasod a negyedeket is!' },
        { from: 4, mark: '5p', label: 'Öt percek', praise: 'Percre pontosan leolvasod az órát!' }
      ]
    }
  },
  digi: {
    look: { skill: 'mutatós és digitális óra', glyph: '7:15', tile: 'pa-tile--sand', color: '#1E2B3C', ink: '#FFC93C' },
    ladder: {
      levels: DIGI_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Digitórában',
        unit: 'feladat',
        hard: 'A legutóbbi feladatokban többször is rossz kijelzőt választott.',
        home: 'Ha digitális órát láttok, olvassátok le, és mondjátok el úgy is: negyed nyolc.'
      },
      stickers: [
        { from: 0, mark: '7:00', label: 'Egész óra', praise: 'A digitális órát is érted!' },
        { from: 1, mark: '7:30', label: 'Fél óra', praise: 'A fél órát is megtalálod a kijelzőn!' },
        { from: 2, mark: '7:15', label: 'Negyedek', praise: 'A negyedeket is megtalálod a kijelzőn!' },
        { from: 3, mark: '7:05', label: 'Öt percek', praise: 'A perceket is leolvasod a kijelzőről!' },
        { from: 4, mark: '15:00', label: 'Délután', praise: 'Már a délutáni órákat is érted!' }
      ]
    }
  },
  sleep: {
    look: { skill: 'eltelt idő', glyph: '+2', tile: 'pa-tile--pink', color: '#9C8ADB', ink: '#10233A' },
    ladder: {
      levels: SLEEP_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Kakukk alszik játékban',
        unit: 'feladat',
        hard: 'A legutóbbi feladatokban többször is rosszul számolta az eltelt időt.',
        home: 'Számoljátok ki együtt: ha háromkor indulunk és ötkor érünk haza, mennyi ideig voltunk oda?'
      },
      stickers: [
        { from: 0, mark: '1–3', label: 'Rövid alvás', praise: 'Kiszámoltad, mennyit aludt Kakukk!' },
        { from: 1, mark: '5', label: 'Hosszú alvás', praise: 'A hosszú alvást is kiszámolod!' },
        { from: 2, mark: '12→', label: 'Át a tizenkettőn', praise: 'A tizenkettőn át is jól számolsz!' },
        { from: 3, mark: '1½', label: 'Fél órák', praise: 'A fél órákat is hozzászámolod!' },
        { from: 4, mark: '?:00', label: 'Mikor ébredt?', praise: 'Kiszámoltad, mikor ébredt fel Kakukk!' }
      ]
    }
  },
  sand: {
    look: { skill: 'időtartamok', glyph: '⧗', tile: 'pa-tile--sun', color: '#E9C46A', ink: '#10233A', albumName: 'Homok­óra' },
    ladder: {
      levels: SAND_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Homokórában',
        unit: 'feladat',
        hard: 'A legutóbbi feladatokban többször is rosszul becsülte, mi tart tovább.',
        home: 'Mérjétek le egy homokórával vagy a telefonnal, meddig tart a fogmosás!'
      },
      stickers: [
        { from: 0, mark: '⧗', label: 'Hosszabb', praise: 'Tudod, mi tart tovább!' },
        { from: 1, mark: '⧖', label: 'Rövidebb', praise: 'Tudod, mi ér hamarabb véget!' },
        { from: 2, mark: '⧗⧗', label: 'Leghosszabb', praise: 'Háromból is megtalálod, mi tart a legtovább!' },
        { from: 3, mark: '⧖⧖', label: 'Legrövidebb', praise: 'Háromból is megtalálod, mi ér leghamarabb véget!' },
        { from: 4, mark: '?', label: 'Pillanat, perc, óra', praise: 'Tudod, mi tart egy pillanatig, és mi órákig!' }
      ]
    }
  }
} satisfies GameDefsOf<'tower'>;
