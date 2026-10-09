---
name: design-sync-check
description: Check whether DESIGN.md, CLAUDE.md, README.md and src/core/README.md still match the actual Coset implementation (module layout, core API shape, banned UI affordances, verify/CI commands, cross-doc links). Use when asked to verify the docs are up to date, check docs against the implementation, or before a docs-related commit/PR in this repo.
---

# design-sync-check

Coset の `DESIGN.md` / `CLAUDE.md` / `README.md` / `src/core/README.md` が実装と食い違っていないかを確認するチェックリスト。

このリポジトリは **DESIGN.md が正**、簡易版の暫定判断は DESIGN.md を上書きしないという建て付けで動いている。
実装が先に進んで文書が追いつかないと、この「どちらが正か」が壊れて設計判断の履歴が読めなくなる。それを防ぐための点検。

## 実行手順

以下を順番にチェックし、最後にズレをまとめて報告する。**勝手に修正しない** — 見つかった不一致は報告し、
直すかどうか・どちらを正とするかは本人に確認する(既定の考え方: モジュール構成やコマンド名は実装側が正で文書が追従、
設計判断・禁止事項は DESIGN.md 側が正で実装を直す)。

### 1. モジュール構成

`DESIGN.md` §5「想定モジュール構成(暫定)」の木と実際の `src/` を突き合わせる。

```bash
find src -type f | sort
```

- `core/` `tools/` `stages/` `ui/` `store/` のうち、**まだ無いのは未着手として正常**。報告するのは
  「文書に無いディレクトリが実装に増えている」「文書のファイル名と実体の名前が違う」場合だけ
- `src/core/README.md` が挙げているファイル(`modular.ts`・`ciphers/caesar.ts` など)と実体の有無・
  「(未実装)」注記が合っているか

### 2. core の公開 API の形

DESIGN.md §5 は「各暗号モジュールは `encrypt` / `decrypt` / `attack`(1つ以上)を1セットで公開する」と定めている。

```bash
grep -rn "export " src/core --include=*.ts | grep -v ".test.ts"
```

- `src/core/ciphers/` の各モジュールがこの3種を揃えているか(未実装のものは対象外)
- `core/` が UI に依存していないか(`src/core` から `react` や `src/ui` を import していないか)

```bash
grep -rn "from '\(react\|\.\./ui\|\.\./\.\./ui\)" src/core || echo "UI依存なし"
```

### 3. 設計上の禁止事項(DESIGN.md §4 / CLAUDE.md)

機械的に見えるのは次の3点。**該当があれば最優先で報告する。**

```bash
grep -rn "attack" src/ui src/tools src/stages 2>/dev/null || echo "UIからのattack参照なし"
```

- `core` の `attack` が UI から直接呼ばれていないか(ヒント生成と将来の防御モード専用)
- 「総当たり」「素因数分解」をプレイヤーが直接叩けるボタンが増えていないか
  (`src/ui` の文言を `総当たり|ブルートフォース|素因数分解` で検索する)
- 答えに近づく情報がツール側に漏れていないか(ヒント側に集約されているか)

### 4. 簡易版の暫定判断と DESIGN.md の分離

CLAUDE.md は「簡易版のために置く暫定判断(永続化しない・ヒントに代償を設けない・KaTeX / Zustand を入れない等)は
DESIGN.md の決定を上書きしない」と定めている。**逆向きのズレ**を探す。

```bash
grep -n "\"\(katex\|zustand\)\"" package.json || echo "KaTeX/Zustand は未導入"
grep -rn "localStorage\|sessionStorage" src || echo "永続化なし"
```

- 依存が入っているのに CLAUDE.md の暫定判断の記述が古いままになっていないか
- 永続化のコードが入っているのに「進行状況を保存しない」という展示の制約が残ったままになっていないか
- 逆に、DESIGN.md §8「未決事項」の論点が実装では既に確定しているのに、表に未決として残っていないか
  (特に「ステージ定義の形式」「ステージ構成の範囲」— 第1マイルストーンで結論を出すと明記されている)

### 5. コマンドと CI の一致

```bash
grep -n "\"scripts\"" -A 12 package.json
cat .github/workflows/ci.yml
```

- `package.json` の scripts、`CLAUDE.md`「検証」節、`README.md`「開発」節、CI のステップが同じコマンドを指しているか
- `npm run verify` の中身(typecheck → lint → test)が CLAUDE.md の記述と一致しているか
- CI にあって手元に無いステップ(または逆)がないか

### 6. 展示(簡易版)の制約

CLAUDE.md「展示(簡易版)の制約」と EXHIBITION.md は、最初の読み込み以外でネットワークに依存しないこと、
ビルドが単一の `dist/index.html` に収まることを求めている。

```bash
grep -rn "https\?://" src index.html | grep -v "^\S*:.*// " || echo "外部参照なし"
```

- 実行時に外部へ取りに行く参照(CDN の script/link、フォント、API)が入っていないか
- `npm run build` の出力が単一の `dist/index.html` に収まり、ダブルクリックでも動く構成のままか(`vite.config.ts` の `base: './'` と埋め込みの設定が維持されているか)

### 7. ドキュメント間の相互参照

```bash
grep -noE '\[[^]]*\]\([^)]+\.md[^)]*\)' *.md src/core/*.md
```

- 参照先の `.md` が実在するか(リンク切れ)
- `DESIGN.md` 内の見出しアンカー(`#5-技術構成` など)が現在の見出しと合っているか
- `README.md`「ステータス」節の記述(何が未実装か)が現状と合っているか

## 報告フォーマット

チェック項目ごとに一致/不一致を短くまとめ、不一致のみ詳細(該当ファイル・行、文書側の記述、実装側の状態、
どちらを正とみるかの案)を添える。全部一致していれば「一致」とだけ簡潔に報告し、余計な前置きをしない。
