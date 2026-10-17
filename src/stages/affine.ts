import { randomInt } from '../random';
import { NUMBERING_NOTE } from './numbering';
import { encrypt } from './affineStub'; // core/ciphers/affine.ts の実装後にここを差し替える
import type { Given, NoteSet, Puzzle, Stage } from './types';
import { firstWord } from './vigenere';

/** 鍵 a の候補。26 と互いに素な 12 個のうち 1 を除く 11 個（a = 1 はシーザー暗号と同じ） */
export const A_CHOICES: readonly number[] = [3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

/** 「もっと知る」のカード 4 枚。文面は EXHIBITION.md「ステージ 3: アフィン暗号」 */
const NOTES: NoteSet = [
  {
    title: '掛け算の暗号',
    body:
      '暗号文 =（a × 平文 + b）を 26 で割った余り。'
      + '掛け算は文字の並び順そのものを入れ替えるので、円盤を回すだけでは表せない。',
  },
  {
    title: '使える a は 12 個',
    body:
      'a と 26 が 2 や 13 を共通の約数に持つと、別々の平文が同じ暗号文になり、戻せなくなる。'
      + 'たとえば a = 2 なら A と N が同じ文字になる。'
      + '26 と互いに素な 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25 だけが鍵に使える。',
  },
  {
    title: '割り算の代わりに逆元',
    body:
      '26 で割った余りの世界では、割り算の代わりに「掛けると 1 になる数」（逆元）を掛ける。'
      + '3 × 9 = 27 は 26 で割ると 1 余るので、3 の逆元は 9。'
      + '最初の単語の 2 文字を使えば、2 つの式を引き算して b を消し、逆元を掛けて a を直接出せる（連立方程式）。',
  },
  {
    title: 'RSA へ',
    body:
      '逆元があるかどうかを決めるのは最大公約数。'
      + 'この考え方は、現代の暗号 RSA の鍵を作るときにもそのまま使われている。',
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
    rule: '文字の番号に a を掛けて b を足し、26 で割った余りの番号の文字にする。a と b の 2 つが鍵',
    numbering: NUMBERING_NOTE,
    exampleTitle: '例: a = 3、b = 1 で NEKO を暗号にする',
    steps: [
      { plain: 'N(13)', formula: '3 × 13 + 1 = 40 → 余り 14', cipher: 'O' },
      { plain: 'E(4)', formula: '3 × 4 + 1 = 13', cipher: 'N' },
      { plain: 'K(10)', formula: '3 × 10 + 1 = 31 → 余り 5', cipher: 'F' },
      { plain: 'O(14)', formula: '3 × 14 + 1 = 43 → 余り 17', cipher: 'R' },
    ],
    summary: 'NEKO → ONFR',
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
