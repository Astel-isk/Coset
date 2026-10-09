import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, gcd, modInverse } from './affineStub';

const COPRIME = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

describe('gcd', () => {
  it('既知の値', () => {
    expect(gcd(12, 26)).toBe(2);
    expect(gcd(13, 26)).toBe(13);
    expect(gcd(7, 26)).toBe(1);
    expect(gcd(0, 26)).toBe(26);
    expect(gcd(26, 0)).toBe(26);
  });
});

describe('modInverse', () => {
  it('3 の逆元は 9（3 × 9 = 27 は 26 で割ると 1 余る）', () => {
    expect(modInverse(3)).toBe(9);
  });

  it('26 と互いに素な数には逆元があり、掛けると 1 になる', () => {
    for (const a of COPRIME) {
      const inv = modInverse(a);
      expect(inv).not.toBeNull();
      expect((a * (inv ?? 0)) % 26).toBe(1);
    }
  });

  it('26 と互いに素でない数（偶数と 13）には逆元がない', () => {
    for (const a of [2, 4, 6, 8, 10, 12, 13, 14, 16, 18, 20, 22, 24]) {
      expect(modInverse(a)).toBeNull();
    }
  });

  it('負の数や 26 以上の数も剰余で扱う', () => {
    expect(modInverse(29)).toBe(9);
    expect(modInverse(-23)).toBe(9);
  });
});

describe('encrypt / decrypt（仮実装）', () => {
  it('既知の例: AFFINE CIPHER を a=5, b=8 で暗号化すると IHHWVC SWFRCP', () => {
    expect(encrypt('AFFINE CIPHER', 5, 8)).toBe('IHHWVC SWFRCP');
    expect(decrypt('IHHWVC SWFRCP', 5, 8)).toBe('AFFINE CIPHER');
  });

  it('a=1 はシーザー暗号と同じ', () => {
    expect(encrypt('HELLO', 1, 3)).toBe('KHOOR');
  });

  it('26 と互いに素な a と任意の b で、復号すると元に戻る', () => {
    const text = 'KONYA NO KAIGOU WA TORIYAME DA';
    for (const a of COPRIME) {
      for (let b = 0; b < 26; b++) {
        expect(decrypt(encrypt(text, a, b), a, b)).toBe(text);
      }
    }
  });

  it('空白など A–Z 以外はそのまま残り、文字数も変わらない', () => {
    expect(encrypt('A B', 3, 25)).toBe('Z C');
    expect(encrypt('A  B', 3, 0)).toContain('  ');
  });

  it('a が 26 と互いに素でなければ復号は RangeError。暗号化はできる', () => {
    expect(() => decrypt('ABC', 2, 0)).toThrow(RangeError);
    expect(() => decrypt('ABC', 13, 5)).toThrow(RangeError);
    expect(encrypt('AN', 2, 0)).toBe('AA');
  });
});
