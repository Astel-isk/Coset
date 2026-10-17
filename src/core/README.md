# core

暗号・代数の純粋ロジック（UI 非依存）。[DESIGN.md](../../DESIGN.md) §5 を参照。

このディレクトリだけは**簡易版から本編へ持ち越す**ため、他より丁寧に作る。

- `ciphers/types.ts` — 各方式が公開する関数の形（`Cipher<Key>`。`encrypt` / `decrypt` / `attack` の 1 セット）。中身は持たない
- `modular.ts` — 剰余演算・逆元・gcd（未実装）
- `ciphers/caesar.ts` — `encrypt` / `decrypt` / `attack`（未実装）
- `ciphers/vigenere.ts`・`ciphers/affine.ts` — 同上（未実装）

未実装のあいだ、簡易版は `src/stages/` の仮実装（`caesarStub.ts`・`vigenereStub.ts`・`affineStub.ts`）で代用する。
差し替えは import 1 行で済む形にしてある（差し替え先は [EXHIBITION.md](../../EXHIBITION.md)「実装の構成」）。

書き方の手順は [AGENTS.md](../../AGENTS.md) の「実装の分担」に従う。
仕様を先に日本語で書き下し、実装を入れ、テストで検証する。
