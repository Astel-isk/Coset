# Coset

> **Coset**（コセット）＝ **剰余類**。ステージ 1 の mod 26 から群論まで、本作を貫く一本の概念

暗号への理解を深めるための **解読パズル型ゲーム**。
プレイヤーは暗号解読官として傍受通信を解読していく。各ステージで新しい暗号方式に出会い、
その解読には背後にある **代数（剰余演算・群・有限体など）の理解** が鍵を握る。

代数をしっかり含みつつ、可視化ツールと段階的な解説でプレイヤーを補助することを目指す。

## コンセプト

- **対象**: 数学好きの学習者をメインに、初学者でも可視化で進める設計
- **難易度の幅**: シーザー暗号 → RSA・群論まで段階的に
- **中心体験**: 解読パズル（暗号文と手がかりから鍵を当てる）
- **基盤**: Web アプリ（ブラウザで動作、インストール不要）

## 学習の三段構え

操作 → 直感 → （興味のある人向けに）厳密な定義へ展開。
「数学好きは RSA／群論まで深掘り、そうでない人は可視化で前に進める」両立を狙う。

## ドキュメント

- [DESIGN.md](DESIGN.md) — ゲーム設計・コンテンツ・技術構成の詳細
- [AGENTS.md](AGENTS.md) — 不変条件・開発の分担・Git 運用（CLAUDE.md はここへのポインタ）
- [EXHIBITION.md](EXHIBITION.md) — 簡易版（立花祭 2026 展示）の仕様

## ステータス

簡易版（立花祭 2026 展示、[EXHIBITION.md](EXHIBITION.md)）の画面を実装済み。ステージ 1（シーザー暗号＋モジュラー時計盤）を、待機 → 解読 → クリアの 3 画面で遊べる。
シーザー暗号の暗号化・復号は `src/stages/caesarStub.ts` の仮実装で代用しており、`src/core/ciphers/caesar.ts` の実装後に差し替える。
`https://coset.astelisk.com`（Cloudflare Workers の静的アセット）で配信する予定で、`dist/index.html` 単体でもダブルクリックで開ける。
本編（ステージ 2 以降）は未着手。

## 開発

```bash
npm install
npm run dev       # 開発サーバー
npm run verify    # 型検査 → Lint → テスト
npm run build     # dist/index.html に JS・CSS を埋め込んだ単一ファイルを出力
npm run preview   # ビルド結果をローカルで配信（展示用）
npm run deploy    # ビルド → wrangler deploy（coset.astelisk.com へ。本人が実行する）
```

## ライセンス

MIT License（[LICENSE](LICENSE)）
