import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../stages/affineStub';
import {
  affineColumns,
  clashExample,
  clashingColumns,
  clashWarning,
  hoverSentence,
  isInvertible,
  keyTotal,
  plainSources,
  restoreText,
} from './affine';

const COPRIME = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

describe('isInvertible / keyTotal', () => {
  it('1〜25 のうち 26 と互いに素なのは 12 個', () => {
    const ok = Array.from({ length: 25 }, (_, i) => i + 1).filter((a) => isInvertible(a));
    expect(ok).toEqual(COPRIME);
  });

  it('鍵の総数は 12 × 26 = 312', () => {
    expect(keyTotal(26)).toBe(312);
  });
});

describe('affineColumns', () => {
  it('a=3, b=25: 列 i の下の行は (3i+25) を 26 で割った余りの文字（A→Z, B→C, S→B）', () => {
    const cols = affineColumns(3, 25);
    expect(cols).toHaveLength(26);
    expect(cols[0]).toEqual({ index: 0, plain: 'A', cipher: 'Z' });
    expect(cols[1]).toEqual({ index: 1, plain: 'B', cipher: 'C' });
    expect(cols[18]).toEqual({ index: 18, plain: 'S', cipher: 'B' });
  });

  it('a=1, b=0 は上下が同じ（開始時の表）', () => {
    for (const c of affineColumns(1, 0)) expect(c.cipher).toBe(c.plain);
  });

  it('下の行は encrypt の結果と一致する', () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const a of [1, 2, 3, 13, 25]) {
      for (const b of [0, 7, 25]) {
        expect(
          affineColumns(a, b)
            .map((c) => c.cipher)
            .join(''),
        ).toBe(encrypt(alphabet, a, b));
      }
    }
  });

  it('26 と互いに素な a では下の行がすべて異なる（並べ替え）', () => {
    for (const a of COPRIME) {
      expect(new Set(affineColumns(a, 4).map((c) => c.cipher)).size).toBe(26);
    }
  });
});

describe('clashingColumns', () => {
  it('26 と互いに素な a では重なる列がない', () => {
    for (const a of COPRIME) expect(clashingColumns(affineColumns(a, 9)).size).toBe(0);
  });

  it('a=2 では下の行が 13 文字だけになり、26 列すべてが重なる（A と N など）', () => {
    const cols = affineColumns(2, 0);
    expect(cols[0]?.cipher).toBe('A');
    expect(cols[13]?.cipher).toBe('A');
    expect(new Set(cols.map((c) => c.cipher)).size).toBe(13);
    expect(clashingColumns(cols).size).toBe(26);
  });

  it('a=13 では下の行が 2 文字だけで、26 列すべてが重なる', () => {
    const cols = affineColumns(13, 5);
    expect(new Set(cols.map((c) => c.cipher)).size).toBe(2);
    expect(clashingColumns(cols).size).toBe(26);
  });

  it('26 と互いに素でない a（偶数と 13）は、b が何でも必ず重なる', () => {
    for (const a of [2, 4, 6, 8, 10, 12, 13, 14, 16, 18, 20, 22, 24]) {
      for (const b of [0, 1, 25]) expect(clashingColumns(affineColumns(a, b)).size).toBeGreaterThan(0);
    }
  });
});

describe('plainSources', () => {
  it('戻せる a では戻し先が 1 つで、暗号化すると letter になる', () => {
    for (const a of COPRIME) {
      for (const letter of 'ABMZ') {
        const s = plainSources(letter, a, 11);
        expect(s).toHaveLength(1);
        expect(encrypt(s[0] ?? '', a, 11)).toBe(letter);
      }
    }
  });

  it('a=2, b=0: A の戻し先は A と N、B は 0 個', () => {
    expect(plainSources('A', 2, 0)).toEqual(['A', 'N']);
    expect(plainSources('B', 2, 0)).toEqual([]);
  });
});

