/**
 * 対応表（円盤を切り開いて伸ばしたもの）と「電文の文字に重ねると光る」の純粋関数。
 * 描画から切り離してテストできるようにする（MappingStrip.tsx・ModularClock.tsx・MultiClock.tsx が使う）。
 */

import { ALPHABET, mod } from './clock';

/** 対応表の 1 列。暗号文の文字 cipher の内側に来る平文の文字 plain */
export interface MappingColumn {
  readonly cipher: string;
  readonly plain: string;
}

/**
 * 鍵 k のときの対応表の 26（modulus）列。上の行（暗号文）は A から固定、
 * 下の行（平文）は A−k から始まる。列 i は暗号文 A+i、平文 A+i−k。
 */
export function mappingColumns(k: number, modulus = 26): readonly MappingColumn[] {
  const letters = ALPHABET.slice(0, modulus);
  return letters.split('').map((cipher, i) => ({ cipher, plain: letters[mod(i - k, modulus)] ?? '' }));
}

/** 電文の語ごとに、各文字を受け持つ円盤の番号（A–Z 以外は null）。ownersOfWords と同じ形 */
export type Owners = readonly (readonly (number | null)[])[];

/**
 * 電文に出てくる暗号文の文字の集合。dial を渡すと、その円盤が受け持つ位置の文字だけを数える
 * （ステージ 2 は操作対象の円盤について 1 本の表を出すため）。
 */
export function usedCipherLetters(words: readonly string[], owners: Owners, dial: number): ReadonlySet<string> {
  const used = new Set<string>();
  words.forEach((word, w) => {
    word.split('').forEach((ch, i) => {
      if (owners[w]?.[i] === dial) used.add(ch);
    });
  });
  return used;
}

/** 重ねている電文の文字の位置（語の番号と、語の中の添字）。強調の状態はこれだけを持つ */
export interface CellPos {
  readonly word: number;
  readonly index: number;
}

/** 強調の対象。暗号文の文字と、それを受け持つ円盤の番号（ステージ 1 は 0） */
export interface HoverTarget {
  readonly letter: string;
  readonly owner: number;
}

/** 位置から強調の対象を求める。位置が無効、または文字が A–Z でない（受け持つ円盤がない）なら null */
export function hoverTarget(words: readonly string[], owners: Owners, pos: CellPos | null): HoverTarget | null {
  if (!pos) return null;
  const letter = words[pos.word]?.[pos.index];
  const owner = owners[pos.word]?.[pos.index];
  if (letter === undefined || owner === undefined || owner === null) return null;
  return { letter, owner };
}

/**
 * 電文の文字をタップしたあとの強調の位置（スマホ版。マウスを重ねる代わり）。
 * いま光っている文字（同じ暗号文の文字かつ同じ円盤）をもう一度タップしたら消す。別の文字なら光らせ直す。
 * 空白・記号のタップは消す。
 */
export function tapCell(
  words: readonly string[],
  owners: Owners,
  current: CellPos | null,
  tapped: CellPos,
): CellPos | null {
  const next = hoverTarget(words, owners, tapped);
  if (!next) return null;
  const now = hoverTarget(words, owners, current);
  return now !== null && now.letter === next.letter && now.owner === next.owner ? null : tapped;
}

/**
 * 強調する出現の位置。同じ暗号文の文字で、かつ同じ円盤が受け持つ位置だけを true にする
 * （上段・下段・番号行は同じ位置で光らせるので、位置の表は 1 つ）。target が null なら全部 false。
 */
export function highlightedCells(
  words: readonly string[],
  owners: Owners,
  target: HoverTarget | null,
): readonly (readonly boolean[])[] {
  return words.map((word, w) =>
    word.split('').map((ch, i) => target !== null && ch === target.letter && owners[w]?.[i] === target.owner),
  );
}

/** 26 列の表をスマホ版で 13 列 × 2 段に折り返すための分割。start は各段の先頭の列の番号 */
export function halves<T>(items: readonly T[]): readonly { readonly start: number; readonly items: readonly T[] }[] {
  const half = Math.ceil(items.length / 2);
  return [
    { start: 0, items: items.slice(0, half) },
    { start: half, items: items.slice(half) },
  ];
}

/** 暗号文の文字 letter が、鍵 k のとき内側のどの文字に戻るか（外周の X の内側にある X−k） */
export function plainLetterOf(letter: string, k: number, modulus = 26): string {
  const i = ALPHABET.indexOf(letter);
  return i < 0 || i >= modulus ? '' : (ALPHABET[mod(i - k, modulus)] ?? '');
}

/** 暗号文の文字 letter の、外周での添字（外周は A から時計回り）。A–Z でなければ -1 */
export function outerIndexOf(letter: string, modulus = 26): number {
  const i = ALPHABET.indexOf(letter);
  return i >= 0 && i < modulus ? i : -1;
}

/**
 * 内周の文字のうち、外周の添字 outer と同じ角度にあるものの添字。
 * 内周を steps 目盛り（剰余に畳まない値でよい）回したとき、外周の A+outer の内側には A+outer−steps が来る。
 */
export function innerIndexAt(outer: number, steps: number, modulus = 26): number {
  return mod(outer - steps, modulus);
}
