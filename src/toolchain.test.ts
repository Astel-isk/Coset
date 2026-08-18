import { describe, expect, it } from 'vitest';

// 雛形が動くことだけを確かめる煙テスト。
// core/ に最初のテストが入った時点で削除してよい。
describe('toolchain', () => {
  it('Vitest と TypeScript が動く', () => {
    const xs: readonly number[] = [1, 2, 3];
    expect(xs.reduce((a, b) => a + b, 0)).toBe(6);
  });
});
