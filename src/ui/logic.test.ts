import { describe, expect, it } from 'vitest';
import type { NormalizeRule } from '../stages/types';
import { fillHint, isCorrect, normalizeText } from './logic';

const RULE: NormalizeRule = { ignoreCase: true, ignoreWhitespace: true, ignorePunctuation: true };

describe('normalizeText', () => {
  it('大文字小文字・空白・記号を規則どおりに落とす', () => {
    expect(normalizeText('Ko no,  TSUU shin!', RULE)).toBe('konotsuushin');
  });

  it('規則が無効なら該当する差を残す', () => {
    const keep: NormalizeRule = { ignoreCase: false, ignoreWhitespace: false, ignorePunctuation: false };
    expect(normalizeText('A b,', keep)).toBe('A b,');
  });
});

describe('isCorrect', () => {
  const plaintext = 'KONO TSUUSHIN WO YONDARA SUGU NI MOYASHITE KURE';

  it('大文字小文字と空白の違いは無視して一致とみなす', () => {
    expect(isCorrect('kono tsuushin wo yondara sugu ni moyashite kure', plaintext, RULE)).toBe(true);
    expect(isCorrect('  KONOTSUUSHIN WO YONDARA SUGU NI MOYASHITE KURE ', plaintext, RULE)).toBe(true);
  });

  it('1 文字でも違えば不一致', () => {
    expect(isCorrect('KONO TSUUSHIN WO YONDARA SUGU NI MOYASHITE KURA', plaintext, RULE)).toBe(false);
  });

  it('暗号文のままや空文字は不一致', () => {
    expect(isCorrect('LPOP UTVVTIJO XP', plaintext, RULE)).toBe(false);
    expect(isCorrect('', plaintext, RULE)).toBe(false);
  });
});

describe('fillHint', () => {
  it('{key} をすべて鍵の表記に置き換える', () => {
    expect(fillHint('鍵は {key}。円盤を {key} に合わせる', '17')).toBe('鍵は 17。円盤を 17 に合わせる');
  });

  it('{key} が無い本文はそのまま', () => {
    expect(fillHint('鍵の候補は何通りある?', '17')).toBe('鍵の候補は何通りある?');
  });

  it('鍵の表記に $ が含まれても文字どおりに入る', () => {
    expect(fillHint('{key}', '$&')).toBe('$&');
  });
});
