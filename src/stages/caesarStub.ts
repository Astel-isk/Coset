/**
 * シーザー暗号の暗号化・復号の仮実装。
 *
 * 簡易版はこの仮実装のまま展示する（core の実装は本編へ回した。EXHIBITION.md「範囲外」）。
 * 本編で src/core/ciphers/caesar.ts を書いたら import を差し替えて削除する。
 * 差し替え先は stages/caesar.ts と tools/ModularClock.tsx の import 各 1 行。
 * （core は本編へ持ち越す部分なので、持ち越さない仮実装は core に置かない。EXHIBITION.md「実装の構成」）
 */

const MODULUS = 26;
const CODE_A = 'A'.charCodeAt(0);

/** 正の剰余 */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A–Z だけを key 文字ぶんずらす。それ以外の文字はそのまま返す */
function shift(text: string, key: number): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (ch.length === 1 && code >= CODE_A && code < CODE_A + MODULUS) {
      out += String.fromCharCode(CODE_A + mod(code - CODE_A + key, MODULUS));
    } else {
      out += ch;
    }
  }
  return out;
}

export function encrypt(plaintext: string, key: number): string {
  return shift(plaintext, key);
}

export function decrypt(ciphertext: string, key: number): string {
  return shift(ciphertext, -key);
}
