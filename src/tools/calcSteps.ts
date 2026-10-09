/**
 * 鍵の計算機（ステージ 2・3）の手順と文言の純粋関数（描画から切り離してテストできるようにする）。
 * 来場者は電文の最初の単語の列を 1 回クリックするだけで、暗号文の文字と手がかりの文字（平文）の組が計算機に入る。
 * 手がかり（与件 'first-word'）は公開情報で、ここは正解の平文全体を知らない。
 */

import { letterNumber } from './formula';

/** 手順の番号。1 = 列をクリック、2 = 式（結果の表示）、3 = ボタン */
export type CalcStep = 1 | 2 | 3;

/**
 * 今の手順（朱にする番号）。列が未選択なら 1、選択済みなら 3。
 * 2 は式の行で、選んだ瞬間に出るので「今の手順」にはならない。
 */
export function currentStep(selected: boolean): CalcStep {
  return selected ? 3 : 1;
}

/** 列から作った文字の組。cipher は暗号文の文字、plain は手がかりの文字（その列の平文） */
export interface ColumnPair {
  readonly cipher: string;
  readonly plain: string;
}

/**
 * 最初の単語の col 列目から、暗号文の文字と手がかりの文字の組を作る。
 * 最初の単語の暗号文と手がかりの単語は同じ長さ（手がかりは電文の最初の単語そのもの）。
 * どちらかが A〜Z（modulus 個の範囲）でない、または範囲外の列なら null。
 */
export function columnPair(
  firstCipherWord: string | undefined,
  hintWord: string,
  col: number,
  modulus = 26,
): ColumnPair | null {
  const cipher = firstCipherWord?.[col];
  const plain = hintWord[col];
  if (cipher === undefined || plain === undefined) return null;
  if (letterNumber(cipher, modulus) < 0 || letterNumber(plain, modulus) < 0) return null;
  return { cipher, plain };
}

/** 最初の単語の各列が、クリックして計算機に入れられる列か（手がかりがあり、組が作れる列） */
export function pickableColumns(
  firstCipherWord: string | undefined,
  hintWord: string,
  modulus = 26,
): readonly boolean[] {
  return Array.from(firstCipherWord ?? '', (_, col) => columnPair(firstCipherWord, hintWord, col, modulus) !== null);
}

/** 列のクリック。選択済みの列をもう一度押したら解除する */
export function toggleColumn(selected: number | null, clicked: number): number | null {
  return selected === clicked ? null : clicked;
}

/** ステージ 2 の手順 3 のボタン（列を選んだとき）。例: 「この列は ② の円盤 → ② を 16 に合わせる」 */
export function alignButtonLabel(dialLabel: string, key: number): string {
  return `この列は ${dialLabel} の円盤 → ${dialLabel} を ${key} に合わせる`;
}

/** ステージ 2 のボタンを押したあとの 1 行 */
export function alignedMessage(dialLabel: string, key: number): string {
  return `${dialLabel} を ${key} に合わせた。その列の戻した文が手がかりと同じ文字になった`;
}

/** ステージ 3 の手順 3 のボタン（列を選んだとき）。今の a のまま b を合わせる */
export function affineAlignButtonLabel(b: number): string {
  return `b を ${b} に合わせる`;
}

/** ステージ 3 のボタンを押したあとの 1 行。b は今の a が合っているときだけ正しい */
export function affineAlignedMessage(b: number): string {
  return `b を ${b} に合わせた。a が合っていれば、その列の戻した文が手がかりと同じ文字になる`;
}

/**
 * 電文の最初の単語の列のクリック設定（行の描画に渡す）。
 * 手がかりのある列（pickable）だけがクリックでき、選んだ列（selected）は朱の塗り、
 * マウスが乗った列（hovered）は薄い地で示す。最初の単語以外の行には渡さない。
 */
export interface ColumnPick {
  readonly pickable: readonly boolean[];
  readonly selected: number | null;
  readonly hovered: number | null;
  readonly onPick: (col: number) => void;
}

/** 列 col の cell に付けるクラス（クリックできる列・選んだ列・マウスが乗った列） */
export function columnClasses(pick: ColumnPick | undefined, col: number): string {
  if (!pick || !pick.pickable[col]) return '';
  return ` pick${pick.selected === col ? ' sel' : ''}${pick.hovered === col ? ' colhov' : ''}`;
}
