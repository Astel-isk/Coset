import { describe, expect, it } from 'vitest';
import {
  affineAlignButtonLabel,
  affineAlignedMessage,
  alignButtonLabel,
  alignedMessage,
  columnPair,
  currentStep,
  pickableColumns,
  toggleColumn,
} from './calcSteps';
import { affineKeyExpression, keyExpression } from './formula';
import { ownersOfWords } from './multiState';

describe('currentStep', () => {
  it('列が未選択なら手順 1、選択済みなら手順 3（2 は式の行）', () => {
    expect(currentStep(false)).toBe(1);
    expect(currentStep(true)).toBe(3);
  });
});

describe('columnPair', () => {
  it('最初の単語の col 列目の暗号文の文字と手がかりの文字を組にする', () => {
    expect(columnPair('IXKQ', 'SOME', 0)).toEqual({ cipher: 'I', plain: 'S' });
    expect(columnPair('IXKQ', 'SOME', 3)).toEqual({ cipher: 'Q', plain: 'E' });
  });

  it('範囲外の列・語がない・A–Z でない文字は null', () => {
    expect(columnPair('IXKQ', 'SOME', 4)).toBeNull();
    expect(columnPair('IXKQ', 'SOME', -1)).toBeNull();
    expect(columnPair(undefined, 'SOME', 0)).toBeNull();
    expect(columnPair('I,KQ', 'SOME', 1)).toBeNull();
    expect(columnPair('IXKQ', 'SO-E', 2)).toBeNull();
  });

  it('組から作った式は、仕様の例の値になる（ステージ 2「I(8) − S(18) = −10 → +26 = 16」）', () => {
    const pair = columnPair('I', 'S', 0);
    expect(pair).not.toBeNull();
    const expr = pair && keyExpression(pair.cipher, pair.plain);
    expect(expr?.key).toBe(16);
    expect(expr?.text).toBe('I(8) − S(18) = −10 → +26 = 16');
  });

  it('組から作った式は、ステージ 3 の例の値になる（b = B(1) − 3 × S(18) → 25）', () => {
    const pair = columnPair('B', 'S', 0);
    const expr = pair && affineKeyExpression(pair.cipher, pair.plain, 3);
    expect(expr?.b).toBe(25);
    expect(expr?.text).toBe('b = B(1) − 3 × S(18) = 1 − 54 = −53 → 26 で割った余り 25');
  });
});

describe('pickableColumns', () => {
  it('最初の単語の全列が選べる（手がかりは同じ長さ）', () => {
    expect(pickableColumns('IXKQ', 'SOME')).toEqual([true, true, true, true]);
  });

  it('組が作れない列は選べない。語がなければ空', () => {
    expect(pickableColumns('I,KQ', 'SOME')).toEqual([true, false, true, true]);
    expect(pickableColumns(undefined, 'SOME')).toEqual([]);
  });
});

describe('列を受け持つ円盤（ステージ 2）', () => {
  it('最初の単語の列 i は (i mod 3) 番の円盤が受け持つので、ボタンの円盤番号と一致する', () => {
    const owners = ownersOfWords(['KAISEKIHAN', 'NI'], 3);
    expect(owners[0]).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2, 0]);
  });
});

describe('toggleColumn', () => {
  it('別の列を押すとその列、同じ列をもう一度押すと解除', () => {
    expect(toggleColumn(null, 2)).toBe(2);
    expect(toggleColumn(2, 4)).toBe(4);
    expect(toggleColumn(4, 4)).toBeNull();
  });
});

describe('文言', () => {
  it('ステージ 2 のボタンと押したあとの 1 行（仕様の文面）', () => {
    expect(alignButtonLabel('②', 16)).toBe('この列は ② の円盤 → ② を 16 に合わせる');
    expect(alignedMessage('②', 16)).toBe('② を 16 に合わせた。その列の戻した文が手がかりと同じ文字になった');
  });

  it('ステージ 3 のボタンと押したあとの 1 行', () => {
    expect(affineAlignButtonLabel(15)).toBe('b を 15 に合わせる');
    expect(affineAlignedMessage(15)).toContain('b を 15 に合わせた');
  });
});
