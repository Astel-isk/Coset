import { describe, expect, it } from 'vitest';
import { affineReducer, initialAffineState } from './affineState';
import type { AffineAction, AffineState } from './affineState';

const M = 26;

function run(actions: readonly AffineAction[], from: AffineState = initialAffineState()): AffineState {
  return actions.reduce(affineReducer, from);
}
const setA = (a: number): AffineAction => ({ type: 'setA', a, modulus: M });
const moveB = (delta: number): AffineAction => ({ type: 'moveB', delta, modulus: M });
const setB = (b: number): AffineAction => ({ type: 'setB', b, modulus: M });

describe('affineReducer', () => {
  it('開始時は a=1, b=0 で、試した鍵は無い', () => {
    const s = initialAffineState();
    expect([s.a, s.b, s.tried.size]).toEqual([1, 0, 0]);
  });

  it('a を選ぶと a が変わり、(a, b) の組が試した鍵に 1 つ数えられる', () => {
    const s = run([setA(3)]);
    expect([s.a, s.b, s.tried.size]).toEqual([3, 0, 1]);
  });

  it('b を ← → で動かすと 1 つずつ数えられ、0 と 25 の間で循環する', () => {
    expect(run([moveB(-1)]).b).toBe(25);
    expect(run([setB(25), moveB(1)]).b).toBe(0);
    expect(run([moveB(1), moveB(1), moveB(1)]).tried.size).toBe(3);
  });

  it('同じ組に戻って止まっても、数は増えない（集合）', () => {
    const s = run([moveB(1), moveB(-1), moveB(1)]);
    expect(s.tried.size).toBe(2); // (1,1) と (1,0)
  });

  it('開始時の (1, 0) は数えないが、動かして戻って止まったら数える', () => {
    expect(run([moveB(1), moveB(-1)]).tried.size).toBe(2);
  });

  it('26 と互いに素でない a の組は数えない（a=2 や 13）', () => {
    const s = run([setA(2), moveB(1), moveB(1), setA(13), moveB(1)]);
    expect([s.a, s.b, s.tried.size]).toEqual([13, 3, 0]);
  });

  it('偶数の a を通り過ぎて、互いに素な a に止まったときだけ数える', () => {
    const s = run([setA(2), setA(3)]);
    expect(s.tried.size).toBe(1);
  });

  it('動かない操作（同じ a を選ぶ）は何も変えない', () => {
    const s = run([setA(3)]);
    expect(affineReducer(s, setA(3))).toBe(s);
    expect(affineReducer(s, moveB(0))).toBe(s);
    expect(affineReducer(s, moveB(26))).toBe(s);
  });

  it('範囲外の a は無視する', () => {
    const s = initialAffineState();
    expect(affineReducer(s, setA(0))).toBe(s);
    expect(affineReducer(s, setA(26))).toBe(s);
  });

  it('計算機の「b を合わせる」は、動かなくても、まだ試していなければ数える', () => {
    const s0 = run([setA(3)]); // (3, 0) を数え済み
    expect(affineReducer(s0, setB(0))).toBe(s0); // すでに試した組なので変わらない
    const s2 = run([setA(5)]); // (5, 0)
    const s3 = affineReducer(s2, setB(7));
    expect([s3.b, s3.tried.size]).toEqual([7, 2]);
    // 開始時の (1, 0) にいて、合わせた b も 0 なら、動かなくても 1 つ数える
    const s4 = affineReducer(initialAffineState(), setB(0));
    expect([s4.a, s4.b, s4.tried.size]).toEqual([1, 0, 1]);
  });

  it('a が戻せない数のとき、b を合わせても数えない', () => {
    const s = run([setA(2), setB(11)]);
    expect([s.a, s.b, s.tried.size]).toEqual([2, 11, 0]);
  });

  it('試した鍵の上限は 12 × 26 = 312（総数を超えない）', () => {
    const actions: AffineAction[] = [];
    for (let a = 1; a < 26; a++) {
      actions.push(setA(a));
      for (let i = 0; i < 26; i++) actions.push(moveB(1));
    }
    expect(run(actions).tried.size).toBe(312);
  });
});
