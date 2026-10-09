import { randomInt } from '../random';
import type { Given, NoteSet, Puzzle, Stage } from './types';
import { encrypt } from './vigenereStub'; // core/ciphers/vigenere.ts の実装後にここを差し替える

/** 鍵の長さ（円盤の枚数）。ツールの装備指定（count）と同じ値 */
export const KEY_LENGTH = 3;

/** 鍵の最小値と最大値。0 はその円盤が暗号化しないことになるので除く */
const KEY_MIN = 1;
const KEY_MAX = 25;

/** 「もっと知る」のカード 4 枚。文面は EXHIBITION.md「もっと知る」 */
const NOTES: NoteSet = [
  {
    title: '3 枚に分ける',
    body:
      '鍵が 3 文字のとき、1・4・7…文字目は ①、2・5・8…文字目は ②、3・6・9…文字目は ③ の円盤だけで決まる。'
      + '3 枚は互いに影響しないので、1 枚ずつシーザー暗号として解ける。'
      + 'まとめて試すと 26×26×26 = 17,576 通りでも、分ければ 26+26+26 = 78 通り。',
  },
  {
    title: '数学では',
    body:
      'mod 26 の時計を 3 つ並べたものを、数学では直積と呼ぶ。'
      + '大きな問題を独立な小さな問題の組に分ける考え方は、暗号を破るときにも作るときにも中心になる。',
  },
  {
    title: '歴史',
    body:
      '16 世紀に広まったこの暗号は、長く「解読不能の暗号」と呼ばれた。'
      + '1863 年にカシスキーが鍵の長さを割り出す方法を発表し、破られた。',
  },
  {
    title: '本物の暗号は',
    body:
      '現代の暗号（RSA など）は、分けても総当たりしても現実的な時間では破れないように、'
      + '整数の性質を使って作られている。',
  },
];

/** 出題の候補（10 文）。平文はローマ字。最初の単語は与件として見せるので 3 文字以上（EXHIBITION.md「追加の内容」） */
export const MESSAGES: readonly { readonly plaintext: string; readonly translation: string }[] = [
  {
    plaintext: 'HIMITSU NO KAIGI WA RAISHUU NO GETSUYOUBI NI HIRAKU',
    translation: '秘密の会議は来週の月曜日に開く',
  },
  {
    plaintext: 'KAISEKIHAN NI TSUGU KONO ANGOU WA YABURARETA',
    translation: '解析班に告ぐ。この暗号は破られた',
  },
  {
    plaintext: 'TAKARA NO CHIZU WA BIJUTSUSHITSU NO GAKU NO URA NI ARU',
    translation: '宝の地図は美術室の額の裏にある',
  },
  {
    plaintext: 'SHIREI WO KAKUNIN SHITA YOAKE MAE NI SHUPPATSU SURU',
    translation: '指令を確認した。夜明け前に出発する',
  },
  {
    plaintext: 'KYOU NO KAIGI WA CHUUSHI NI NATTA',
    translation: '今日の会議は中止になった',
  },
  {
    plaintext: 'DENWA WA TOUCHOU SARETE IRU TEGAMI DE RENRAKU SEYO',
    translation: '電話は盗聴されている。手紙で連絡せよ',
  },
  {
    plaintext: 'SANBANME NO ROKKAA NI HOUKOKUSHO WO IRETE OKU',
    translation: '三番目のロッカーに報告書を入れておく',
  },
  {
    plaintext: 'YAKUSOKU NO BASHO WA EKIMAE NO KISSATEN DA',
    translation: '約束の場所は駅前の喫茶店だ',
  },
  {
    plaintext: 'ODORIBA NO TOKEI GA JUUNIJI WO SASHITARA UGOKE',
    translation: '踊り場の時計が十二時を指したら動け',
  },
  {
    plaintext: 'SAIGO NO DENBUN DA KIMI NARA KANARAZU TOKERU',
    translation: '最後の電文だ。君なら必ず解ける',
  },
];

/** 平文の最初の単語（空白の手前まで） */
export function firstWord(plaintext: string): string {
  return plaintext.split(' ')[0] ?? '';
}

/**
 * ステージ 2: ヴィジュネル暗号（簡易版）。
 *
 * 教訓は「鍵が 3 文字になり、まとめて試すと 17,576 通りに増えても、1 枚ずつ分ければ 78 通りで破れる」。
 * 鍵は円盤ごとに 1〜25 から一様に選ぶ。
 */
export const vigenereStage: Stage = {
  id: 'vigenere',
  order: 2,
  title: 'ヴィジュネル暗号',
  arrival: { challengeLabel: '次の暗号に挑む', interceptHeadline: '新たな電文を傍受' },
  flavor: '新たに傍受した電文。鍵が 3 文字に増えた。円盤は 3 枚。1 枚ずつ合わせて、読める文を探せ。',
  briefing:
    'この暗号は、文字ごとに違う量をずらす方式。鍵は 3 文字で、1・4・7…文字目は 1 枚目、'
    + '2・5・8…文字目は 2 枚目、3・6・9…文字目は 3 枚目の円盤だけで決まる。'
    + '3 枚は互いに影響しないので、1 枚ずつ破れる。',
  givens: [],
  tools: [{ id: 'multi-clock', modulus: 26, count: KEY_LENGTH }],
  hints: [
    { label: '手がかり', body: '鍵は 3 文字。電文の文字は 3 つおきに同じ円盤で戻る' },
    {
      label: '仕組み',
      body:
        '暗号文 − 平文 = 鍵（26 で割った余り）。最初の単語の 1 文字目で引き算すれば ① の鍵が出る。'
        + '鍵の計算機を使おう',
    },
    { label: '答え', body: '鍵は ①={k1}、②={k2}、③={k3}' },
  ],
  clear: {
    normalize: { ignoreCase: true, ignoreWhitespace: true, ignorePunctuation: true },
  },
  debrief: {
    lead: 'あなたが試した鍵',
    countSuffix: '通り',
    // 3 段の対比: 26 × 26 × 26 を桁のまま見せ、26 × 3 に減らし、さらに計算の 3 回へ
    rows: [
      { label: 'まとめて試すと', value: '17,576', unit: '通り' },
      { label: '1 枚ずつ分ければ', value: '78', unit: '通り' },
      { label: '計算すれば', value: '3', unit: '回' },
    ],
    closing: '分けて考え、計算で鍵を出す。これが代数の武器だ',
  },
  notes: NOTES,
  generate(random: () => number): Puzzle {
    const keys = Array.from({ length: KEY_LENGTH }, () => KEY_MIN + randomInt(random, KEY_MAX - KEY_MIN + 1));
    // 候補は 1 件以上あるので、undefined にはならない。noUncheckedIndexedAccess のため先頭で受ける
    const message = MESSAGES[randomInt(random, MESSAGES.length)] ?? MESSAGES[0];
    if (!message) throw new Error('出題の候補が空');
    const givens: readonly Given[] = [
      { label: '鍵の長さ', value: `${KEY_LENGTH} 文字` },
      // id は鍵の計算機が手がかりの文字として引く（ツールは正解の平文全体を知らないまま）
      { id: 'first-word', label: '最初の単語は', value: firstWord(message.plaintext), suffix: 'らしい' },
    ];
    return {
      ciphertext: encrypt(message.plaintext, keys),
      plaintext: message.plaintext,
      translation: message.translation,
      givens,
      hintValues: Object.fromEntries(keys.map((key, i) => [`k${i + 1}`, String(key)])),
    };
  },
};
