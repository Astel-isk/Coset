/**
 * 式を見せるための純粋関数（描画から切り離してテストできるようにする）。
 * 鍵の計算機（KeyCalculator.tsx）と、電文の文字に重ねたときの 1 行（ModularClock.tsx・MultiClock.tsx）が使う。
 * 文字の番号は A=0, B=1, …, Z=25。引き算は mod modulus で行い、負になったときだけ「+ modulus」を挟んで見せる。
 */

import { ALPHABET, mod } from './clock';

/** 引き算の結果。diff は mod を取る前の値、result は 0 以上 modulus 未満の値 */
export interface Subtraction {
  readonly diff: number;
  readonly result: number;
  /** diff が負で、modulus を足して戻したか */
  readonly wrapped: boolean;
}

/** a − b を mod modulus で求める。a・b は 0 以上 modulus 未満の整数を想定する */
export function subtractMod(a: number, b: number, modulus = 26): Subtraction {
  const diff = a - b;
  return { diff, result: mod(diff, modulus), wrapped: diff < 0 };
}

/** 文字の番号（A=0）。A–Z（modulus 個の範囲）でなければ -1 */
export function letterNumber(letter: string, modulus = 26): number {
  const i = letter.length === 1 ? ALPHABET.indexOf(letter) : -1;
  return i >= 0 && i < modulus ? i : -1;
}

/** 負の数の表記。引き算の記号と区別できるよう、U+2212 の「−」を使う */
function signed(n: number): string {
  return n < 0 ? `−${-n}` : String(n);
}

/**
 * 引き算の式の文字列。非負なら「8 − 0 = 8」、負なら「2 − 6 = −4 → +26 = 22」。
 * 右辺は常に最後が mod を取った結果になる。
 */
export function subtractionText(a: number, b: number, modulus = 26): string {
  return `${a} − ${b} = ${subtractionResult(a, b, modulus)}`;
}

/** 式の「=」の右側。非負なら「8」、負なら「−10 → +26 = 16」 */
function subtractionResult(a: number, b: number, modulus: number): string {
  const { diff, result, wrapped } = subtractMod(a, b, modulus);
  return wrapped ? `${signed(diff)} → +${modulus} = ${result}` : String(diff);
}

/** 鍵の計算機の結果。key は暗号文の文字 − 平文の文字（mod）、text は画面に出す式 */
export interface KeyExpression {
  readonly key: number;
  readonly text: string;
}

/**
 * 暗号文の文字から平文の文字を引いて鍵を出す（暗号文 − 平文 = 鍵）。
 * 例: 「I(8) − S(18) = −10 → +26 = 16」「I(8) − A(0) = 8」。A–Z でない文字があれば null。
 * どの文字どうしを組にするかは判断しない（来場者が選んだ 2 文字を引くだけ）。
 */
export function keyExpression(cipherLetter: string, plainLetter: string, modulus = 26): KeyExpression | null {
  const c = letterNumber(cipherLetter, modulus);
  const p = letterNumber(plainLetter, modulus);
  if (c < 0 || p < 0) return null;
  return {
    key: subtractMod(c, p, modulus).result,
    text: `${cipherLetter}(${c}) − ${plainLetter}(${p}) = ${subtractionResult(c, p, modulus)}`,
  };
}

/**
 * 電文の文字に重ねたときの 1 行。暗号文の文字 letter が、鍵 k のとき何に戻るかを式で示す。
 * dialLabel を渡すと（ステージ 2）、どの円盤の鍵かを添える。
 *
 * - ステージ 1: 「暗号文の L(11) は 11 − 6 = 5 で F に戻る」
 *   負になるとき: 「暗号文の C(2) は 2 − 6 = −4 → +26 = 22 で W に戻る」
 * - ステージ 2: 「暗号文の X(23) は ② の鍵 14 で 23 − 14 = 9、J に戻る」
 *
 * letter が A–Z でなければ空文字列。
 */
export function restoreSentence(letter: string, k: number, modulus = 26, dialLabel?: string): string {
  const c = letterNumber(letter, modulus);
  if (c < 0) return '';
  const plain = ALPHABET[subtractMod(c, k, modulus).result] ?? '';
  const calc = subtractionText(c, k, modulus);
  return dialLabel === undefined
    ? `暗号文の ${letter}(${c}) は ${calc} で ${plain} に戻る`
    : `暗号文の ${letter}(${c}) は ${dialLabel} の鍵 ${k} で ${calc}、${plain} に戻る`;
}
