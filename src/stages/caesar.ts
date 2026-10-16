import { randomInt } from '../random';
import { encrypt } from './caesarStub';
import type { NoteSet, Puzzle, Stage } from './types';

/**
 * アルファベットと番号の対応表（カード 1 の図）。A〜M と N〜Z の 2 段に分け、文字の下に番号を置く。
 * 1 セルは 3 文字幅の右寄せで、文字は番号の 1 の位に揃う。
 */
export function alphabetTable(): readonly string[] {
  const cells = (from: number, to: number, f: (i: number) => string) =>
    Array.from({ length: to - from }, (_, j) => f(from + j).padStart(3)).join('');
  const letter = (i: number) => String.fromCharCode('A'.charCodeAt(0) + i);
  return [
    cells(0, 13, letter),
    cells(0, 13, String),
    '',
    cells(13, 26, letter),
    cells(13, 26, String),
  ];
}

/** 「もっと知る」のカード 4 枚。文面は EXHIBITION.md「もっと知る」 */
const NOTES: NoteSet = [
  {
    title: '文字を数に直す',
    body:
      'A=0, B=1, …, Z=25 と番号を付けると、シーザー暗号は「番号に鍵を足す」だけの計算になる。'
      + 'Z を越えたら A に戻る。',
    figure: alphabetTable(),
  },
  {
    title: '時計の算数',
    body:
      '23 時の 5 時間後は 28 時ではなく 4 時。24 で割った余りだけを見る数え方を mod 24 と呼ぶ。'
      + 'シーザー暗号は 26 文字の時計で、（番号 + 鍵）を 26 で割った余りが暗号文の文字になる。'
      + '余りが同じ数をひとまとめにしたものを剰余類（英語で coset。このゲームの名前の由来）という。',
  },
  {
    title: '歴史',
    body:
      'ローマの将軍カエサルは、文字を 3 つずらす暗号で手紙を書いたと伝えられている'
      + '（スエトニウス『ローマ皇帝伝』）。この暗号の名前はそこから来ている。',
  },
  {
    title: 'この先',
    body:
      '鍵の数を増やすと、総当たりはすぐに効かなくなる。そこで武器になるのが代数の道具だ。'
      + '次のステージでは、鍵が 3 文字の暗号に挑む。',
  },
];


/** 出題の候補（10 文）。平文はローマ字（簡易版の暫定判断。EXHIBITION.md「出題」「追加の内容」） */
export const MESSAGES: readonly { readonly plaintext: string; readonly translation: string }[] = [
  {
    plaintext: 'ASHITA NO YORU HACHIJI NI KYUUKOUSHA NO URA DE MATSU',
    translation: '明日の夜八時に旧校舎の裏で待つ',
  },
  {
    plaintext: 'ANGOUSHO WA TOSHOSHITSU NO ICHIBAN UE NO TANA NI KAKUSHITA',
    translation: '暗号書は図書室のいちばん上の棚に隠した',
  },
  {
    plaintext: 'KONO TSUUSHIN WO YONDARA SUGU NI MOYASHITE KURE',
    translation: 'この通信を読んだらすぐに燃やしてくれ',
  },
  {
    plaintext: 'KAGI WA KOUTEI NO SAKURA NO KI NO SHITA NI UMETA',
    translation: '鍵は校庭の桜の木の下に埋めた',
  },
  {
    plaintext: 'TSUGI NO RENRAKU WA KINYOUBI NO HOUKAGO NI SURU',
    translation: '次の連絡は金曜日の放課後にする',
  },
  {
    plaintext: 'AIKOTOBA WA YAMA TO KAWA DA',
    translation: '合言葉は山と川だ',
  },
  {
    plaintext: 'KEIKAKU WA JUNCHOU DA SONO MAMA SUSUME',
    translation: '計画は順調だ。そのまま進め',
  },
  {
    plaintext: 'SHOKUDOU NO MADO GA AITARA AIZU DA',
    translation: '食堂の窓が開いたら合図だ',
  },
  {
    plaintext: 'TEKI NI KIZUKARETA BASHO WO KAERU',
    translation: '敵に気づかれた。場所を変える',
  },
  {
    plaintext: 'TACHIBANASAI NO HI NI SUBETE WO AKIRAKA NI SURU',
    translation: '立花祭の日にすべてを明らかにする',
  },
];

/** 鍵の最小値と最大値。0 は暗号化しないことになるので除く */
const KEY_MIN = 1;
const KEY_MAX = 25;

/**
 * ステージ 1: シーザー暗号。
 *
 * 教訓は「鍵空間が小さいから破れる」に置く（DESIGN.md §2「統計的手法の扱い」）。
 * 鍵は出題のたびに 1〜25 から一様に選ぶ。
 */
export const caesarStage: Stage = {
  id: 'caesar',
  order: 1,
  title: 'シーザー暗号',
  flavor: '傍受した通信。文字が一定の規則でずれているらしい。円盤を回して、読める文を探せ。',
  briefing: {
    rule: 'すべての文字を、アルファベット順に同じ数だけずらす。Z の次は A に戻る。ずらす量が鍵',
    exampleTitle: '例: 鍵 13 で NEKO を暗号にする（A=0, B=1, …, Z=25 の番号で計算する）',
    steps: [
      { plain: 'N(13)', formula: '13 + 13 = 26 → −26 = 0', cipher: 'A' },
      { plain: 'E(4)', formula: '4 + 13 = 17', cipher: 'R' },
      { plain: 'K(10)', formula: '10 + 13 = 23', cipher: 'X' },
      { plain: 'O(14)', formula: '14 + 13 = 27 → −26 = 1', cipher: 'B' },
    ],
    summary: 'NEKO → ARXB',
  },
  givens: [],
  tools: [{ id: 'modular-clock', modulus: 26 }],
  hints: [
    { label: '手がかり', body: '鍵の候補は何通りある? 全部試せる数だろうか' },
    {
      label: '仕組み',
      body:
        '文字を A=0, B=1, …, Z=25 の数に直し、鍵の数だけ足して 26 で割った余りをとる暗号。'
        + '鍵はずらし量ひとつだけ',
    },
    { label: '答え', body: '鍵は {key}。円盤を {key} に合わせて「これで解読」を押す' },
  ],
  clear: {
    normalize: { ignoreCase: true, ignoreWhitespace: true, ignorePunctuation: true },
  },
  debrief: {
    lead: '{total} 通りのうち',
    countSuffix: '通りで破った',
    rows: [
      { label: 'シーザー暗号の鍵', value: '{total}', unit: '通り' },
      {
        label: '並べ替え暗号の鍵',
        // 26! を桁のまま見せる（指数表記にしない。EXHIBITION.md「クリア画面」）
        value: '403,291,461,126,605,635,584,000,000',
        unit: '通り',
        note: '1 秒に 1 億通り試しても 約 1,300 億年',
      },
    ],
    closing: 'だから暗号には、もっと賢い仕組み（代数）が要る',
  },
  notes: NOTES,
  generate(random: () => number): Puzzle {
    const key = KEY_MIN + randomInt(random, KEY_MAX - KEY_MIN + 1);
    // 候補は 1 件以上あるので、undefined にはならない。noUncheckedIndexedAccess のため先頭で受ける
    const message = MESSAGES[randomInt(random, MESSAGES.length)] ?? MESSAGES[0];
    if (!message) throw new Error('出題の候補が空');
    return {
      ciphertext: encrypt(message.plaintext, key),
      plaintext: message.plaintext,
      translation: message.translation,
      givens: [],
      hintValues: { key: String(key) },
    };
  },
};
