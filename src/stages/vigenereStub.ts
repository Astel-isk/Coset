/**
 * ヴィジュネル暗号の暗号化・復号の仮実装。
 *
 * 本人が src/core/ciphers/vigenere.ts を実装したら import を差し替えて削除する。
 * 差し替え先は stages/vigenere.ts と tools/MultiClock.tsx の import 各 1 行。
 * （core は本人の学習対象なので、仮実装は core に置かない。EXHIBITION.md「実装の構成」）
 *
 * 鍵は 1 文字ぶんのずらし量の列で、n 番目（0 起点）の文字は keys[n mod keys.length] だけずらす。
 * 鍵の位置は A–Z の文字だけで進め、空白などは飛ばしてそのまま残す。
 */

const MODULUS = 26;
const CODE_A = 'A'.charCodeAt(0);

/** 正の剰余 */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A–Z だけを、鍵の列に沿って順にずらす。direction が -1 なら逆向き（復号） */
function shift(text: string, keys: readonly number[], direction: 1 | -1): string {
  if (keys.length === 0) throw new RangeError('鍵が空');
  let out = '';
  let position = 0; // 何文字目の A–Z か（鍵を選ぶ位置）
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (ch.length === 1 && code >= CODE_A && code < CODE_A + MODULUS) {
      const key = keys[position % keys.length] ?? 0;
      out += String.fromCharCode(CODE_A + mod(code - CODE_A + direction * key, MODULUS));
      position += 1;
    } else {
      out += ch;
    }
  }
  return out;
}

export function encrypt(plaintext: string, keys: readonly number[]): string {
  return shift(plaintext, keys, 1);
}

export function decrypt(ciphertext: string, keys: readonly number[]): string {
  return shift(ciphertext, keys, -1);
}
