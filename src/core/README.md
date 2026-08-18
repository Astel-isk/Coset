# core

暗号・代数の純粋ロジック（UI 非依存）。[DESIGN.md](../../DESIGN.md) §5 を参照。

このディレクトリだけは**簡易版から本編へ持ち越す**ため、他より丁寧に作る。

- `modular.ts` — 剰余演算・逆元・gcd（未実装）
- `ciphers/caesar.ts` — `encrypt` / `decrypt` / `attack`（未実装）

書き方の手順は [CLAUDE.md](../../CLAUDE.md) の「実装の分担」に従う。
仕様を先に日本語で書き下し、実装を入れ、テストで検証する。
