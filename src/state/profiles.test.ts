import { describe, expect, it } from 'vitest';
import { ADD_LEVELS } from '../worlds/garden/games/add/logic';
import { PRINT_SHEETS } from '../print/catalog';
import { LADDER_RULES, ladderOf, type LadderGame } from './ladder';
import { DEFAULT_PROGRESS } from './progress';
import { newStickers } from './rewards';
import { AGE_BANDS, MAX_KIDS, addKid, applyUpdate, editKid, firstKid, freeAvatars, fromProgress, parseProfiles, progressOf, removeKid, setActive, startingProgress } from './profiles';

const two = () => addKid(fromProgress(DEFAULT_PROGRESS, 'a'), { name: 'Lili', avatar: 'ladybug', age: '5' }, 'b');

describe('profiles', () => {
  it('turns the old single-child save into the first profile, keeping every bit of progress', () => {
    const legacy = JSON.stringify({ ...DEFAULT_PROGRESS, seeds: 42, garden: ['tulipan'], voice: false, screenLimitMin: 20 });
    const s = parseProfiles(null, legacy);
    expect(s.kids).toHaveLength(1);
    expect(s.kids[0].name).toBe('');
    const p = progressOf(s, s.activeId);
    expect(p.seeds).toBe(42);
    expect(p.garden).toEqual(['tulipan']);
    expect(p.voice).toBe(false);
    expect(p.screenLimitMin).toBe(20);
  });

  it('moves saves without a limit to 15 minutes once, keeping a chosen limit and a later "no limit"', () => {
    const { limitDefaulted: _, ...old } = DEFAULT_PROGRESS;
    const save = (a: object, b: object) => JSON.stringify({ kids: [{ id: 'a', name: 'A', avatar: 'frog', age: null }, { id: 'b', name: 'B', avatar: 'bee', age: null }], activeId: 'a', progress: { a, b } });
    const s = parseProfiles(save({ ...old, screenLimitMin: 0 }, { ...old, screenLimitMin: 30 }), null);
    expect(progressOf(s, 'a').screenLimitMin).toBe(15);
    expect(progressOf(s, 'b').screenLimitMin).toBe(30);
    const off = applyUpdate(s, 'a', (p) => ({ ...p, screenLimitMin: 0 }));
    expect(progressOf(parseProfiles(JSON.stringify(off), null), 'a').screenLimitMin).toBe(0);
  });

  it('starts fresh with one profile when nothing is saved, and survives a broken save', () => {
    expect(parseProfiles(null, null).kids).toHaveLength(1);
    expect(parseProfiles('{oops', null).kids).toHaveLength(1);
    expect(progressOf(parseProfiles('{oops', null), parseProfiles('{oops', null).activeId).seeds).toBe(0);
  });

  it('reads its own save back', () => {
    const s = applyUpdate(two(), 'b', (p) => ({ ...p, seeds: 5 }));
    const back = parseProfiles(JSON.stringify(s), null);
    expect(back.kids.map((k) => k.name)).toEqual(['', 'Lili']);
    expect(progressOf(back, 'b').seeds).toBe(5);
    expect(progressOf(back, 'a').seeds).toBe(0);
  });

  it('moves a saved 3–4 age to 5 and drops unknown ages', () => {
    const s = two();
    const old = { ...s, kids: [{ ...s.kids[0], age: '3-4' }, { ...s.kids[1], age: '9' }] };
    expect(parseProfiles(JSON.stringify(old), null).kids.map((k) => k.age)).toEqual(['5', null]);
  });

  it('keeps progress per child and device settings shared', () => {
    let s = two();
    s = applyUpdate(s, 'a', (p) => ({ ...p, seeds: 3, voice: false, screenLimitMin: 30 }));
    expect(progressOf(s, 'a').seeds).toBe(3);
    expect(progressOf(s, 'b').seeds).toBe(0);
    expect(progressOf(s, 'b').voice).toBe(false);
    expect(progressOf(s, 'b').screenLimitMin).toBe(15);
  });

  it('sets starting levels from the age band', () => {
    expect(startingProgress('5')).toEqual(DEFAULT_PROGRESS);
    expect(startingProgress('6').learnRound).toBe(5);
    const big = startingProgress('7+');
    expect(big.unlockAll).toBe(true);
    expect(ladderOf(big, 'water').level).toBe(2);
    expect(progressOf(addKid(fromProgress(DEFAULT_PROGRESS, 'a'), { name: 'Bence', avatar: 'frog', age: '7+' }, 'c'), 'c').unlockAll).toBe(true);
  });

  it('starts older children higher on every ladder, never above the top and never with a floor', () => {
    for (const game of Object.keys(LADDER_RULES) as LadderGame[]) {
      const six = ladderOf(startingProgress('6'), game);
      const seven = ladderOf(startingProgress('7+'), game);
      expect(seven.level, game).toBeLessThan(LADDER_RULES[game].levels);
      expect(seven.level, game).toBeGreaterThanOrEqual(six.level);
      expect(six.floor + seven.floor, game).toBe(0);
    }
    expect(startingProgress('7+').ladders.add).toMatchObject({ level: ADD_LEVELS.findIndex((l) => l.name === '10-ig, továbbszámolással') });
  });

  it('does not celebrate stickers for levels the child was only placed on', () => {
    for (const age of ['6', '7+'] as const) expect(newStickers(startingProgress(age))).toEqual([]);
  });

  it('opens the printed sheets at a level that exists, for every age', () => {
    for (const age of [null, ...AGE_BANDS]) {
      for (const s of PRINT_SHEETS) {
        const level = s.current(startingProgress(age));
        expect(level, `${age} ${s.id}`).toBeGreaterThanOrEqual(0);
        expect(level, `${age} ${s.id}`).toBeLessThan(s.levels.length);
      }
    }
  });

  it('gives each child a different figure and stops at one per figure', () => {
    let s = two();
    expect(freeAvatars(s)).not.toContain('frog');
    expect(freeAvatars(s, 'a')).toContain('frog');
    for (const avatar of freeAvatars(s)) s = addKid(s, { name: avatar, avatar, age: null });
    expect(s.kids).toHaveLength(MAX_KIDS);
    expect(addKid(s, { name: 'Extra', avatar: 'frog', age: null }).kids).toHaveLength(MAX_KIDS);
  });

  it('removes a child with their progress but never the last one', () => {
    let s = setActive(two(), 'b');
    s = removeKid(s, 'b');
    expect(s.kids.map((k) => k.id)).toEqual(['a']);
    expect(s.activeId).toBe('a');
    expect(s.progress.b).toBeUndefined();
    expect(removeKid(s, 'a')).toBe(s);
  });

  it('names the first child on a new device with starting levels for their age', () => {
    const fresh = fromProgress(startingProgress(null), 'a');
    const s = firstKid(fresh, { name: 'Bence', avatar: 'bee', age: '7+' });
    expect(s.kids).toEqual([{ id: 'a', name: 'Bence', avatar: 'bee', age: '7+' }]);
    expect(s.activeId).toBe('a');
    expect(progressOf(s, 'a').unlockAll).toBe(true);
  });

  it('renames and switches only to existing children', () => {
    const s = editKid(two(), 'a', { name: 'Bence' });
    expect(s.kids[0].name).toBe('Bence');
    expect(setActive(s, 'nobody').activeId).toBe('a');
    expect(setActive(s, 'b').activeId).toBe('b');
  });
});
