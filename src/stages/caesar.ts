import { encrypt } from './caesarStub';
import type { Puzzle, Stage } from './types';

/** 出題の候補。平文はローマ字（簡易版の暫定判断。EXHIBITION.md「出題」） */
const MESSAGES: readonly { readonly plaintext: string; readonly translation: string }[] = [
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
];

/** 鍵の最小値と最大値。0 は暗号化しないことになるので除く */
const KEY_MIN = 1;
const KEY_MAX = 25;

/** [0, n) の整数を一様に選ぶ。random が 1 に達しても範囲外に出さない */
function randomInt(random: () => number, n: number): number {
  return Math.min(n - 1, Math.floor(random() * n));
}

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
  briefing:
    'この暗号は、文字をアルファベット順に一定数ずらすだけの方式。ずらす量が鍵で、'
    + '取りうる値は 26 通りしかない。鍵の候補を全部試せてしまう暗号は、それだけで破れる。',
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
    rivalName: '並べ替え暗号',
    // 26! を桁のまま見せる（指数表記にしない。EXHIBITION.md「クリア画面」）
    rivalKeys: '403,291,461,126,605,635,584,000,000',
    rivalDuration: '1 秒に 1 億通り試しても 約 1,300 億年',
    closing: 'だから暗号には、もっと賢い仕組み（代数）が要る',
  },
  generate(random: () => number): Puzzle {
    const key = KEY_MIN + randomInt(random, KEY_MAX - KEY_MIN + 1);
    // 候補は 1 件以上あるので、undefined にはならない。noUncheckedIndexedAccess のため先頭で受ける
    const message = MESSAGES[randomInt(random, MESSAGES.length)] ?? MESSAGES[0];
    if (!message) throw new Error('出題の候補が空');
    return {
      ciphertext: encrypt(message.plaintext, key),
      plaintext: message.plaintext,
      translation: message.translation,
      keyLabel: String(key),
    };
  },
};
