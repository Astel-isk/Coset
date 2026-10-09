import { describe, expect, it } from 'vitest';
import { randomInt } from './random';

describe('randomInt', () => {
  it('[0, n) の整数を返し、乱数が 1 に達しても範囲外に出ない', () => {
    expect(randomInt(() => 0, 5)).toBe(0);
    expect(randomInt(() => 0.5, 4)).toBe(2);
    expect(randomInt(() => 0.999999999, 5)).toBe(4);
    expect(randomInt(() => 1, 5)).toBe(4);
  });
});
