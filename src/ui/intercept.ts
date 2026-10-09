/** 暗号文の打ち出し全体に使ってよい時間（ミリ秒）。EXHIBITION.md「傍受演出」の 2 秒以内に余裕を持たせた値 */
export const TYPING_TOTAL_MS = 1800;
/** 1 文字あたりの間隔の上限。文字数が少ないときに間延びさせない */
export const TYPING_MAX_INTERVAL_MS = 90;
/** 「受信完了」を出してから解読画面へ切り替えるまでの時間 */
export const DONE_HOLD_MS = 600;
/** 動きを減らす設定のとき、全文を出してから切り替えるまでの時間 */
export const REDUCED_HOLD_MS = 800;
/** 演出の開始直後は飛ばす操作を受け付けない時間。待機画面のクリック・Enter の二重入力を弾く */
export const SKIP_GRACE_MS = 250;

/** 暗号文の長さから、1 文字あたりの打ち出し間隔（ミリ秒）を決める。全体が TYPING_TOTAL_MS に収まる */
export function typingInterval(length: number): number {
  if (length <= 0) return TYPING_MAX_INTERVAL_MS;
  return Math.max(1, Math.min(TYPING_MAX_INTERVAL_MS, Math.floor(TYPING_TOTAL_MS / length)));
}

/** 打ち出しにかかる全体の時間 */
export function typingDuration(length: number): number {
  return typingInterval(length) * Math.max(0, length);
}
