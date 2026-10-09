import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './caesarStub';

describe('caesarStub（仮実装）', () => {
  it('既知の例: HELLO を 3 ずらすと KHOOR', () => {
    expect(encrypt('HELLO', 3)).toBe('KHOOR');
  });

  it('Z は A に回り込む', () => {
    expect(encrypt('XYZ', 3)).toBe('ABC');
    expect(decrypt('ABC', 3)).toBe('XYZ');
  });

  it('A–Z 以外の文字（空白・小文字・記号・かな）はそのまま', () => {
    expect(encrypt('A B, c! あ', 1)).toBe('B C, c! あ');
  });

  it('どの鍵でも復号は暗号化の逆になる', () => {
    const text = 'ASHITA NO YORU HACHIJI NI KYUUKOUSHA NO URA DE MATSU';
    for (let key = 0; key < 26; key++) {
      expect(decrypt(encrypt(text, key), key)).toBe(text);
    }
  });

  it('負の鍵や 26 以上の鍵も剰余で扱う', () => {
    expect(encrypt('ABC', 26)).toBe('ABC');
    expect(encrypt('ABC', -1)).toBe('ZAB');
    expect(encrypt('ABC', 27)).toBe(encrypt('ABC', 1));
  });
});
