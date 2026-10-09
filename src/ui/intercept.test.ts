import { describe, expect, it } from 'vitest';
import { TYPING_MAX_INTERVAL_MS, TYPING_TOTAL_MS, typingDuration, typingInterval } from './intercept';

describe('typingInterval', () => {
  it('文字数が多いときは全体が TYPING_TOTAL_MS に収まるよう間隔を詰める', () => {
    for (const length of [20, 40, 53, 58, 100, 200]) {
      expect(typingDuration(length)).toBeLessThanOrEqual(TYPING_TOTAL_MS);
    }
    expect(typingInterval(60)).toBe(30);
  });

  it('文字数が少ないときは間隔の上限で頭打ちにする', () => {
    expect(typingInterval(5)).toBe(TYPING_MAX_INTERVAL_MS);
    expect(typingInterval(0)).toBe(TYPING_MAX_INTERVAL_MS);
  });

  it('間隔は常に 1 ミリ秒以上の整数', () => {
    for (const length of [1, 10, 1800, 5000]) {
      const interval = typingInterval(length);
      expect(Number.isInteger(interval)).toBe(true);
      expect(interval).toBeGreaterThanOrEqual(1);
    }
  });

  it('展示の電文の長さ（40〜60 文字）では 2 秒を超えない', () => {
    expect(typingDuration(40)).toBeLessThanOrEqual(2000);
    expect(typingDuration(60)).toBeLessThanOrEqual(2000);
  });
});
