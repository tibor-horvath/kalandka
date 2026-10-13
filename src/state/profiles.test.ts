import { describe, expect, it } from 'vitest';
import { PLANTS } from '../games/water/logic';
import { DEFAULT_PROGRESS } from './progress';
import { MAX_KIDS, addKid, applyUpdate, editKid, freeAvatars, fromProgress, parseProfiles, progressOf, removeKid, setActive, startingProgress } from './profiles';

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

  it('keeps progress per child and device settings shared', () => {
    let s = two();
    s = applyUpdate(s, 'a', (p) => ({ ...p, seeds: 3, voice: false, screenLimitMin: 30 }));
    expect(progressOf(s, 'a').seeds).toBe(3);
    expect(progressOf(s, 'b').seeds).toBe(0);
    expect(progressOf(s, 'b').voice).toBe(false);
    expect(progressOf(s, 'b').screenLimitMin).toBe(0);
  });

  it('sets starting levels from the age band', () => {
    expect(startingProgress('5')).toEqual(DEFAULT_PROGRESS);
    expect(startingProgress('6').learnRound).toBe(5);
    const big = startingProgress('7+');
    expect(big.unlockAll).toBe(true);
    expect(big.waterRound).toBe(PLANTS.length);
    expect(progressOf(addKid(fromProgress(DEFAULT_PROGRESS, 'a'), { name: 'Bence', avatar: 'frog', age: '7+' }, 'c'), 'c').unlockAll).toBe(true);
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

  it('renames and switches only to existing children', () => {
    const s = editKid(two(), 'a', { name: 'Bence' });
    expect(s.kids[0].name).toBe('Bence');
    expect(setActive(s, 'nobody').activeId).toBe('a');
    expect(setActive(s, 'b').activeId).toBe('b');
  });
});
