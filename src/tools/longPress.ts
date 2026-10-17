/**
 * 円盤を「長押しでつまむ」判定（スマホ版のタッチ操作。EXHIBITION.md「スマホ版」）。
 * 円盤が画面の幅いっぱいにあるので、触れてすぐ回すと、スクロールしようとした指で円盤が回ってしまう。
 * そこで、触れてから HOLD_MS 以内に SLOP_PX 以上動いたらページのスクロール、動かさずに HOLD_MS 押し続けたらつまむ（以後は指の動きで回す）。
 * 状態の遷移だけを持つ純粋関数で、タイマーやイベントはつなぐ側（useGripGate）が持つ。
 */

/** 動かさずに押し続けると「つまむ」までの時間（ミリ秒） */
export const HOLD_MS = 300;
/** この距離（px）以上動いたら、HOLD_MS 以内ならスクロールとみなす */
export const SLOP_PX = 10;

/**
 * 待機（触れていない）→ 判定中（触れた。つまむかスクロールかまだ決まらない）→ つまんだ / スクロール。
 * つまんだ・スクロールは、指を離す（または pointercancel）まで変わらない。
 */
export type PressState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'pending'; readonly x: number; readonly y: number; readonly t: number }
  | { readonly phase: 'pinched' }
  | { readonly phase: 'scroll' };

export const IDLE: PressState = { phase: 'idle' };

/** 触れた。位置 (x, y) と時刻 now（ミリ秒）から判定を始める */
export function pressDown(x: number, y: number, now: number): PressState {
  return { phase: 'pending', x, y, t: now };
}

/** 指が動いた。判定中のときだけ状態が変わる */
export function pressMove(state: PressState, x: number, y: number, now: number): PressState {
  if (state.phase !== 'pending') return state;
  // 規定の時間を超えて押していたなら、動いていてもつまんだとみなす（タイマーが遅れた場合の備え）
  if (now - state.t >= HOLD_MS) return { phase: 'pinched' };
  if (Math.hypot(x - state.x, y - state.y) >= SLOP_PX) return { phase: 'scroll' };
  return state;
}

/** 規定の時間がたった。判定中ならつまむ */
export function pressHold(state: PressState): PressState {
  return state.phase === 'pending' ? { phase: 'pinched' } : state;
}

/** 指を離した・pointercancel が来た。判定を捨てて待機へ戻す */
export function pressEnd(): PressState {
  return IDLE;
}
