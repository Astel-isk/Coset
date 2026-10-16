import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIRM_MS, isArmed, pressConfirm, remainingMs } from './confirm';
import type { ArmedAt } from './confirm';

describe('pressConfirm', () => {
  it('1 回目は確定せず、その時刻で待ち受けにする', () => {
    expect(pressConfirm(null, 1000)).toEqual({ next: 1000, confirmed: false });
  });

  it('待ち受け中の 2 回目は確定して待ち受けを外す', () => {
    expect(pressConfirm(1000, 2500)).toEqual({ next: null, confirmed: true });
  });

  it('3 秒ちょうどでは切れていて、確定せず 1 回目として数え直す', () => {
    expect(pressConfirm(1000, 1000 + CONFIRM_MS)).toEqual({ next: 1000 + CONFIRM_MS, confirmed: false });
  });

  it('3 秒に 1 ミリ秒足りないうちは確定する', () => {
    expect(pressConfirm(1000, 1000 + CONFIRM_MS - 1).confirmed).toBe(true);
  });
});

describe('isArmed / remainingMs', () => {
  it('待ち受けでなければ false・残り 0', () => {
    expect(isArmed(null, 5000)).toBe(false);
    expect(remainingMs(null, 5000)).toBe(0);
  });

  it('3 秒の間は待ち受けで、残りが減っていく', () => {
    expect(isArmed(0, 0)).toBe(true);
    expect(remainingMs(0, 1000)).toBe(2000);
    expect(isArmed(0, 2999)).toBe(true);
  });

  it('3 秒たつと元に戻る（残り 0）', () => {
    expect(isArmed(0, 3000)).toBe(false);
    expect(remainingMs(0, 3000)).toBe(0);
    expect(remainingMs(0, 9000)).toBe(0);
  });
});

/** 偽の時計（Date.now）を進めながら、ボタンを押す流れを通しで確かめる */
describe('偽の時計での通し', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const press = (armedAt: ArmedAt): { armedAt: ArmedAt; confirmed: boolean } => {
    const { next, confirmed } = pressConfirm(armedAt, Date.now());
    return { armedAt: next, confirmed };
  };

  it('1 回目から 3 秒以内の 2 回目で確定する', () => {
    const first = press(null);
    expect(first.confirmed).toBe(false);
    expect(isArmed(first.armedAt, Date.now())).toBe(true);
    vi.advanceTimersByTime(2900);
    expect(isArmed(first.armedAt, Date.now())).toBe(true);
    expect(press(first.armedAt).confirmed).toBe(true);
  });

  it('3 秒たつと表示が元に戻り、そのあとの 1 回押しでは確定しない', () => {
    const first = press(null);
    vi.advanceTimersByTime(CONFIRM_MS);
    expect(isArmed(first.armedAt, Date.now())).toBe(false);
    const again = press(first.armedAt);
    expect(again.confirmed).toBe(false);
    expect(isArmed(again.armedAt, Date.now())).toBe(true);
  });

  it('確定したあとは待ち受けが外れ、次の 1 回押しはまた 1 回目になる', () => {
    const first = press(null);
    const second = press(first.armedAt);
    expect(second).toEqual({ armedAt: null, confirmed: true });
    expect(press(second.armedAt).confirmed).toBe(false);
  });
});
