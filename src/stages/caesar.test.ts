import { describe, expect, it } from 'vitest';
import { caesarStage } from './caesar';
import { decrypt } from './caesarStub';

/** 再現できる擬似乱数（テスト用の線形合同法） */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('caesarStage.generate', () => {
  it('鍵は 1〜25 で、鍵で復号すると平文に戻る', () => {
    for (let seed = 0; seed < 500; seed++) {
      const puzzle = caesarStage.generate(seeded(seed));
      const key = Number(puzzle.keyLabel);
      expect(Number.isInteger(key)).toBe(true);
      expect(key).toBeGreaterThanOrEqual(1);
      expect(key).toBeLessThanOrEqual(25);
      expect(decrypt(puzzle.ciphertext, key)).toBe(puzzle.plaintext);
      expect(puzzle.ciphertext).not.toBe(puzzle.plaintext);
    }
  });

  it('鍵 1 と 25、平文 3 通りのすべてが出うる', () => {
    const keys = new Set<string>();
    const plaintexts = new Set<string>();
    const random = seeded(42);
    for (let i = 0; i < 2000; i++) {
      const puzzle = caesarStage.generate(random);
      keys.add(puzzle.keyLabel);
      plaintexts.add(puzzle.plaintext);
    }
    expect(keys.size).toBe(25);
    expect(plaintexts.size).toBe(3);
  });

  it('乱数が 0 や 1 に近い端でも範囲を外れない', () => {
    for (const r of [0, 0.999999999, 1]) {
      const puzzle = caesarStage.generate(() => r);
      const key = Number(puzzle.keyLabel);
      expect(key).toBeGreaterThanOrEqual(1);
      expect(key).toBeLessThanOrEqual(25);
      expect(decrypt(puzzle.ciphertext, key)).toBe(puzzle.plaintext);
    }
  });

  it('和訳があり、平文はローマ字の大文字と空白だけ', () => {
    for (let seed = 0; seed < 50; seed++) {
      const puzzle = caesarStage.generate(seeded(seed));
      expect(puzzle.translation).not.toBe('');
      expect(puzzle.plaintext).toMatch(/^[A-Z ]+$/);
    }
  });

  it('ヒントは 3 段で、3 段目に鍵の差し込み位置がある', () => {
    expect(caesarStage.hints).toHaveLength(3);
    expect(caesarStage.hints[2].body).toContain('{key}');
  });

  it('ヒントのカード名は 手がかり・仕組み・答え の順', () => {
    expect(caesarStage.hints.map((h) => h.label)).toEqual(['手がかり', '仕組み', '答え']);
  });
});
