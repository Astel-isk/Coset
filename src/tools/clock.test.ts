import { describe, expect, it } from 'vitest';
import { mod, normalizeAngleDelta, pairWords } from './clock';

describe('mod', () => {
  it('負の数も 0 以上 m 未満に畳む', () => {
    expect(mod(-1, 26)).toBe(25);
    expect(mod(26, 26)).toBe(0);
    expect(mod(53, 26)).toBe(1);
  });
});

describe('pairWords', () => {
  it('空白区切りの語ごとに暗号文と戻した文を対にする', () => {
    expect(pairWords('LPOP UTVVTIJO', 'KONO TSUUSHIN')).toEqual([
      { cipher: 'LPOP', restored: 'KONO' },
      { cipher: 'UTVVTIJO', restored: 'TSUUSHIN' },
    ]);
  });

  it('各語で暗号文と戻した文の長さが揃う（等幅で縦に並べるため）', () => {
    for (const p of pairWords('AB CDE', 'XY ZWV')) {
      expect(p.cipher.length).toBe(p.restored.length);
    }
  });
});

describe('normalizeAngleDelta', () => {
  it('0°/360° をまたぐ変化を小さい回転量に畳む', () => {
    expect(normalizeAngleDelta(350)).toBe(-10);
    expect(normalizeAngleDelta(-350)).toBe(10);
    expect(normalizeAngleDelta(20)).toBe(20);
  });
});
