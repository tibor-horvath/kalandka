import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS, type Progress } from './progress';
import {
  BUILDINGS,
  GIFTS_EACH,
  STAGES,
  bellBalance,
  build,
  canBuild,
  give,
  giftCount,
  happenings,
  nowMinutes,
  isOpen,
  nextGift,
  residentToWelcome,
  skyAt,
  stageOf,
  turnClock,
  upgrade,
  upgradeCost,
  welcome
} from './town';

const rich = (bells = 500): Progress => ({ ...DEFAULT_PROGRESS, bells });

describe('the Kisváros', () => {
  it('puts a building up for its bells, once', () => {
    const p = build(rich(5), 'bakery');
    expect(p.town).toEqual(['bakery']);
    expect(bellBalance(p)).toBe(3);
    expect(build(p, 'bakery')).toBe(p);
    expect(build(rich(1), 'bakery').town).toEqual([]);
  });

  it('grows a building through three stages, each a little dearer', () => {
    let p = build(rich(), 'post');
    expect(stageOf(p, 'post')).toBe(1);
    expect(upgradeCost(p, 'post')).toBe(4);
    p = upgrade(p, 'post');
    expect(upgradeCost(p, 'post')).toBe(6);
    p = upgrade(p, 'post');
    expect(stageOf(p, 'post')).toBe(STAGES);
    expect(upgradeCost(p, 'post')).toBeNull();
    expect(upgrade(p, 'post')).toBe(p);
    expect(upgradeCost(rich(), 'school')).toBeNull();
  });

  it('gives each resident five gifts, from one bell to five', () => {
    expect(nextGift(rich(), 'bakery')).toBeNull();
    let p = build(rich(), 'bakery');
    const costs: number[] = [];
    for (let i = 0; i < GIFTS_EACH; i++) {
      costs.push(nextGift(p, 'bakery')!.cost);
      p = give(p, 'bakery');
    }
    expect(costs).toEqual([1, 2, 3, 4, 5]);
    expect(nextGift(p, 'bakery')).toBeNull();
    expect(giftCount(p)).toBe(5);
  });

  it('welcomes each resident once, in the order they moved in', () => {
    let p = build(build(rich(), 'school'), 'bakery');
    expect(residentToWelcome(p)?.id).toBe('school');
    p = welcome(p, 'school');
    expect(residentToWelcome(p)?.id).toBe('bakery');
    p = welcome(p, 'bakery');
    expect(residentToWelcome(p)).toBeNull();
  });

  it('says there is something to buy only when the bells reach it', () => {
    expect(canBuild(rich(1))).toBe(false);
    expect(canBuild(rich(2))).toBe(true);
    const all = BUILDINGS.reduce((p, b) => build(p, b.id), rich(37));
    expect(bellBalance(all)).toBe(0);
    expect(canBuild(all)).toBe(false);
    expect(canBuild({ ...all, bells: all.bells + 1 })).toBe(true);
  });

  it('starts the tower clock at the real time and turns it round the day', () => {
    expect(nowMinutes(new Date(2026, 10, 16, 10, 37))).toBe(10 * 60 + 37);
    expect(turnClock(7 * 60, -8 * 60)).toBe(23 * 60);
    expect(turnClock(7 * 60, 18 * 60)).toBe(60);
  });

  it('opens and closes the town by the hour', () => {
    const bakery = BUILDINGS.find((b) => b.id === 'bakery')!;
    expect(isOpen(bakery, 6 * 60)).toBe(true);
    expect(isOpen(bakery, 18 * 60)).toBe(false);
    expect([3, 7, 12, 19, 22].map((h) => skyAt(h * 60))).toEqual(['night', 'morning', 'day', 'evening', 'night']);
    const p = build(build(rich(), 'bakery'), 'station');
    expect(happenings(p, 6 * 60)).toEqual([bakery.opens, 'Kinyitott az állomás.', 'Sípol a mozdony: indul a vonat!']);
    expect(happenings(p, 6 * 60 + 15)).toEqual([]);
    expect(happenings(p, 18 * 60)).toContain('Bezárt a pékség.');
  });
});
