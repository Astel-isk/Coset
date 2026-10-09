import { describe, expect, it } from 'vitest';
import { generateRecord, paperHead } from './record';

/** 再現できる擬似乱数（テスト用の線形合同法） */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('generateRecord', () => {
  it('記録番号は 0001〜9999 の 4 桁、時刻は HH:MM の範囲に収まる', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const { no, time } = generateRecord(seeded(seed));
      expect(no).toMatch(/^\d{4}$/);
      expect(Number(no)).toBeGreaterThanOrEqual(1);
      expect(Number(no)).toBeLessThanOrEqual(9999);
      expect(time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    }
  });

  it('乱数の両端でも範囲を外れず、ゼロ埋めされる', () => {
    expect(generateRecord(() => 0)).toEqual({ no: '0001', time: '00:00' });
    expect(generateRecord(() => 1)).toEqual({ no: '9999', time: '23:59' });
  });

  it('乱数の列から値を決める（記録番号 → 時 → 分の順に消費）', () => {
    // 0.0416 * 9999 = 415.96 → 415 + 1 = 416、0.5 * 24 = 12、0.25 * 60 = 15
    const values = [0.0416, 0.5, 0.25];
    let i = 0;
    const random = () => values[i++] ?? 0;
    expect(generateRecord(random)).toEqual({ no: '0416', time: '12:15' });
  });

  it('値が出題のたびに変わる', () => {
    const random = seeded(7);
    const nos = new Set<string>();
    for (let i = 0; i < 50; i++) nos.add(generateRecord(random).no);
    expect(nos.size).toBeGreaterThan(40);
  });
});

describe('paperHead', () => {
  it('傍受時刻を電文の見出しに入れる', () => {
    expect(paperHead({ no: '0417', time: '22:14' })).toBe('電文 ・ 傍受 22:14 ・ 発信元 不明');
  });
});
