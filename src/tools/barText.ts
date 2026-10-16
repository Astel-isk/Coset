/**
 * 「戻した文の帯」（スマホ版。EXHIBITION.md「スマホ版」）の純粋関数。描画から切り離してテストできるようにする。
 * 正解を知らない。今の鍵で戻した文をそのまま並べ直すだけで、判定はしない。
 */

/** 帯に出す文の一続きの部分。dim の部分は薄く描く */
export interface BarSegment {
  readonly text: string;
  readonly dim: boolean;
}

/**
 * 戻した文（語の並び）を、帯に出す部分に分ける。語は半角の空白でつなぐ。
 *
 * owners は電文と同じ語ごと・文字ごとの「受け持つ円盤の番号」（ステージ 2。`ownersOfWords` の結果）。渡したときは、
 * 操作中の円盤（active）が受け持つ文字を濃く、他（受け持ちが null の文字を含む）を薄くする（電文の `own`／`dim` と同じ規則）。
 * 語のあいだの空白は直前の文字と同じ濃さにして、不要に部分を割らない。owners を渡さないとき（ステージ 1・3）は全体を 1 つの濃い部分にする。
 */
export function barSegments(
  words: readonly string[],
  owners?: readonly (readonly (number | null)[])[],
  active = 0,
): readonly BarSegment[] {
  const out: { text: string; dim: boolean }[] = [];
  const push = (text: string, dim: boolean) => {
    const last = out[out.length - 1];
    if (last && last.dim === dim) last.text += text;
    else out.push({ text, dim });
  };
  words.forEach((word, i) => {
    if (i > 0) push(' ', out[out.length - 1]?.dim ?? false);
    const wordOwners = owners?.[i];
    word.split('').forEach((ch, j) => {
      const dim = wordOwners !== undefined && wordOwners[j] !== active;
      push(ch, dim);
    });
  });
  return out;
}

/**
 * 帯を出すか。電文の紙が画面に見えている間は出さず、上へ流れて見えなくなったら出す。
 * intersecting: 紙が画面と重なっているか、top: 紙の上端の画面上の位置（負なら画面の上へ出ている）。
 * 紙が画面の下にあるとき（まだ上のほうを見ているとき）は出さない。
 */
export function barVisible(intersecting: boolean, top: number): boolean {
  return !intersecting && top < 0;
}
