import { randomInt } from '../random';
import { NUMBERING_NOTE } from './numbering';
import { encrypt } from './affineStub'; // core/ciphers/affine.ts の実装後にここを差し替える
import type { Given, NoteSet, Puzzle, Stage } from './types';
import { firstWord } from './vigenere';

/** 鍵 a の候補。26 と互いに素な 12 個のうち 1 を除く 11 個（a = 1 はシーザー暗号と同じ） */
export const A_CHOICES: readonly number[] = [3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

/** 「もっと知る」のカード 5 枚。文面は EXHIBITION.md「ステージ 3: アフィン暗号」 */
const NOTES: NoteSet = [
  {
    title: '掛け算の暗号',
    body:
      'シーザー暗号は足し算だけだった。アフィン暗号は、足す前に掛け算を 1 回する。'
      + '掛けると A, B, C… が A, D, G… のように飛び飛びに並び替わる。'
      + '円盤はぐるりと回すだけなので、この並び替えは作れない。',
  },
  {
    title: '使える a は 12 個',
    body:
      'a が偶数だと困ったことが起きる。'
      + 'a = 2 では、A(0) も N(13) も 2 倍して 26 を引くと 0 になり、どちらも同じ文字に化ける。'
      + '受け取った側は、どちらだったのか決められない。a = 13 も同じ。'
      + '使えるのは 26 と公約数を持たない 12 個（1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25）だけ。',
  },
  {
    title: '割り算の代わりに逆元',
    body:
      // このカードは下の段に入り、高さが 1 行ぶんしか余らない（.note は overflow: hidden）。
      // 1366×768 で本文が 5 行（約 122 字）を超えると末尾が切れる。足すときは実機で確かめる
      '3 倍された数を戻すには 3 で割りたいが、この世界に割り算はない。'
      + '代わりに「掛けると 1 になる数」を掛ける。3 × 9 = 27 は 26 を引くと 1 なので、3 を戻す役は 9（逆元という）。'
      + '最初の単語が 2 文字分かれば a も出る。',
  },
  {
    title: 'RSA へ',
    body:
      '戻せる鍵かどうかは、a と 26 が公約数を持つかどうかだけで決まる。'
      + 'この見分け方は、いま世界中の通信を守っている暗号（RSA）の鍵を作るときにも、そのまま使われている。',
  },
  {
    title: '並べ替える暗号',
    body:
      'ここまでの 3 つは、文字を別の文字に置き換える暗号（換字）だった。'
      + 'もう一つの作り方は、文字はそのままで位置だけを入れ替える暗号（転置）で、'
      + '4 文字ずつ区切って並べ替えるなら鍵は 4 × 3 × 2 × 1 = 24 通りある。'
      + '並べ替え全体のつくる構造を置換群といい、足し算や掛け算と違って、続ける順番を変えると結果が変わる。'
      + '換字と転置は別の操作なので、重ねれば鍵の数は 312 × 24 のように掛け算で増える。',
  },
];

/** 出題の候補（10 文）。平文はローマ字。最初の単語は与件として見せるので 2 文字以上（EXHIBITION.md「ステージ 3」） */
export const MESSAGES: readonly { readonly plaintext: string; readonly translation: string }[] = [
  { plaintext: 'KONYA NO KAIGOU WA TORIYAME DA', translation: '今夜の会合は取りやめだ' },
  { plaintext: 'KOUCHOUSHITSU NO KINKO NO BANGOU WA NANA KETA DA', translation: '校長室の金庫の番号は七桁だ' },
  { plaintext: 'OKUJOU NO KAGI WA BOKU GA MOTTE IRU', translation: '屋上の鍵は僕が持っている' },
  { plaintext: 'RIKASHITSU NO KENBIKYOU NI MEMO WO HASANDA', translation: '理科室の顕微鏡にメモを挟んだ' },
  { plaintext: 'ASA ICHIBAN NO DENSHA DE MACHI WO DERU', translation: '朝一番の電車で町を出る' },
  { plaintext: 'ONGAKUSHITSU NO PIANO NO NAKA WO SHIRABEYO', translation: '音楽室のピアノの中を調べよ' },
  { plaintext: 'KONO ANGOU WO TOITA KIMI WA MOU NAKAMA DA', translation: 'この暗号を解いた君はもう仲間だ' },
  { plaintext: 'NIJI NO KANE GA NATTARA TOSHOKAN NI ATSUMARE', translation: '二時の鐘が鳴ったら図書館に集まれ' },
  { plaintext: 'HONTOU NO KAGI WA SUUGAKU NO NAKA NI ARU', translation: '本当の鍵は数学の中にある' },
  { plaintext: 'SUBETE NO ANGOU WA TOKARETA OMEDETOU', translation: 'すべての暗号は解かれた。おめでとう' },
];

/**
 * ステージ 3: アフィン暗号（簡易版）。
 *
 * 教訓は「円盤では回せない暗号も、式にすれば解ける」。掛け算は文字の並び順そのものを入れ替えるので、
 * 回転する円盤では表せない。鍵は a（26 と互いに素な 12 個のうち 1 を除く 11 個）と b（0〜25）で、総数は 12 × 26 = 312 通り。
 */
export const affineStage: Stage = {
  id: 'affine',
  order: 3,
  title: 'アフィン暗号',
  arrival: { challengeLabel: '最後の暗号に挑む', interceptHeadline: '最後の電文を傍受' },
  flavor: '最後の電文。円盤はもう使えない。鍵は a と b の 2 つ。読める文を探せ。',
  briefing: {
    rule: '文字の番号に a を掛けて b を足す。26 以上になったら 26 を引く（26 で割った余り）。この 2 つの数 a・b が鍵',
    numbering: NUMBERING_NOTE,
    figure: {
      rows: [
        { label: '平文', cells: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { label: '番号', cells: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
        { label: '×3', cells: ['0', '3', '6', '9', '12', '15', '18', '21', '24', '27'] },
        { label: '+1', cells: ['1', '4', '7', '10', '13', '16', '19', '22', '25', '28'] },
        { label: '余り', cells: ['1', '4', '7', '10', '13', '16', '19', '22', '25', '2'] },
        { label: '暗号', cells: ['B', 'E', 'H', 'K', 'N', 'Q', 'T', 'W', 'Z', 'C'] },
      ],
      caption: 'a は何個とばしか。いちばん下の段は B, E, H… と 3 つずつ飛んでいる。b は全体のずらしで、シーザー暗号と同じ',
    },
    exampleTitle: '例: a = 3、b = 1 で NEKO を暗号にする',
    // 式の書き方はステージ 1 と同じ「→ −26 = …」に揃える（一度覚えた読み方をそのまま使えるようにするため）。
    // 「→ −26 = 14」は折り返しで分かれないよう、間を改行しない空白（\u00a0）でつなぐ（スマホ版）
    steps: [
      { plain: 'N(13)', formula: '3 × 13 + 1 = 40 →\u00a0−26\u00a0=\u00a014', cipher: 'O' },
      { plain: 'E(4)', formula: '3 × 4 + 1 = 13', cipher: 'N' },
      { plain: 'K(10)', formula: '3 × 10 + 1 = 31 →\u00a0−26\u00a0=\u00a05', cipher: 'F' },
      { plain: 'O(14)', formula: '3 × 14 + 1 = 43 →\u00a0−26\u00a0=\u00a017', cipher: 'R' },
    ],
    summary: 'NEKO → ONFR',
    guide:
      'a をボタンで選び、b を ← → で動かす。対応表は上の段が平文・下の段が暗号文なので、電文の文字を下の段で探して、その真上を読む',
  },
  givens: [],
  tools: [{ id: 'affine-table', modulus: 26 }],
  hints: [
    { label: '手がかり', body: 'a に使える数は 12 個だけ。2 や 13 を選ぶと何が起きるか見てみよう' },
    {
      label: '仕組み',
      body:
        '暗号文 = a × 平文 + b（26 で割った余り）。a を決めれば、最初の単語の 1 文字目から b は計算で 1 つに決まる。'
        + '鍵の計算機を使おう',
    },
    { label: '答え', body: '鍵は a = {a}、b = {b}' },
  ],
  clear: {
    normalize: { ignoreCase: true, ignoreWhitespace: true, ignorePunctuation: true },
  },
  debrief: {
    lead: 'あなたが試した鍵',
    countSuffix: '通り',
    // 3 段の対比: 12 × 26 の総当たり → a だけ試す 12 通り → 2 文字の連立で 1 回
    rows: [
      { label: '総当たりでは', value: '312', unit: '通り' },
      { label: 'a だけ試せば', value: '12', unit: '通り' },
      { label: '2 文字で連立すれば', value: '1', unit: '回' },
    ],
    closing: '円盤では回せない暗号も、式にすれば解ける',
  },
  notes: NOTES,
  generate(random: () => number): Puzzle {
    const a = A_CHOICES[randomInt(random, A_CHOICES.length)] ?? 3;
    const b = randomInt(random, 26);
    // 候補は 1 件以上あるので、undefined にはならない。noUncheckedIndexedAccess のため先頭で受ける
    const message = MESSAGES[randomInt(random, MESSAGES.length)] ?? MESSAGES[0];
    if (!message) throw new Error('出題の候補が空');
    const givens: readonly Given[] = [
      // id は鍵の計算機が手がかりの文字として引く（ツールは正解の平文全体を知らないまま）
      { id: 'first-word', label: '最初の単語は', value: firstWord(message.plaintext), suffix: 'らしい' },
    ];
    return {
      ciphertext: encrypt(message.plaintext, a, b),
      plaintext: message.plaintext,
      translation: message.translation,
      givens,
      hintValues: { a: String(a), b: String(b) },
    };
  },
};
