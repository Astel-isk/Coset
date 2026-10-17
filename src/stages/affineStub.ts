/**
 * アフィン暗号と、その計算に要る最大公約数・逆元の仮実装。
 *
 * 簡易版はこの仮実装のまま展示する（core の実装は本編へ回した。EXHIBITION.md「範囲外」）。
 * 本編で src/core/modular.ts・src/core/ciphers/affine.ts を書いたら、import を差し替えて削除する。
 * 差し替え先は stages/affine.ts と tools/AffineTable.tsx（と tools/affine.ts）の import 各 1 行。
 * （core は本編へ持ち越す部分なので、持ち越さない仮実装は core に置かない。EXHIBITION.md「実装の構成」）
 *
 * 暗号文 = (a × 平文 + b) を 26 で割った余り。文字の番号は A=0, …, Z=25。
 * A–Z 以外の文字（空白など）はそのまま残す。
 */

const MODULUS = 26;
const CODE_A = 'A'.charCodeAt(0);

/** 正の剰余 */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** 最大公約数（ユークリッドの互除法）。引数は 0 以上の整数 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** a の mod m での逆元（a × x を m で割った余りが 1 になる x）。存在しなければ null */
export function modInverse(a: number, m = MODULUS): number | null {
  const base = mod(a, m);
  for (let x = 1; x < m; x++) {
    if ((base * x) % m === 1) return x;
  }
  return null;
}

function isLetter(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return ch.length === 1 && code >= CODE_A && code < CODE_A + MODULUS;
}

/** A–Z だけを n → f(n) に写す */
function mapLetters(text: string, f: (n: number) => number): string {
  let out = '';
  for (const ch of text) {
    out += isLetter(ch) ? String.fromCharCode(CODE_A + mod(f(ch.charCodeAt(0) - CODE_A), MODULUS)) : ch;
  }
  return out;
}

/** 暗号化。a は何でも受け付けるが、戻せるのは a が 26 と互いに素なときだけ */
export function encrypt(plaintext: string, a: number, b: number): string {
  return mapLetters(plaintext, (n) => a * n + b);
}

/** 復号。a が 26 と互いに素でなければ戻せないので RangeError */
export function decrypt(ciphertext: string, a: number, b: number): string {
  const inverse = modInverse(a, MODULUS);
  if (inverse === null) throw new RangeError(`a = ${a} は 26 と互いに素でないので戻せない`);
  return mapLetters(ciphertext, (n) => inverse * (n - b));
}
