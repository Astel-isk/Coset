import { describe, expect, it } from 'vitest';
import type { NormalizeRule } from '../stages/types';
import { fillPlaceholders, foldedHintLabel, hintState, isCorrect, normalizeText } from './logic';

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

describe('fillPlaceholders', () => {
  it('{名前} をすべて、同じ名前の値に置き換える', () => {
    expect(fillPlaceholders('鍵は {key}。円盤を {key} に合わせる', { key: '17' })).toBe(
      '鍵は 17。円盤を 17 に合わせる',
    );
  });

  it('複数の名前を一度に置き換える', () => {
    expect(fillPlaceholders('①={k1}、②={k2}、③={k3}', { k1: '3', k2: '17', k3: '9' })).toBe('①=3、②=17、③=9');
  });

  it('{名前} が無い本文はそのまま', () => {
    expect(fillPlaceholders('鍵の候補は何通りある?', { key: '17' })).toBe('鍵の候補は何通りある?');
  });

  it('値に $ が含まれても文字どおりに入る', () => {
    expect(fillPlaceholders('{key}', { key: '$&' })).toBe('$&');
  });

  it('値に無い名前はそのまま残す', () => {
    expect(fillPlaceholders('{key} と {other}', { key: '1' })).toBe('1 と {other}');
  });

  it('クリア画面の総数も同じ仕組みで入る', () => {
    expect(fillPlaceholders('分ければ {total} 通りのうち', { total: '78' })).toBe('分ければ 78 通りのうち');
  });
});

describe('hintState', () => {
  it('開いた枚数より前は opened、次の 1 枚が ready、それ以降は locked', () => {
    expect([0, 1, 2].map((i) => hintState(i, 0))).toEqual(['ready', 'locked', 'locked']);
    expect([0, 1, 2].map((i) => hintState(i, 1))).toEqual(['opened', 'ready', 'locked']);
    expect([0, 1, 2].map((i) => hintState(i, 3))).toEqual(['opened', 'opened', 'opened']);
  });
});

describe('foldedHintLabel', () => {
  it('開けるものは「▸」付き、まだ開けないものは理由付きの 1 行にする', () => {
    expect(foldedHintLabel('手がかり', 'ready')).toBe('ヒント: 手がかり ▸');
    expect(foldedHintLabel('答え', 'locked')).toBe('ヒント: 答え（前を開くと読める）');
  });
});
