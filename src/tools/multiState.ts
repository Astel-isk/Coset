/** 円盤を複数枚並べる時計盤（MultiClock.tsx）の純粋関数（描画から切り離してテストできるようにする） */

import { mod } from './clock';

export interface MultiState {
  /** 操作対象の円盤（0 起点） */
  readonly active: number;
  /** 各円盤の内周を回した目盛りの累計（剰余に畳まない。アニメーションが巻き戻らないように） */
  readonly pos: readonly number[];
  /** 各円盤で試したずらし量（剰余）。開始時の 0 は数えない（来場者が操作して止めた位置だけを数える） */
  readonly tried: readonly ReadonlySet<number>[];
}

/** 操作はすべて「操作対象の円盤」に効く。対象の切り替えは select で行う */
export type MultiAction =
  | { readonly type: 'select'; readonly dial: number }
  | { readonly type: 'move'; readonly delta: number; readonly modulus: number }
  | { readonly type: 'set'; readonly pos: number; readonly modulus: number }
  /** 鍵の計算機から。操作対象の円盤を鍵 key に合わせる（近い向きに回し、動かなくても試した鍵に 1 つ数える） */
  | { readonly type: 'align'; readonly key: number; readonly modulus: number };

/** 円盤 count 枚、すべてずらし量 0、先頭の円盤が操作対象の状態。試した鍵はまだ無い */
export function initialState(count: number): MultiState {
  return {
    active: 0,
    pos: Array.from({ length: count }, () => 0),
    tried: Array.from({ length: count }, () => new Set<number>()),
  };
}

export function reducer(state: MultiState, action: MultiAction): MultiState {
  if (action.type === 'select') {
    if (action.dial === state.active || action.dial < 0 || action.dial >= state.pos.length) return state;
    return { ...state, active: action.dial };
  }
  const current = state.pos[state.active] ?? 0;
  const next = nextPos(current, action);
  const moved = next !== current;
  // 動かない操作は何も変えない。ただし計算機の「合わせる」は、すでにその鍵にいても、まだ試していなければ数える
  if (!moved && action.type !== 'align') return state;
  const k = mod(next, action.modulus);
  const triedHere = state.tried[state.active] ?? new Set<number>();
  if (!moved && triedHere.has(k)) return state;
  return {
    ...state,
    pos: state.pos.map((p, i) => (i === state.active ? next : p)),
    tried: state.tried.map((t, i) => (i === state.active && !triedHere.has(k) ? new Set(t).add(k) : t)),
  };
}

/** 操作 action を受けた後の、操作対象の円盤の累計の目盛り */
function nextPos(current: number, action: Exclude<MultiAction, { type: 'select' }>): number {
  switch (action.type) {
    case 'move':
      return current + action.delta;
    case 'set':
      return action.pos;
    case 'align': {
      // 差を (-modulus/2, modulus/2] に畳み、近い向きに回す
      const d = mod(action.key - current, action.modulus);
      return current + (d > action.modulus / 2 ? d - action.modulus : d);
    }
  }
}

/** 各円盤の今のずらし量（鍵）。0 以上 modulus 未満 */
export function currentKeys(state: MultiState, modulus: number): readonly number[] {
  return state.pos.map((p) => mod(p, modulus));
}

/** 全円盤で試した鍵の数の合計 */
export function totalTried(state: MultiState): number {
  return state.tried.reduce((sum, t) => sum + t.size, 0);
}

const CODE_A = 'A'.charCodeAt(0);

function isLetter(ch: string, modulus: number): boolean {
  const code = ch.charCodeAt(0);
  return ch.length === 1 && code >= CODE_A && code < CODE_A + modulus;
}

/**
 * 語ごとに、各文字を受け持つ円盤の番号（0 起点）を返す。A–Z 以外の文字は null。
 * 円盤は A–Z の文字だけで順に回し（n 番目の文字は n mod count 番の円盤）、語をまたいで続ける。
 * 空白は語の区切りとして取り除かれているので、空白で円盤は進まない。
 */
export function ownersOfWords(
  words: readonly string[],
  count: number,
  modulus = 26,
): readonly (readonly (number | null)[])[] {
  let n = 0;
  return words.map((word) =>
    word.split('').map((ch) => {
      if (!isLetter(ch, modulus)) return null;
      const owner = n % count;
      n += 1;
      return owner;
    }),
  );
}
