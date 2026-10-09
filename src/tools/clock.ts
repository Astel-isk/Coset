/** 時計盤まわりの純粋関数（描画から切り離してテストできるようにする） */

/** 外周に並べる文字。目盛りの数（modulus）だけ先頭から使う */
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** 正の剰余 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** 暗号文の 1 語と、同じ位置の戻した文の 1 語 */
export interface WordPair {
  readonly cipher: string;
  readonly restored: string;
}

/**
 * 暗号文と戻した文を、空白区切りの語ごとに対にする。
 * 復号は文字数と空白の位置を変えないので、語は添字で対応する。
 */
export function pairWords(cipher: string, restored: string): readonly WordPair[] {
  const restoredWords = restored.split(/\s+/).filter((w) => w !== '');
  return cipher
    .split(/\s+/)
    .filter((w) => w !== '')
    .map((w, i) => ({ cipher: w, restored: restoredWords[i] ?? '' }));
}

/** 角度の差を (-180, 180] に畳む。ドラッグで 0°/360° をまたいでも回転量が飛ばないようにする */
export function normalizeAngleDelta(deg: number): number {
  const d = mod(deg, 360);
  return d > 180 ? d - 360 : d;
}
