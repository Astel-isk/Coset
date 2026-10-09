import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../stages/vigenereStub';
import { ownersOfWords } from './multiState';
import {
  highlightedCells,
  hoverTarget,
  innerIndexAt,
  mappingColumns,
  outerIndexOf,
  plainLetterOf,
  usedCipherLetters,
} from './mapping';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

describe('mappingColumns', () => {
  it('鍵 0 は上下が同じ並び', () => {
    const cols = mappingColumns(0);
    expect(cols).toHaveLength(26);
    expect(cols.map((c) => c.cipher).join('')).toBe(A);
    expect(cols.map((c) => c.plain).join('')).toBe(A);
  });

  it('鍵 k のとき、上は A 固定、下は A−k から始まる（列 i は暗号文 A+i、平文 A+i−k）', () => {
    const cols = mappingColumns(3);
    expect(cols.map((c) => c.cipher).join('')).toBe(A);
    expect(cols.map((c) => c.plain).join('')).toBe('XYZABCDEFGHIJKLMNOPQRSTUVW');
    expect(cols[0]).toEqual({ cipher: 'A', plain: 'X' });
    expect(cols[3]).toEqual({ cipher: 'D', plain: 'A' });
  });

  it('鍵 25 は下が B から始まる', () => {
    expect(mappingColumns(25)[0]).toEqual({ cipher: 'A', plain: 'B' });
    expect(mappingColumns(25)[25]).toEqual({ cipher: 'Z', plain: 'A' });
  });

  it('復号と一致する（暗号文の文字 X の列の下が、鍵 k で戻した文字）', () => {
    for (const k of [0, 1, 7, 13, 25]) {
      const cols = mappingColumns(k);
      const cipher = encrypt('HELLOWORLD', [k]);
      const restored = decrypt(cipher, [k]);
      expect(cipher.split('').map((ch) => cols[A.indexOf(ch)]?.plain).join('')).toBe(restored);
    }
  });
});

describe('usedCipherLetters', () => {
  const words = ['ABCA', 'DEF', 'GHI'];
  const owners = ownersOfWords(words, 3);

  it('円盤ごとに、その円盤が受け持つ位置の文字だけを集める', () => {
    // 文字の通し番号: A0 B1 C2 A0 | D1 E2 F0 | G1 H2 I0
    expect([...usedCipherLetters(words, owners, 0)].sort()).toEqual(['A', 'F', 'I']);
    expect([...usedCipherLetters(words, owners, 1)].sort()).toEqual(['B', 'D', 'G']);
    expect([...usedCipherLetters(words, owners, 2)].sort()).toEqual(['C', 'E', 'H']);
  });

  it('1 枚だけのときは電文の全文字', () => {
    const one = ownersOfWords(words, 1);
    expect([...usedCipherLetters(words, one, 0)].sort().join('')).toBe('ABCDEFGHI');
  });

  it('A–Z 以外の文字は数えない', () => {
    const w = ['A-B', '12'];
    expect([...usedCipherLetters(w, ownersOfWords(w, 1), 0)].sort()).toEqual(['A', 'B']);
  });
});

describe('hoverTarget / highlightedCells', () => {
  // ステージ 2 の形: 通し番号 0 1 2 | 0 1 2 | 0 1 2 → 円盤 ①②③①②③①②③
  const words = ['ABA', 'ABA', 'ABA'];
  const owners = ownersOfWords(words, 3);

  it('位置から、暗号文の文字とその円盤を求める', () => {
    expect(hoverTarget(words, owners, { word: 0, index: 1 })).toEqual({ letter: 'B', owner: 1 });
    expect(hoverTarget(words, owners, { word: 1, index: 2 })).toEqual({ letter: 'A', owner: 2 });
  });

  it('位置なし・範囲外・文字でない位置は null（反応しない）', () => {
    expect(hoverTarget(words, owners, null)).toBeNull();
    expect(hoverTarget(words, owners, { word: 5, index: 0 })).toBeNull();
    expect(hoverTarget(words, owners, { word: 0, index: 9 })).toBeNull();
    const w = ['A-B'];
    expect(hoverTarget(w, ownersOfWords(w, 1), { word: 0, index: 1 })).toBeNull();
  });

  it('ステージ 2: 同じ文字かつ同じ円盤の出現だけを強調する', () => {
    // 通し番号: A0 B1 A2 | A0 B1 A2 | A0 B1 A2 。A は円盤 ① ③ ① ③ ① ③ の位置にある
    const target = hoverTarget(words, owners, { word: 0, index: 0 });
    expect(target).toEqual({ letter: 'A', owner: 0 });
    const lit = highlightedCells(words, owners, target);
    expect(lit).toEqual([
      [true, false, false],
      [true, false, false],
      [true, false, false],
    ]);
    // ③ が受け持つ A は別の円盤の A とは光らない
    expect(highlightedCells(words, owners, { letter: 'A', owner: 2 })).toEqual([
      [false, false, true],
      [false, false, true],
      [false, false, true],
    ]);
  });

  it('ステージ 1: 同じ文字は全出現が光る（上段・下段で位置の表は共通）', () => {
    const w = ['ABA', 'BA'];
    const o = ownersOfWords(w, 1);
    const lit = highlightedCells(w, o, hoverTarget(w, o, { word: 1, index: 1 }));
    expect(lit).toEqual([
      [true, false, true],
      [false, true],
    ]);
  });

  it('target が null なら全部 false', () => {
    expect(highlightedCells(['AB'], ownersOfWords(['AB'], 1), null)).toEqual([[false, false]]);
  });
});

describe('plainLetterOf / outerIndexOf / innerIndexAt', () => {
  it('暗号文の文字 X は、鍵 k のとき X−k に戻る', () => {
    expect(plainLetterOf('V', 21)).toBe('A');
    expect(plainLetterOf('A', 1)).toBe('Z');
    expect(plainLetterOf('C', 0)).toBe('C');
    expect(plainLetterOf('1', 3)).toBe('');
  });

  it('外周の添字', () => {
    expect(outerIndexOf('A')).toBe(0);
    expect(outerIndexOf('Z')).toBe(25);
    expect(outerIndexOf('-')).toBe(-1);
  });

  it('内周の文字: 外周の A+i と同じ角度には A+i−steps が来る（steps は畳まなくてよい）', () => {
    for (const steps of [0, 1, 5, 26, 31, -3, 57]) {
      for (let i = 0; i < 26; i++) {
        const j = innerIndexAt(i, steps);
        expect(A[j]).toBe(plainLetterOf(A[i] ?? '', steps));
      }
    }
  });
});
