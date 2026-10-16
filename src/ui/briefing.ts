/** 例の行を 1 行ずつ出す間隔（ミリ秒）。EXHIBITION.md「ステージ前の説明」の「約 0.5 秒おき」 */
export const STEP_INTERVAL_MS = 500;
/**
 * 説明画面を開いてから、進む操作（ボタン・Enter・Space）を受け付けない時間。
 * 傍受演出を飛ばしたクリックやキーが続けて効き、読まずに通り過ぎるのを防ぐ。
 * 傍受演出の SKIP_GRACE_MS（待機画面からの二重入力を弾く 0.25 秒）より長く取っている
 */
export const ADVANCE_GRACE_MS = 600;
/** 説明画面で無操作が続いたら待機へ戻すまでの時間（PC 版だけ。解読画面と同じ 3 分） */
export const BRIEFING_IDLE_MS = 3 * 60 * 1000;

/** 説明の紙で「出す行」の数。例の行（steps 行）の後ろに、まとめの 1 行が付く */
export function lineTotal(stepCount: number): number {
  return Math.max(0, stepCount) + 1;
}

/**
 * いま出している行の数。tick は 0 から STEP_INTERVAL_MS ごとに 1 ずつ増える数。
 * animate が false（動きを減らす設定・見直しの重ね表示）なら、最初から全行を出す
 */
export function revealedLines(tick: number, total: number, animate: boolean): number {
  if (!animate) return total;
  return Math.min(total, Math.max(0, Math.floor(tick)));
}

/** 開いてから elapsedMs たった時点で、進む操作を受け付けるか */
export function canAdvance(elapsedMs: number): boolean {
  return elapsedMs >= ADVANCE_GRACE_MS;
}

/** 説明の紙の最後に置く共通の締め（全ステージ共通。EXHIBITION.md「ステージ前の説明」） */
export const BRIEFING_CLOSING = '電文は、この規則で暗号にされている。逆にたどって、元の文を探せ。';

/** 円盤の番号（1〜3）の表記。範囲外なら空文字 */
export function diskMark(disk: number): string {
  return ['①', '②', '③'][disk - 1] ?? '';
}
