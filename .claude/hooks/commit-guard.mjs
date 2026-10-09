#!/usr/bin/env node
// git commit を実行する直前に、CLAUDE.md の規約に反していないかを機械的に検査する。
//
// 検査するのは2つだけ。
//   1. コミットメッセージの接頭辞が `種別: 要約`(docs/feat/fix/chore/test/refactor)であること → 違反は deny
//   2. src/core/ の実装を触るコミットに、同じコミット内のテストが含まれること      → 欠けていれば ask
//
// 規約そのものは CLAUDE.md が正。種別を増やす・減らすときは CLAUDE.md と TYPES を両方直す。
// 判断に迷う入力(メッセージを取り出せない・git が読めない等)では黙って通す。
// 検査を落とすより、誤って止めるほうが害が大きいため。

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TYPES = ['docs', 'feat', 'fix', 'chore', 'test', 'refactor'];
// TYPES と同じ並び。片方だけ直すとずれるので、種別を増減するときは両方を直す。
const PREFIX_RE = /^(docs|feat|fix|chore|test|refactor)(\([^)]+\))?:/;

/** PreToolUse の判定を JSON で返して終了する。 */
function decide(permissionDecision, permissionDecisionReason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision,
        permissionDecisionReason,
      },
    }),
  );
  process.exit(0);
}

/** 何も言わずに通す。 */
function pass() {
  process.exit(0);
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/**
 * `-m` / `--message` に続く文字列の1行目を取り出す。
 * 取り出せない形(ヒアドキュメント・エディタ起動・変数展開)では null を返す。
 */
function extractMessage(command) {
  const m = command.match(/(?:-m|--message)[=\s]+(@'|"|')/);
  if (!m) return null;
  const quote = m[1];
  const start = m.index + m[0].length;
  if (quote === "@'") {
    // PowerShell のヒアドキュメント。開き記号の次の行が1行目。
    const rest = command.slice(start).replace(/^\r?\n/, '');
    return rest.split(/\r?\n/)[0] ?? null;
  }
  const end = command.indexOf(quote, start);
  if (end === -1) return null;
  const body = command.slice(start, end);
  if (body.includes('$(') || body.includes('`')) return null; // 展開結果は読めない
  return body.split(/\r?\n/)[0] ?? null;
}

/** git の出力を行の配列で返す。失敗したら null。 */
function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return null;
  }
}

function main() {
  const raw = readStdin();
  if (!raw) pass();

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    pass();
  }

  const command = payload?.tool_input?.command;
  if (typeof command !== 'string') pass();
  // `git commit` 以外(git log --grep commit など)を巻き込まないよう、
  // サブコマンド位置の commit だけを対象にする。
  // `-C <path>` / `-c <key=value>` は引数を別の語に取るので、その引数ごと読み飛ばす。
  const ARG = `(?:"[^"]*"|'[^']*'|[^\\s]+)`;
  const COMMIT_RE = new RegExp(
    `\\bgit\\s+((?:-[Cc]\\s+${ARG}\\s+|-[^\\s]+\\s+|--[^\\s]+(?:=[^\\s]+)?\\s+)*)commit\\b`,
  );
  const commitMatch = command.match(COMMIT_RE);
  if (!commitMatch) pass();

  // `git -C <path> commit` では、staged を読む場所もその path にする
  const dirMatch = (commitMatch[1] ?? '').match(new RegExp(`-C\\s+(${ARG})`));
  const dirArg = dirMatch?.[1]?.replace(/^["']|["']$/g, '');
  const cwd = dirArg || process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // 1. 接頭辞
  const message = extractMessage(command);
  if (message !== null) {
    const head = message.trim();
    const exempt = /^(Merge|Revert)\b/.test(head);
    if (!exempt && !PREFIX_RE.test(head)) {
      decide(
        'deny',
        `コミットメッセージが CLAUDE.md の規約(\`種別: 要約\`)に合っていない。\n` +
          `  入力: ${head}\n` +
          `  使える種別: ${TYPES.join(' / ')}(\`feat(core): ...\` のようにスコープを付けてもよい)\n` +
          `メッセージを直して commit し直すこと。種別そのものを増やしたい場合は先に CLAUDE.md の規約を更新する。`,
      );
    }
  }

  // 2. core の実装とテストの同梱
  const staged = git(['diff', '--cached', '--name-only'], cwd) ?? [];
  const alsoTracked = /\s-(\w*a\w*)\b|--all\b/.test(command)
    ? (git(['diff', '--name-only'], cwd) ?? [])
    : [];
  const files = [...new Set([...staged, ...alsoTracked])];
  if (files.length === 0) pass();

  const isCoreTs = (f) => /^src\/core\/.+\.tsx?$/.test(f);
  const isTest = (f) => /\.test\.tsx?$/.test(f);
  const coreImpl = files.filter((f) => isCoreTs(f) && !isTest(f));
  const tests = files.filter(isTest);
  if (coreImpl.length > 0 && tests.length === 0) {
    decide(
      'ask',
      `src/core/ の実装を変更しているが、このコミットにテストが1つも入っていない。\n` +
        `  対象: ${coreImpl.join(', ')}\n` +
        `CLAUDE.md は core について「テストを同じコミットに必ず含める」と定めている。` +
        `テストを追加してから commit し直すか、含めない理由があるならこのまま進める。`,
    );
  }

  pass();
}

main();
