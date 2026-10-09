import { describe, expect, it } from 'vitest';
import { alphabetTable, caesarStage, MESSAGES } from './caesar';
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
      const key = Number(puzzle.hintValues['key']);
      expect(Number.isInteger(key)).toBe(true);
      expect(key).toBeGreaterThanOrEqual(1);
      expect(key).toBeLessThanOrEqual(25);
      expect(decrypt(puzzle.ciphertext, key)).toBe(puzzle.plaintext);
      expect(puzzle.ciphertext).not.toBe(puzzle.plaintext);
    }
  });

  it('鍵 1 と 25、平文 10 通りのすべてが出うる', () => {
    const keys = new Set<string>();
    const plaintexts = new Set<string>();
    const random = seeded(42);
    for (let i = 0; i < 2000; i++) {
      const puzzle = caesarStage.generate(random);
      keys.add(puzzle.hintValues['key'] ?? '');
      plaintexts.add(puzzle.plaintext);
    }
    expect(keys.size).toBe(25);
    expect(plaintexts.size).toBe(10);
  });

  it('乱数が 0 や 1 に近い端でも範囲を外れない', () => {
    for (const r of [0, 0.999999999, 1]) {
      const puzzle = caesarStage.generate(() => r);
      const key = Number(puzzle.hintValues['key']);
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

  it('電文は 10 件で、すべて A–Z と空白だけ・和訳つき・重複なし', () => {
    expect(MESSAGES).toHaveLength(10);
    for (const m of MESSAGES) {
      expect(m.plaintext).toMatch(/^[A-Z]+( [A-Z]+)*$/);
      expect(m.translation.trim()).not.toBe('');
    }
    expect(new Set(MESSAGES.map((m) => m.plaintext)).size).toBe(10);
  });

  it('解説カードは 4 枚で、見出しと本文があり、図は 1 枚目だけ', () => {
    expect(caesarStage.notes).toHaveLength(4);
    for (const card of caesarStage.notes) {
      expect(card.title).not.toBe('');
      expect(card.body).not.toBe('');
    }
    expect(caesarStage.notes.map((c) => c.figure !== undefined)).toEqual([true, false, false, false]);
  });

  it('ヒントは 3 段で、3 段目に鍵の差し込み位置がある', () => {
    expect(caesarStage.hints).toHaveLength(3);
    expect(caesarStage.hints[2].body).toContain('{key}');
  });

  it('ヒントのカード名は 手がかり・仕組み・答え の順', () => {
    expect(caesarStage.hints.map((h) => h.label)).toEqual(['手がかり', '仕組み', '答え']);
  });
});

describe('alphabetTable', () => {
  it('A〜Z と 0〜25 を 2 段に分けて並べ、文字の下に番号が来る', () => {
    const rows = alphabetTable();
    expect(rows).toHaveLength(5);
    const letters = (r: string | undefined) => (r ?? '').trim().split(/\s+/);
    expect([...letters(rows[0]), ...letters(rows[3])].join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    expect([...letters(rows[1]), ...letters(rows[4])].map(Number)).toEqual(Array.from({ length: 26 }, (_, i) => i));
    // 文字の列と番号の列が同じ幅（縦に揃う）
    expect(rows[0]?.length).toBe(rows[1]?.length);
    expect(rows[3]?.length).toBe(rows[4]?.length);
  });
});
