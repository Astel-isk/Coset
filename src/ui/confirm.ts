/**
 * 「最初から」の 2 回押し（EXHIBITION.md「画面の整理」）。
 * 1 回目で「待ち受け」になり、その時刻から CONFIRM_MS 以内にもう一度押すと確定する。過ぎると 1 回目として数え直す。
 * 状態は「待ち受けにした時刻（なければ null）」だけ。時刻は呼び出し側から渡すので、偽の時計でテストできる。
 */

/** 1 回目から 2 回目までに許す時間（ミリ秒） */
export const CONFIRM_MS = 3000;

/** 待ち受けにした時刻。待ち受けでなければ null */
export type ArmedAt = number | null;

/** 押されたとき。待ち受け中（CONFIRM_MS 未満）なら確定して待ち受けを外し、そうでなければ今の時刻で待ち受けにする */
export function pressConfirm(
  armedAt: ArmedAt,
  now: number,
  ms: number = CONFIRM_MS,
): { readonly next: ArmedAt; readonly confirmed: boolean } {
  if (isArmed(armedAt, now, ms)) return { next: null, confirmed: true };
  return { next: now, confirmed: false };
}

/** 今も待ち受け中か（CONFIRM_MS が過ぎたら false。表示を元に戻す判断にも使う） */
export function isArmed(armedAt: ArmedAt, now: number, ms: number = CONFIRM_MS): boolean {
  return armedAt !== null && now - armedAt < ms;
}

/** 待ち受けが切れるまでの残り時間（待ち受けでなければ 0）。表示を戻すタイマーの長さに使う */
export function remainingMs(armedAt: ArmedAt, now: number, ms: number = CONFIRM_MS): number {
  return armedAt === null ? 0 : Math.max(0, ms - (now - armedAt));
}
