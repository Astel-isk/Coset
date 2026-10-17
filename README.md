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

簡易版（立花祭 2026 展示、[EXHIBITION.md](EXHIBITION.md)）を `https://coset.astelisk.com`（Cloudflare Workers の静的アセット）で公開している。
`dist/index.html` 単体でもダブルクリックで開ける。

- 待機 → 傍受演出 → 説明 → 解読 → クリア → 解説の流れで、ステージ 1（シーザー暗号）・ステージ 2（ヴィジュネル暗号、円盤 3 枚と鍵の計算機）・ステージ 3（アフィン暗号、a・b の選択と計算機）を遊べる
- 暗号化・復号は `src/stages/caesarStub.ts`・`vigenereStub.ts`・`affineStub.ts` の仮実装で行う。`src/core/`（暗号・代数の純粋ロジック）の実装は本編へ回した（[EXHIBITION.md](EXHIBITION.md)「範囲外」）
- 本編（DESIGN.md のロードマップ）は未着手

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
