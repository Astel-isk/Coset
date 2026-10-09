# AGENTS.md

## プロジェクト概要

暗号解読パズル型 Web ゲーム「Coset」。**学習用**の個人開発で、副次的に公開して遊ばれる形を目指す。
TypeScript + React + Vite + Vitest。`https://coset.astelisk.com`（Cloudflare Workers の静的アセット）で配信する。

開発は 2 本立てで進める。

| | 簡易版 | 本編 |
|---|---|---|
| 目的 | 2026 年 11 月 2〜3 日の立花祭での展示 | DESIGN.md のロードマップ |
| 範囲 | シーザー暗号とヴィジュネル暗号の 2 ステージ | ステージ追加が乗る「型」から |
| 着手 | 2026 年 8〜10 月 | 2027 年秋以降 |
| 扱い | **作り捨て前提**。速度優先 | 長期 |

| 知りたいこと | 読むファイル |
|---|---|
| ゲーム設計・コンテンツ・技術構成（本編の正） | [DESIGN.md](DESIGN.md) |
| 簡易版の仕様・展示環境・日程 | [EXHIBITION.md](EXHIBITION.md) |
| 起動・ビルド・デプロイの手順、現状 | [README.md](README.md) |
| `core` の作り方とファイルの状態 | [src/core/README.md](src/core/README.md) |
| 文書と実装のズレの点検 | `.claude/skills/design-sync-check/SKILL.md` |

## 不変条件

本人と合意した設計判断。変えるときは本人の合意を得て、対応する文書（DESIGN.md・EXHIBITION.md）も同時に更新する。
実装がこれに反しそうだと気づいたら、進めずに本人へ確認する。

### 設計（DESIGN.md §4・§5）

- プレイヤーが直接叩ける「総当たり」「素因数分解」ボタンを置かない
- `core` の `attack` 関数は将来の防御モード（DESIGN.md §6）の準備で、画面からは使わない。UI から直接呼ぶ導線を作らない
- 答えに近づく情報はツールではなく**ヒント**側に集約する。ツールは正解を知らない
- ステージは宣言的データとして `stages/` に書き、ランナー（`ui/`）は暗号方式を知らない。方式に固有の処理はステージかツールに置く
- `core/` は UI に依存しない純粋関数とし、各暗号方式は `encrypt` / `decrypt` / `attack` を 1 セットで公開する

### 簡易版と本編の切り分け

- 簡易版のために置く暫定判断（永続化しない・ヒントに代償を設けない・KaTeX / Zustand を入れない・平文をローマ字にする等）は、
  **DESIGN.md の決定を上書きしない**。DESIGN.md を変える場合は簡易版の都合と切り分けて書く
- `src/core/` だけは簡易版から本編へ持ち越すため、他より丁寧に作る

### 展示（簡易版。詳細は EXHIBITION.md）

- ネットワークが要るのは最初の読み込みだけ。外部のフォント・CDN・API を参照しない。
  ビルドは単一の `dist/index.html` に収め、ダブルクリック（`file://`）でも動くこと
- 進行状況を保存しない（`localStorage` 等を使わない）。次の来場者のためにリセットできること
- **説明役が常駐できない前提**で作る。画面だけで導入・操作・教訓が完結すること

### 契約物と文書の同期

- `src/stages/types.ts`・`src/tools/types.ts`・`src/core/ciphers/types.ts` の型を変えたら、
  DESIGN.md §5「ステージ定義の形式」と EXHIBITION.md「実装の構成」を同じコミットで直す。点検は `design-sync-check` スキルで行う

## 実装の分担

- **`src/core/**`（暗号・代数の純粋ロジック）**: 本人の学習対象。**仕様を日本語で書き下してから**実装する。
  仕様なしにコードから書き始めない。テストを同じコミットに必ず含める。エージェントは本人の依頼なしに書かない
- **それ以外**（`ui/` `tools/` `stages/` `store/`、ビルド・CI・設定）: Claude に委任してよい
- 依存の追加は事前に相談する。DESIGN.md §5 の技術選定は本編向けであり、簡易版に全部入れる必要はない

## ランタイムと起動コマンド

- `npm run verify`: `typecheck` → `lint` → `test`。変更後は必ず通す（CI はこれに `build` を加えたもの）
- `npm run build`: 単一ファイルの `dist/index.html` を出す
- `noUncheckedIndexedAccess` が有効。配列アクセスは `undefined` を考慮して書く
- dev server は `.claude/launch.json` の `dev`（5173）、ビルド結果の確認は `preview`（4173）から起動する。Bash で起動しない
- `npm run deploy`: ビルドして `wrangler deploy`。**本番へのデプロイは本人が実行する**

## Git 運用

- コミットメッセージは `接頭辞:やったこと`（**コロンの後に空白を入れない**。本人の開発リポジトリ共通の慣例）。
  接頭辞は `feat` / `ui` / `remove` / `fix` / `docs` / `style` / `refact` / `perf` / `test` / `wip` / `chore`。
  `.claude/hooks/commit-guard.mjs` が commit 直前に機械検査する。接頭辞を変えるときは、この行と同スクリプトの `TYPES` を**両方**直す
  - 2026 年 10 月 9 日以前の履歴は `種別: 要約`（空白あり）で書かれている。書き換えない
- UI 文言・コメント・ドキュメント・コミットメッセージは**日本語**。識別子と型名は英語
- ブランチ名は `接頭辞/内容`（`feat/caesar-stage`、`fix/clock-rotation`）
- 統合先は **main 一本**で、`develop` は作らない。単独開発であり、緩衝用のブランチを挟んでも 2 段マージの手間しか増えない
- **`src/core/` を触る変更はブランチを切って main へ PR を出す。** 仕様・実装・テストが 1 つの差分に揃い、本編へ持ち越すときに読み返せる
  - マージの前に、CI の緑だけで済ませず、ローカルでブランチをチェックアウトして `npm run verify` を通し、
    `git merge --no-commit --no-ff origin/main` で main を試しにマージした状態でもう一度通す（確認後 `git merge --abort`）
  - CodeRabbit は導入していない。レビューは差分を通して読んで行う
- それ以外は main への直接コミットでよい。簡易版は速度優先で、事務作業に勝たせない
- 展示用の版を凍結するときはブランチではなく**タグ**を打つ（`exhibition-2026`）

## テストを書く基準

- 書く: `core` のすべての公開関数（本人が書く）。`ui/` `tools/` `stages/` の純粋関数（正規化・ヒントの差し込み・出題の生成・時計盤の計算）
- 原則不要: React コンポーネントの見た目と操作。ブラウザでの通し確認（`preview` で待機 → 解読 → クリア）で代える

## コンテキストに読み込ませないもの

`node_modules/`・`dist/`・`.wrangler/`・`coverage/`・`package-lock.json`

## `.claude/` の中身

| ファイル | 役割 |
|---|---|
| `settings.json` | 検証コマンドの許可と、下記フックの配線。リポジトリで共有する。**このリポジトリを作業ディレクトリにして開いたセッションでだけ効く** |
| `settings.local.json` | 個人設定。git 管理外 |
| `hooks/commit-guard.mjs` | `git commit` の直前に、接頭辞が規約に合っているか（違反は拒否）と、`src/core/` の実装変更にテストが同梱されているか（欠けていれば確認）を検査する。判断に迷う入力では黙って通す |
| `launch.json` | `dev`（5173）と `preview`（4173）の起動定義 |
| `skills/design-sync-check/` | DESIGN.md・EXHIBITION.md・AGENTS.md・README と実装のズレを点検する手順 |
