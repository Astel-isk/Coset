import type { ToolMount } from '../tools/types';

/**
 * ステージ定義の型。
 *
 * ステージは「データ」として書き、画面はランナー（ui/）がこのデータから組む
 * （DESIGN.md §5「ステージ定義の形式」）。ステージごとに画面を組むコードは書かない。
 * ランナーが暗号方式を知っている状態を作らないため、方式に固有の設定はツール側（ToolMount）へ寄せる。
 *
 * 簡易版（EXHIBITION.md）では鍵が来場者ごとに実行時に決まるため、暗号文はデータに持たず、
 * 出題を作る関数（Stage.generate）を持たせる。
 */

/** ステージの識別子。ステージを追加するときはここに足す */
export type StageId = 'caesar';

/** 与件として提示する手がかり（DESIGN.md §2 の「解読の手がかり」列） */
export interface Given {
  readonly label: string;
  readonly value: string;
}

/**
 * ヒント 1 段ぶん。
 *
 * 3 段の順序と役割（手がかり → 構造の開示 → 解答の提示）は全ステージで固定（DESIGN.md §3）。
 * カードに出す名前（label）は、簡易版ではステージのデータに持たせる。
 * body には `{key}` を書ける。ランナーが Puzzle.keyLabel で置き換える。
 */
export interface Hint {
  /** カードの名前（例: 手がかり・仕組み・答え） */
  readonly label: string;
  readonly body: string;
}

/** ヒントは 3 段そろっていること。段数の逸脱を型で止める */
export type HintSet = readonly [Hint, Hint, Hint];

/** 平文を比較するときの正規化規則（DESIGN.md §3 が実装時に定めるとしていたぶん） */
export interface NormalizeRule {
  readonly ignoreCase: boolean;
  readonly ignoreWhitespace: boolean;
  /** 句読点・引用符などの記号を無視するか */
  readonly ignorePunctuation: boolean;
}

/** クリア判定。鍵ではなく平文の一致で判定する（DESIGN.md §3）。正解の平文は Puzzle が持つ */
export interface ClearCondition {
  readonly normalize: NormalizeRule;
}

/** 1 回ぶんの出題。Stage.generate が作る */
export interface Puzzle {
  /** 傍受した暗号文 */
  readonly ciphertext: string;
  /** 正解の平文 */
  readonly plaintext: string;
  /** 平文の和訳（クリア画面で見せる） */
  readonly translation: string;
  /** ヒントの `{key}` に入れる鍵の表記 */
  readonly keyLabel: string;
}

/**
 * クリア画面の「強い暗号との対比」（簡易版）。
 * 解読した側の鍵の数は、ステージ名と時計盤が返す総数（total）から画面が作るので、ここには持たない。
 */
export interface Debrief {
  /** 比較対象の暗号の名前（例: 並べ替え暗号） */
  readonly rivalName: string;
  /** 比較対象の鍵の数。桁をそのまま見せる文字列（例: 403,291,…） */
  readonly rivalKeys: string;
  /** 全部試すのにかかる時間の文（例: 1 秒に 1 億通り試しても 約 1,300 億年） */
  readonly rivalDuration: string;
  /** 締めの一言 */
  readonly closing: string;
}

export interface Stage {
  readonly id: StageId;
  /** 表示順。DESIGN.md §2 の表の番号に合わせる */
  readonly order: number;
  /** ステージ名（日本語） */
  readonly title: string;
  /** 短い世界観フレーバー（日本語） */
  readonly flavor: string;
  /** 導入解説（日本語）。そのステージで何に気づかせるか */
  readonly briefing: string;
  readonly givens: readonly Given[];
  /** 装備する可視化ツール。実体は tools/ のレジストリが解決する */
  readonly tools: readonly ToolMount[];
  readonly hints: HintSet;
  readonly clear: ClearCondition;
  readonly debrief: Debrief;
  /** 出題を作る。random は [0, 1) の一様乱数を返す関数（テストでは固定列を渡せる） */
  readonly generate: (random: () => number) => Puzzle;
}
