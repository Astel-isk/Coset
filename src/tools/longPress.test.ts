import { describe, expect, it } from 'vitest';
import { HOLD_MS, IDLE, pressDown, pressEnd, pressHold, pressMove, SLOP_PX } from './longPress';

describe('pressDown', () => {
  it('触れると判定中になり、位置と時刻を覚える', () => {
    expect(pressDown(10, 20, 1000)).toEqual({ phase: 'pending', x: 10, y: 20, t: 1000 });
  });
});

describe('pressMove', () => {
  const down = pressDown(100, 100, 1000);

  it('規定の時間以内に規定の距離以上動いたらスクロール（円盤は回さない）', () => {
    expect(pressMove(down, 100, 100 + SLOP_PX, 1100).phase).toBe('scroll');
    expect(pressMove(down, 100 + SLOP_PX, 100, 1000 + HOLD_MS - 1).phase).toBe('scroll');
  });

  it('斜めでも、移動距離（直線距離）が規定以上ならスクロール', () => {
    expect(pressMove(down, 107.1, 107.1, 1100).phase).toBe('scroll');
    expect(pressMove(down, 106, 106, 1100).phase).toBe('pending');
  });

  it('規定の距離に満たない揺れは判定中のまま', () => {
    expect(pressMove(down, 100, 100 + SLOP_PX - 1, 1100)).toBe(down);
  });

  it('規定の時間を超えていれば、動いていてもつまんだ（タイマーの遅れの備え）', () => {
    expect(pressMove(down, 100, 150, 1000 + HOLD_MS).phase).toBe('pinched');
  });

  it('つまんだ・スクロール・待機は動いても変わらない', () => {
    for (const s of [{ phase: 'pinched' }, { phase: 'scroll' }, IDLE] as const) {
      expect(pressMove(s, 500, 500, 5000)).toBe(s);
    }
  });
});

describe('pressHold', () => {
  it('判定中ならつまむ。それ以外は変わらない', () => {
    expect(pressHold(pressDown(0, 0, 0)).phase).toBe('pinched');
    expect(pressHold({ phase: 'scroll' }).phase).toBe('scroll');
    expect(pressHold(IDLE).phase).toBe('idle');
  });
});

describe('pressEnd', () => {
  it('待機へ戻る（pointercancel のときも同じ）', () => {
    expect(pressEnd().phase).toBe('idle');
  });
});

describe('定数', () => {
  it('0.3 秒・10px', () => {
    expect(HOLD_MS).toBe(300);
    expect(SLOP_PX).toBe(10);
  });
});
