import { describe, expect, it } from 'vitest';
import { keyExpression, letterNumber, restoreSentence, subtractionText, subtractMod } from './formula';

describe('letterNumber', () => {
  it('A=0 … Z=25。A–Z でなければ -1', () => {
    expect(letterNumber('A')).toBe(0);
    expect(letterNumber('Z')).toBe(25);
    expect(letterNumber('a')).toBe(-1);
    expect(letterNumber(' ')).toBe(-1);
    expect(letterNumber('AB')).toBe(-1);
    expect(letterNumber('')).toBe(-1);
  });
});

describe('subtractMod', () => {
  it('非負ならそのまま、負なら 26 を足す', () => {
    expect(subtractMod(8, 0)).toEqual({ diff: 8, result: 8, wrapped: false });
    expect(subtractMod(8, 18)).toEqual({ diff: -10, result: 16, wrapped: true });
    expect(subtractMod(5, 5)).toEqual({ diff: 0, result: 0, wrapped: false });
    expect(subtractMod(0, 25)).toEqual({ diff: -25, result: 1, wrapped: true });
  });

  it('結果はいつも 0〜25 で、(a − b) を 26 で割った余りと一致する', () => {
    for (let a = 0; a < 26; a++) {
      for (let b = 0; b < 26; b++) {
        const { result, wrapped } = subtractMod(a, b);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(26);
        expect((result - (a - b)) % 26).toBe(0);
        expect(wrapped).toBe(a < b);
      }
    }
  });
});

describe('subtractionText', () => {
  it('負のときだけ「→ +26 =」を挟む', () => {
    expect(subtractionText(11, 6)).toBe('11 − 6 = 5');
    expect(subtractionText(2, 6)).toBe('2 − 6 = −4 → +26 = 22');
    expect(subtractionText(4, 4)).toBe('4 − 4 = 0');
  });
});

describe('keyExpression', () => {
  it('負の場合: I(8) − S(18) = −10 → +26 = 16', () => {
    expect(keyExpression('I', 'S')).toEqual({ key: 16, text: 'I(8) − S(18) = −10 → +26 = 16' });
  });

  it('非負の場合: I(8) − A(0) = 8（「→ +26 =」を挟まない）', () => {
    expect(keyExpression('I', 'A')).toEqual({ key: 8, text: 'I(8) − A(0) = 8' });
  });

  it('同じ文字どうしなら 0', () => {
    expect(keyExpression('Q', 'Q')).toEqual({ key: 0, text: 'Q(16) − Q(16) = 0' });
  });

  it('A–Z でない文字があれば null', () => {
    expect(keyExpression('', 'S')).toBeNull();
    expect(keyExpression('I', ',')).toBeNull();
  });

  it('暗号化した鍵が出る: 平文 p を鍵 k で暗号化した文字 c について、c − p = k', () => {
    for (let p = 0; p < 26; p++) {
      for (let k = 0; k < 26; k++) {
        const c = (p + k) % 26;
        const letter = (n: number) => String.fromCharCode(65 + n);
        expect(keyExpression(letter(c), letter(p))?.key).toBe(k);
      }
    }
  });
});

describe('restoreSentence', () => {
  it('ステージ 1・非負: 暗号文の L(11) は 11 − 6 = 5 で F に戻る', () => {
    expect(restoreSentence('L', 6)).toBe('暗号文の L(11) は 11 − 6 = 5 で F に戻る');
  });

  it('ステージ 1・負: 暗号文の C(2) は 2 − 6 = −4 → +26 = 22 で W に戻る', () => {
    expect(restoreSentence('C', 6)).toBe('暗号文の C(2) は 2 − 6 = −4 → +26 = 22 で W に戻る');
  });

  it('ステージ 2: 暗号文の X(23) は ② の鍵 14 で 23 − 14 = 9、J に戻る', () => {
    expect(restoreSentence('X', 14, 26, '②')).toBe('暗号文の X(23) は ② の鍵 14 で 23 − 14 = 9、J に戻る');
  });

  it('ステージ 2・負: 円盤と鍵を添えたまま、→ +26 を挟む', () => {
    expect(restoreSentence('C', 6, 26, '③')).toBe('暗号文の C(2) は ③ の鍵 6 で 2 − 6 = −4 → +26 = 22、W に戻る');
  });

  it('鍵 0 でそのまま戻る', () => {
    expect(restoreSentence('A', 0)).toBe('暗号文の A(0) は 0 − 0 = 0 で A に戻る');
  });

  it('A–Z でなければ空文字列', () => {
    expect(restoreSentence(',', 3)).toBe('');
  });
});
