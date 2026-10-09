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
export type StageId = 'caesar' | 'vigenere' | 'affine';

/**
 * 与件として提示する手がかり（DESIGN.md §2 の「解読の手がかり」列）。
 * 画面には「label value suffix」の順に並べる（例: 「最初の単語は HIMITSU らしい」）。
 * 出題ごとに変わる与件（最初の単語など）は Puzzle.givens が持つ。
 */
export interface Given {
  /**
   * 与件の識別子（任意）。ツールが特定の与件を名前で引くときに使う
   * （ステージ 2 の最初の単語は 'first-word'。鍵の計算機が手がかりの文字として並べる）
   */
  readonly id?: string;
  readonly label: string;
  readonly value: string;
  /** value の後ろに添える語（例: らしい） */
  readonly suffix?: string;
}

/**
 * ヒント 1 段ぶん。
 *
 * 3 段の順序と役割（手がかり → 構造の開示 → 解答の提示）は全ステージで固定（DESIGN.md §3）。
 * カードに出す名前（label）は、簡易版ではステージのデータに持たせる。
 * body には `{名前}` の形で差し込み位置を書ける（例: `{key}`、`{k1}`）。
 * ランナーが Puzzle.hintValues の同じ名前の値で置き換える。
 */
export interface Hint {
  /** カードの名前（例: 手がかり・仕組み・答え） */
  readonly label: string;
  readonly body: string;
}

/** ヒントは 3 段そろっていること。段数の逸脱を型で止める */
export type HintSet = readonly [Hint, Hint, Hint];

/**
 * 「もっと知る」の解説カード 1 枚（簡易版）。式は KaTeX を使わず文章で書く。
 * figure は等幅で表示する行の配列（表や図）。なければ本文だけを出す。
 */
export interface NoteCard {
  readonly title: string;
  readonly body: string;
  readonly figure?: readonly string[];
}

/** 解説カードは 4 枚そろっていること */
export type NoteSet = readonly [NoteCard, NoteCard, NoteCard, NoteCard];

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
  /** 出題ごとの与件（例: 鍵の長さ、最初の単語）。なければ空配列 */
  readonly givens: readonly Given[];
  /**
   * ヒント本文の `{名前}` に入れる値（その回の鍵の表記など）。
   * 例: シーザー暗号は `{ key: '17' }`、ヴィジュネル暗号は `{ k1: '3', k2: '17', k3: '9' }`
   */
  readonly hintValues: Readonly<Record<string, string>>;
}

/** クリア画面の対比の 1 行（例: 並べ替え暗号の鍵 403,… 通り） */
export interface DebriefRow {
  /** 行の名前（例: 並べ替え暗号の鍵） */
  readonly label: string;
  /** 鍵の数。桁をそのまま見せる文字列（例: 403,291,…）。`{total}` を書ける */
  readonly value: string;
  /** value の単位（例: 通り）。長い数が折り返しても単位だけが次の行へ落ちないよう、分けて持つ */
  readonly unit: string;
  /** 補足の文（例: 1 秒に 1 億通り試しても 約 1,300 億年）。なければ出さない */
  readonly note?: string;
}

/**
 * クリア画面の「n 通りで破った」と対比（簡易版）。
 * 文中の `{total}` は、ツールが返す鍵の総数（ステージ 1 は 26、ステージ 2 は 78、ステージ 3 は 312）に画面が置き換える。
 */
export interface Debrief {
  /** 大きな数字（試した鍵の数 n）の上に出す文（例: `{total} 通りのうち`、`あなたが試した鍵`） */
  readonly lead: string;
  /** 大きな数字の後ろに添える語（例: `通りで破った`、`通り`） */
  readonly countSuffix: string;
  /** 対比の行。上から順に並べる */
  readonly rows: readonly DebriefRow[];
  /** 締めの一言 */
  readonly closing: string;
}

/**
 * 前のステージのクリア画面から、このステージへ進むときの文言（簡易版）。
 * ランナーが方式やステージの順を知らなくても、「最後の暗号」のような言い回しをデータで変えられるようにする。
 */
export interface Arrival {
  /** 前のステージのクリア画面の主ボタン（例: 次の暗号に挑む、最後の暗号に挑む） */
  readonly challengeLabel: string;
  /** 傍受演出の見出しの状態表示（例: 新たな電文を傍受、最後の電文を傍受） */
  readonly interceptHeadline: string;
}

export interface Stage {
  readonly id: StageId;
  /** 表示順。DESIGN.md §2 の表の番号に合わせる */
  readonly order: number;
  /** ステージ名（日本語） */
  readonly title: string;
  /** このステージへ進むときの文言。最初のステージは前がないので持たない。なければランナーの既定の文言を使う */
  readonly arrival?: Arrival;
  /** 短い世界観フレーバー（日本語） */
  readonly flavor: string;
  /** 導入解説（日本語）。そのステージで何に気づかせるか */
  readonly briefing: string;
  /** ステージ共通の与件。出題ごとに変わるものは Puzzle.givens に持たせる */
  readonly givens: readonly Given[];
  /** 装備する可視化ツール。実体は tools/ のレジストリが解決する */
  readonly tools: readonly ToolMount[];
  readonly hints: HintSet;
  readonly clear: ClearCondition;
  readonly debrief: Debrief;
  /** クリア画面の「もっと知る」で開く解説カード */
  readonly notes: NoteSet;
  /** 出題を作る。random は [0, 1) の一様乱数を返す関数（テストでは固定列を渡せる） */
  readonly generate: (random: () => number) => Puzzle;
}
