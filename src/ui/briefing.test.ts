import { describe, expect, it } from 'vitest';
import { ADVANCE_GRACE_MS, canAdvance, diskMark, lineTotal, revealedLines, STEP_INTERVAL_MS } from './briefing';
import { SKIP_GRACE_MS } from './intercept';

describe('lineTotal', () => {
  it('例の行にまとめの 1 行を足した数', () => {
    expect(lineTotal(4)).toBe(5);
    expect(lineTotal(0)).toBe(1);
  });
});

describe('revealedLines', () => {
  it('動かすときは tick の数だけ出し、全行を超えない', () => {
    expect(revealedLines(0, 5, true)).toBe(0);
    expect(revealedLines(3, 5, true)).toBe(3);
    expect(revealedLines(99, 5, true)).toBe(5);
  });

  it('負の tick は 0 行', () => {
    expect(revealedLines(-2, 5, true)).toBe(0);
  });

  it('動かさないときは最初から全行', () => {
    expect(revealedLines(0, 5, false)).toBe(5);
  });
});

describe('canAdvance', () => {
  it('開いてから 0.6 秒は受け付けず、0.6 秒たてば受け付ける', () => {
    expect(ADVANCE_GRACE_MS).toBe(600);
    expect(canAdvance(0)).toBe(false);
    expect(canAdvance(599)).toBe(false);
    expect(canAdvance(600)).toBe(true);
  });

  it('傍受演出の猶予より長い（演出を飛ばした操作が続けて効かない）', () => {
    expect(ADVANCE_GRACE_MS).toBeGreaterThan(SKIP_GRACE_MS);
  });

  it('行の出現間隔は約 0.5 秒', () => {
    expect(STEP_INTERVAL_MS).toBe(500);
  });
});

describe('diskMark', () => {
  it('円盤の番号 1〜3 を ①②③ に直し、範囲外は空文字', () => {
    expect([1, 2, 3].map(diskMark)).toEqual(['①', '②', '③']);
    expect(diskMark(0)).toBe('');
    expect(diskMark(4)).toBe('');
  });
});
