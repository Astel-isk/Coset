/**
 * アフィン暗号の対応表と「重ねると光る」の純粋関数（描画から切り離してテストできるようにする）。
 * AffineTable.tsx・AffineStrip.tsx が使う。暗号化は 暗号文 = (a × 平文の番号 + b) を modulus で割った余り。
 * 文字の番号は A=0, B=1, …, Z=25。
 */

import { decrypt, gcd } from '../stages/affineStub'; // core/ciphers/affine.ts・core/modular.ts の実装後にここを差し替える
import { ALPHABET, mod } from './clock';
import { letterNumber } from './formula';

/** 対応表の 1 列。平文の文字 plain（番号 index）は暗号文の文字 cipher になる */
export interface AffineColumn {
  readonly index: number;
  readonly plain: string;
  readonly cipher: string;
}

/** a が modulus と互いに素か（戻せる a か） */
export function isInvertible(a: number, modulus = 26): boolean {
  return gcd(mod(a, modulus), modulus) === 1;
}

/** 鍵の総数。modulus と互いに素な a の数 × b の数（modulus = 26 なら 12 × 26 = 312） */
export function keyTotal(modulus = 26): number {
  let coprime = 0;
  for (let a = 1; a < modulus; a++) {
    if (isInvertible(a, modulus)) coprime += 1;
  }
  return coprime * modulus;
}

/** 鍵 (a, b) の対応表の modulus 列。列 i は 平文 A+i が 暗号文 A+(a × i + b) になる（暗号化の向き） */
export function affineColumns(a: number, b: number, modulus = 26): readonly AffineColumn[] {
  return Array.from({ length: modulus }, (_, index) => ({
    index,
    plain: ALPHABET[index] ?? '',
    cipher: ALPHABET[mod(a * index + b, modulus)] ?? '',
  }));
}

/** 下の行（暗号文）で、ほかの列と同じ文字に重なった列の添字。a が戻せる数なら空 */
export function clashingColumns(columns: readonly AffineColumn[]): ReadonlySet<number> {
  const count = new Map<string, number>();
  for (const c of columns) count.set(c.cipher, (count.get(c.cipher) ?? 0) + 1);
  return new Set(columns.filter((c) => (count.get(c.cipher) ?? 0) >= 2).map((c) => c.index));
}

/** 暗号文の文字 letter になりうる平文の文字（暗号化すると letter になるもの）。a が戻せる数なら 1 つ */
export function plainSources(letter: string, a: number, b: number, modulus = 26): readonly string[] {
  return affineColumns(a, b, modulus)
    .filter((c) => c.cipher === letter)
    .map((c) => c.plain);
}

/**
 * 暗号文を今の (a, b) で戻した文。戻し先が 1 つに決まる文字だけ戻し、0 個または 2 個以上の文字は「?」にする。
 * 空白などはそのまま。a が戻せる数なら、すべて決まるので復号と同じ。
 */
export function restoreText(ciphertext: string, a: number, b: number, modulus = 26): string {
  if (isInvertible(a, modulus)) return decrypt(ciphertext, a, b);
  const columns = affineColumns(a, b, modulus);
  return [...ciphertext]
    .map((ch) => {
      if (letterNumber(ch, modulus) < 0) return ch;
      const sources = columns.filter((c) => c.cipher === ch);
      return sources.length === 1 ? (sources[0]?.plain ?? '?') : '?';
    })
    .join('');
}

/** 戻せない a のときの警告。a の値を差し込む（仕様の文面） */
export function clashWarning(a: number): string {
  return `a = ${a} では、別々の平文が同じ暗号文になる。この a では戻せない`;
}

/**
 * 警告に添える具体例。A の列の暗号文と同じ文字になる平文を 2 つ挙げる（例: 「A と N は、どちらも A になる」）。
 * a が戻せる数（重なりがない）なら null。
 */
export function clashExample(a: number, b: number, modulus = 26): string | null {
  const first = affineColumns(a, b, modulus)[0];
  if (!first) return null;
  const sources = plainSources(first.cipher, a, b, modulus);
  const [x, y] = sources;
  if (x === undefined || y === undefined) return null;
  return `たとえば ${x} と ${y} は、どちらも ${first.cipher} になる`;
}

/** 戻し先を列挙する上限。これより多いときは数だけ示す */
const LIST_LIMIT = 3;

/**
 * 電文の文字に重ねたときの 1 行。暗号文の文字 letter が、今の (a, b) のとき平文のどれから来るかを示す。
 * - 戻せる a: 「暗号文の B(1) は、a = 3, b = 25 のとき平文の S(18) から来る」
 * - 戻せない a: 候補を列挙する（多いときは数だけ）。「…平文の A(0)・N(13) のどちらからも来うる。1 つに決まらない」
 * letter が A–Z でなければ空文字列。
 */
export function hoverSentence(letter: string, a: number, b: number, modulus = 26): string {
  const c = letterNumber(letter, modulus);
  if (c < 0) return '';
  const head = `暗号文の ${letter}(${c}) は、a = ${a}, b = ${b} のとき`;
  const sources = plainSources(letter, a, b, modulus).map((p) => `${p}(${letterNumber(p, modulus)})`);
  if (sources.length === 0) return `${head}、どの平文からも来ない`;
  if (sources.length === 1) return `${head}平文の ${sources[0]} から来る`;
  if (sources.length > LIST_LIMIT) return `${head}平文の ${sources.length} 通りのどれからも来うる。1 つに決まらない`;
  const which = sources.length === 2 ? 'どちらから' : 'どれから';
  return `${head}平文の ${sources.join('・')} の${which}も来うる。1 つに決まらない`;
}