describe('restoreText', () => {
  it('戻せる a では decrypt と同じ（空白も保つ）', () => {
    const plain = 'KONYA NO KAIGOU WA TORIYAME DA';
    for (const a of COPRIME) {
      const cipher = encrypt(plain, a, 17);
      expect(restoreText(cipher, a, 17)).toBe(plain);
      expect(restoreText(cipher, a, 17)).toBe(decrypt(cipher, a, 17));
    }
  });

  it('戻せない a では、戻し先が 0 個・2 個以上の文字は「?」、空白は保つ', () => {
    // a=2, b=0: 偶数番号の文字だけが暗号文に出て、どれも 2 つの平文（A と N など）から来る
    expect(restoreText('AB C', 2, 0)).toBe('?? ?');
    expect(restoreText('A B', 13, 0)).toBe('? ?');
  });

  it('戻せない a の暗号文を、同じ a で戻すと、文字数と空白の位置が変わらない', () => {
    const cipher = encrypt('HONTOU NO KAGI', 2, 3);
    const restored = restoreText(cipher, 2, 3);
    expect(restored).toHaveLength(cipher.length);
    expect(restored.replace(/[^ ]/g, 'x')).toBe(cipher.replace(/[^ ]/g, 'x'));
    expect(restored).toMatch(/^[A-Z? ]+$/);
  });

  it('戻せない a では、全文字が「?」になる（どの文字も 0 個か 2 個以上）', () => {
    for (const a of [2, 4, 13, 24]) {
      expect(restoreText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', a, 5)).toBe('?'.repeat(26));
    }
  });
});

describe('警告と例', () => {
  it('警告は仕様の文面で、a の値を差し込む', () => {
    expect(clashWarning(2)).toBe('a = 2 では、別々の平文が同じ暗号文になる。この a では戻せない');
    expect(clashWarning(13)).toBe('a = 13 では、別々の平文が同じ暗号文になる。この a では戻せない');
  });

  it('例は A の列の暗号文と同じ文字になる平文 2 つ。戻せる a では null', () => {
    expect(clashExample(2, 0)).toBe('たとえば A と N は、どちらも A になる');
    expect(clashExample(2, 3)).toBe('たとえば A と N は、どちらも D になる');
    expect(clashExample(13, 0)).toBe('たとえば A と C は、どちらも A になる');
    expect(clashExample(3, 25)).toBeNull();
  });
});

describe('hoverSentence', () => {
  it('戻せる a: 平文の 1 文字を示す（仕様の例 B(1)、a=3, b=25 → S(18)）', () => {
    expect(hoverSentence('B', 3, 25)).toBe('暗号文の B(1) は、a = 3, b = 25 のとき平文の S(18) から来る');
  });

  it('戻せる a: 示した平文を暗号化すると、その暗号文になる', () => {
    for (const a of COPRIME) {
      for (let b = 0; b < 26; b += 5) {
        const s = hoverSentence('Q', a, b);
        const m = /平文の ([A-Z])\((\d+)\) から来る$/.exec(s);
        expect(m).not.toBeNull();
        expect(encrypt(m?.[1] ?? '', a, b)).toBe('Q');
        expect(Number(m?.[2])).toBe((m?.[1] ?? 'A').charCodeAt(0) - 65);
      }
    }
  });

  it('戻せない a: 候補が 2 つなら列挙する', () => {
    expect(hoverSentence('A', 2, 0)).toBe(
      '暗号文の A(0) は、a = 2, b = 0 のとき平文の A(0)・N(13) のどちらからも来うる。1 つに決まらない',
    );
  });

  it('戻せない a: 候補が 4 つ以上なら数だけ示す', () => {
    expect(hoverSentence('A', 13, 0)).toBe('暗号文の A(0) は、a = 13, b = 0 のとき平文の 13 通りのどれからも来うる。1 つに決まらない');
  });

  it('戻せない a: どの平文からも来ない文字', () => {
    expect(hoverSentence('B', 2, 0)).toBe('暗号文の B(1) は、a = 2, b = 0 のとき、どの平文からも来ない');
  });

  it('A–Z でなければ空文字列', () => {
    expect(hoverSentence('b', 3, 0)).toBe('');
    expect(hoverSentence(' ', 3, 0)).toBe('');
  });
});
