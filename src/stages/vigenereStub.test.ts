import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './vigenereStub';

describe('vigenereStub（仮実装）', () => {
  it('既知の例: ATTACKATDAWN を鍵 LEMON（11,4,12,14,13）で暗号化すると LXFOPVEFRNHR', () => {
    expect(encrypt('ATTACKATDAWN', [11, 4, 12, 14, 13])).toBe('LXFOPVEFRNHR');
    expect(decrypt('LXFOPVEFRNHR', [11, 4, 12, 14, 13])).toBe('ATTACKATDAWN');
  });

  it('鍵 1 つなら シーザー暗号と同じ', () => {
    expect(encrypt('HELLO', [3])).toBe('KHOOR');
    expect(decrypt('KHOOR', [3])).toBe('HELLO');
  });

  it('1・4・7…文字目は鍵 1、2・5・8…文字目は鍵 2、3・6・9…文字目は鍵 3 でずれる', () => {
    expect(encrypt('AAAAAAAAA', [1, 2, 3])).toBe('BCDBCDBCD');
  });

  it('鍵の位置は文字だけで進み、空白は飛ばしてそのまま残る', () => {
    expect(encrypt('AA AAA A', [1, 2, 3])).toBe('BC DBC D');
    // 空白で鍵が進むなら 3 文字目の鍵がずれてしまう
    expect(encrypt('AA A', [1, 2, 3])).toBe('BC D');
  });

  it('A–Z 以外の文字（空白・小文字・記号・かな）はそのままで、鍵も進まない', () => {
    expect(encrypt('A, b! あ A', [1, 2])).toBe('B, b! あ C');
  });

  it('Z は A に回り込む', () => {
    expect(encrypt('ZZZ', [1, 2, 3])).toBe('ABC');
    expect(decrypt('ABC', [1, 2, 3])).toBe('ZZZ');
  });

  it('どの鍵の組でも復号は暗号化の逆になる', () => {
    const text = 'HIMITSU NO KAIGI WA RAISHUU NO GETSUYOUBI NI HIRAKU';
    for (let k1 = 0; k1 < 26; k1 += 5) {
      for (let k2 = 0; k2 < 26; k2 += 7) {
        for (let k3 = 0; k3 < 26; k3 += 11) {
          expect(decrypt(encrypt(text, [k1, k2, k3]), [k1, k2, k3])).toBe(text);
        }
      }
    }
  });

  it('負の鍵や 26 以上の鍵も剰余で扱う', () => {
    expect(encrypt('ABC', [26, -1, 27])).toBe(encrypt('ABC', [0, 25, 1]));
  });

  it('鍵が空なら例外', () => {
    expect(() => encrypt('A', [])).toThrow(RangeError);
  });
});
