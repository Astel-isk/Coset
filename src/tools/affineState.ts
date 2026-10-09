/** アフィン表のツール（AffineTable.tsx）の純粋関数（描画から切り離してテストできるようにする） */

import { mod } from './clock';
import { isInvertible } from './affine';

export interface AffineState {
  /** 今の a（1〜modulus−1。26 と互いに素でない数も選べる） */
  readonly a: number;
  /** 今の b（0〜modulus−1） */
  readonly b: number;
  /**
   * 試した鍵。来場者が止めた (a, b) の組のうち、a が modulus と互いに素なものだけを `a * modulus + b` で持つ。
   * 開始時の (a, b) は数えない（来場者が操作して止めた組だけを数える）
   */
  readonly tried: ReadonlySet<number>;
}

export type AffineAction =
  | { readonly type: 'setA'; readonly a: number; readonly modulus: number }
  | { readonly type: 'moveB'; readonly delta: number; readonly modulus: number }
  /** 鍵の計算機から。b をその値に合わせる（動かなくても、まだ試していなければ試した鍵に数える） */
  | { readonly type: 'setB'; readonly b: number; readonly modulus: number };

/** 開始時は a = 1、b = 0（暗号化しないのと同じ組）。試した鍵はまだ無い */
export function initialAffineState(): AffineState {
  return { a: 1, b: 0, tried: new Set<number>() };
}

export function affineReducer(state: AffineState, action: AffineAction): AffineState {
  const { modulus } = action;
  let a = state.a;
  let b = state.b;
  switch (action.type) {
    case 'setA':
      if (action.a < 1 || action.a >= modulus) return state;
      a = action.a;
      break;
    case 'moveB':
      b = mod(state.b + action.delta, modulus);
      break;
    case 'setB':
      b = mod(action.b, modulus);
      break;
  }
  const moved = a !== state.a || b !== state.b;
  // 動かない操作は何も変えない。ただし計算機の「合わせる」は、すでにその b にいても、まだ試していなければ数える
  if (!moved && action.type !== 'setB') return state;
  const id = a * modulus + b;
  const count = isInvertible(a, modulus) && !state.tried.has(id);
  if (!moved && !count) return state;
  return { a, b, tried: count ? new Set(state.tried).add(id) : state.tried };
}
