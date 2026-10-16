import { describe, expect, it } from 'vitest';
import { barSegments, barVisible } from './barText';

describe('barSegments', () => {
  it('owners を渡さないと全体が 1 つの濃い部分になる（語は空白でつなぐ）', () => {
    expect(barSegments(['HELLO', 'WORLD'])).toEqual([{ text: 'HELLO WORLD', dim: false }]);
  });

  it('「?」を含む文もそのまま出す', () => {
    expect(barSegments(['A?C', 'D'])).toEqual([{ text: 'A?C D', dim: false }]);
  });

  it('操作中の円盤が受け持つ文字を濃く、他を薄くする', () => {
    // 3 枚が順に受け持つ（0, 1, 2, 0, 1）。操作中は 1 番目（0）
    const segs = barSegments(['ABCDE'], [[0, 1, 2, 0, 1]], 0);
    expect(segs).toEqual([
      { text: 'A', dim: false },
      { text: 'BC', dim: true },
      { text: 'D', dim: false },
      { text: 'E', dim: true },
    ]);
  });

  it('操作中の円盤を変えると濃淡が入れ替わる', () => {
    const segs = barSegments(['ABCDE'], [[0, 1, 2, 0, 1]], 1);
    expect(segs.filter((s) => !s.dim).map((s) => s.text)).toEqual(['B', 'E']);
  });

  it('語のあいだの空白は直前の文字と同じ濃さで、部分を割らない', () => {
    const segs = barSegments(['AB', 'CD'], [[0, 1], [0, 1]], 1);
    expect(segs).toEqual([
      { text: 'A', dim: true },
      { text: 'B ', dim: false },
      { text: 'C', dim: true },
      { text: 'D', dim: false },
    ]);
    // 空白を含めても文字列は元の文に一致する
    expect(segs.map((s) => s.text).join('')).toBe('AB CD');
  });

  it('受け持ちが null の文字は薄い', () => {
    expect(barSegments(['A-B'], [[0, null, 0]], 0)).toEqual([
      { text: 'A', dim: false },
      { text: '-', dim: true },
      { text: 'B', dim: false },
    ]);
  });

  it('語が空なら空の列になる', () => {
    expect(barSegments([])).toEqual([]);
  });
});

describe('barVisible', () => {
  it('紙が画面に見えている間は出さない', () => {
    expect(barVisible(true, -50)).toBe(false);
    expect(barVisible(true, 120)).toBe(false);
  });

  it('紙が上へ流れて見えなくなったら出す', () => {
    expect(barVisible(false, -400)).toBe(true);
  });

  it('紙が画面の下にあるときは出さない', () => {
    expect(barVisible(false, 900)).toBe(false);
  });
});
