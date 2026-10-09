import type { ComponentType } from 'react';

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
  | { readonly id: 'modular-clock'; readonly modulus: number };

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
  /** プレイヤーの操作で候補平文が変わったときに呼ぶ */
  readonly onCandidate: (plaintext: string) => void;
  /**
   * 試した鍵の数が変わったときに呼ぶ（tried: これまでに試した鍵の種類数、total: 鍵の総数）。
   * クリア画面の「26 通りのうち n 通り試して破った」に使う（EXHIBITION.md）。
   */
  readonly onAttempts: (tried: number, total: number) => void;
}

/** ID からツールの実体を引くレジストリ。全 ToolId を埋めないと型検査が通らない */
export type ToolRegistry = { readonly [K in ToolId]: ComponentType<ToolProps<K>> };
