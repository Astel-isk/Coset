import type { ComponentType, ReactNode } from 'react';
import type { Given } from '../stages/types';

/**
 * 可視化ツールの型。
 *
 * ステージ定義（stages/）はツールを ID で参照し、実体はレジストリで解決する。
 * ステージ定義がツールの実装に依存しない状態を保つため（DESIGN.md §5「ステージ定義の形式」）。
 */

/**
 * ステージがツールを装備するときの指定。ツールごとに必要な設定を持つ。
 * ツールを追加するときはこのユニオンに 1 行足す。レジストリ側の漏れは型検査で出る。
 */
export type ToolMount =
  /** モジュラー時計盤。mod modulus の目盛りを回す（DESIGN.md §4） */
  | { readonly id: 'modular-clock'; readonly modulus: number }
  /**
   * 円盤を count 枚並べた時計盤（ヴィジュネル暗号。鍵が count 文字）。1 枚が 1 文字ぶんの鍵を受け持つ。
   * 各円盤は mod modulus。onAttempts の tried は 3 枚の合計、total は modulus × count
   */
  | { readonly id: 'multi-clock'; readonly modulus: number; readonly count: number }
  /**
   * アフィン表（アフィン暗号。円盤は使わない）。鍵は a と b の 2 つ。暗号文 = (a × 平文の番号 + b) を modulus で割った余り。
   * onAttempts の tried は、来場者が止めた (a, b) の組のうち a が modulus と互いに素なものの数、total は 12 × modulus
   */
  | { readonly id: 'affine-table'; readonly modulus: number };

export type ToolId = ToolMount['id'];

/** ID からその装備指定を引く */
type MountOf<K extends ToolId> = Extract<ToolMount, { id: K }>;

/**
 * ツールに渡るもの。
 *
 * ツールは暗号文と装備の設定を受け取り、プレイヤーの操作の結果を「候補平文」として返す。
 * クリア判定はランナーが行う（DESIGN.md §3）ため、ツールは正解を知らない。
 * 答えに近づく情報はヒント側に集約する（DESIGN.md §4）ので、ツールに正解を渡す口を作らない。
 */
export interface ToolProps<K extends ToolId> {
  readonly mount: MountOf<K>;
  readonly ciphertext: string;
  /** 電文の紙に出す見出し（例: 電文 ・ 傍受 22:14 ・ 発信元 不明）。傍受時刻は出題ごとに変わるのでランナーから渡す */
  readonly heading: string;
  /**
   * 与件（Puzzle.givens とステージ共通の与件を並べたもの）。画面に出す公開情報で、正解の平文全体は含まない。
   * ツールは必要な与件を `id` で引く（例: 鍵の計算機は 'first-word' の値を手がかりの文字として並べる）
   */
  readonly givens: readonly Given[];
  /** プレイヤーの操作で候補平文が変わったときに呼ぶ */
  readonly onCandidate: (plaintext: string) => void;
  /**
   * 試した鍵の数が変わったときに呼ぶ（tried: これまでに試した鍵の種類数、total: 鍵の総数）。
   * クリア画面の「26 通りのうち n 通りで破った」に使う（EXHIBITION.md）。
   * 開始時のずらし量 0 は数えない（来場者が操作して止めた位置だけを数える）。
   */
  readonly onAttempts: (tried: number, total: number) => void;
  /**
   * 主ボタン（「これで解読」）と不正解の表示の差し込み口。ランナーが中身を作って渡し、ツールが電文の紙の直後に置く
   * （電文の位置を知っているのはツールだけで、ランナーは位置を知らずに済む。EXHIBITION.md「画面の整理」）。
   * 判定はランナーが行うので、ツールは中身に触れず、そのまま描くだけ
   */
  readonly actions: ReactNode;
}

/** ID からツールの実体を引くレジストリ。全 ToolId を埋めないと型検査が通らない */
export type ToolRegistry = { readonly [K in ToolId]: ComponentType<ToolProps<K>> };
