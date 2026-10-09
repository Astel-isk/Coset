import type { Stage } from './types';

/**
 * ステージ 1: シーザー暗号。
 *
 * 教訓は「鍵空間が小さいから破れる」に置く（DESIGN.md §2「統計的手法の扱い」）。
 * 平文・暗号文の文面は差し替えてよい。暗号文は平文をシフト 7 で暗号化したもの。
 */
export const caesarStage: Stage = {
  id: 'caesar',
  order: 1,
  title: 'シーザー暗号',
  flavor: '前線から届いた最初の傍受通信。文字が一定の規則でずれているらしい。',
  briefing:
    'この暗号は、文字をアルファベット順に一定数ずらすだけの方式。ずらす量が鍵で、'
    + '取りうる値は 26 通りしかない。鍵の候補を全部試せてしまう暗号は、それだけで破れる。',
  ciphertext: 'DL TVCL AOL HYJOPCL HA KHDU IBYU AOPZ HMALY YLHKPUN',
  givens: [{ label: '鍵空間', value: '26 通り' }],
  tools: [{ id: 'modular-clock', modulus: 26 }],
  hints: [
    { body: '鍵の候補は何通りある? 全部試せる数だろうか' },
    {
      body:
        '暗号化は文字を数に直した上での mod 26 の加法。鍵はシフト量ひとつだけ',
    },
    { body: '鍵は 7。時計盤を 7 だけ戻せば平文が出る' },
  ],
  clear: {
    plaintext: 'WE MOVE THE ARCHIVE AT DAWN BURN THIS AFTER READING',
    normalize: { ignoreCase: true, ignoreWhitespace: true, ignorePunctuation: true },
  },
};
