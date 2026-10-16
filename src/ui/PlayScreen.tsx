import { useCallback, useState } from 'react';
import { useCompactLayout } from '../layout';
import { ToolHost } from '../tools/ToolHost';
import type { Game } from './game';
import { fillPlaceholders, foldedHintLabel, hintState, isCorrect } from './logic';
import { paperHead } from './record';
import { useConfirmPress } from './useConfirmPress';
import { useIdleTimeout } from './useIdleTimeout';

/** 開いたヒントのカードの幅（flex-grow）。文字数に比例させるが、短いカードが細くなりすぎないよう下駄を履かせる */
const HINT_GROW_PAD = 14;
const hintGrow = (label: string, body: string): number => label.length + body.length + HINT_GROW_PAD;

/** 解読画面で無操作が続いたら待機へ戻すまでの時間 */
const IDLE_MS = 3 * 60 * 1000;

interface PlayScreenProps {
  readonly game: Game;
  /** 正解したとき。試した鍵の数と鍵の総数を渡す */
  readonly onSolved: (tried: number, total: number) => void;
  readonly onRestart: () => void;
}

/**
 * 「最初から」。押し間違えると進行が消えるため 2 回押しにする（1 回目で表示が変わり、3 秒以内にもう一度押すと戻る。
 * キーボードの Enter / Space でも同じ。EXHIBITION.md「画面の整理」）。
 * 文言が変わっても幅が動かないよう、ボタンの幅は長い方の文言に合わせて固定する（CSS の min-width）
 */
function RestartButton({ onRestart }: { readonly onRestart: () => void }) {
  const { armed, press } = useConfirmPress(onRestart);
  return (
    <button type="button" className={armed ? 'secondary restart armed' : 'secondary restart'} data-armed={armed} onClick={press}>
      {armed ? 'もう一度押すとやり直す' : '最初から'}
    </button>
  );
}

/** 解読画面。ツール（時計盤）が返す候補平文を、「これで解読」で判定する */
export function PlayScreen({ game, onSolved, onRestart }: PlayScreenProps) {
  const { stage, puzzle, record } = game;
  // ステージ共通の与件と、出題ごとの与件（最初の単語など）
  const givens = [...stage.givens, ...puzzle.givens];
  const [candidate, setCandidate] = useState('');
  const [attempts, setAttempts] = useState({ tried: 0, total: 0 });
  const [openedHints, setOpenedHints] = useState(0);
  const [failed, setFailed] = useState(false);

  // スマホ版は自分の端末で遊ぶので、自動では戻さない
  const compact = useCompactLayout();
  useIdleTimeout(IDLE_MS, onRestart, !compact);

  const handleCandidate = useCallback((plaintext: string) => {
    setCandidate(plaintext);
    setFailed(false);
  }, []);
  const handleAttempts = useCallback((tried: number, total: number) => {
    setAttempts({ tried, total });
  }, []);

  const submit = () => {
    if (isCorrect(candidate, puzzle.plaintext, stage.clear.normalize)) {
      onSolved(attempts.tried, attempts.total);
    } else {
      setFailed(true);
    }
  };

  // 主ボタンと不正解の表示。ツールが電文の直後に差し込む（電文の位置はツールだけが知っている）
  const actions = (
    <div className="play-actions">
      <p className="feedback" role="status">
        {failed ? 'まだ意味の通る文になっていないようだ' : ''}
      </p>
      <button type="button" className="primary" onClick={submit}>
        これで解読
      </button>
    </div>
  );

  return (
    <main className="screen play" data-tool={stage.tools[0]?.id}>
      <header className="play-head">
        <p className="record">
          傍受記録 {record.no} ・ {stage.title}
        </p>
        <RestartButton onRestart={onRestart} />
      </header>

      <p className="flavor">{stage.flavor}</p>

      {stage.tools.map((mount) => (
        <ToolHost
          key={mount.id}
          mount={mount}
          ciphertext={puzzle.ciphertext}
          heading={paperHead(record)}
          givens={givens}
          onCandidate={handleCandidate}
          onAttempts={handleAttempts}
          actions={actions}
        />
      ))}

      {givens.length > 0 ? (
        <dl className="givens" aria-label="与件">
          {givens.map((given) => (
            <div key={given.label} className="given">
              <dt>{given.label}</dt>
              <dd>
                <span className="mono">{given.value}</span>
                {given.suffix ? ` ${given.suffix}` : ''}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <section className="hints" aria-label="ヒント">
        {stage.hints.map((hint, i) => {
          const state = hintState(i, openedHints);
          if (state === 'opened') {
            const body = fillPlaceholders(hint.body, puzzle.hintValues);
            // 開いたカードの幅は文の長さに比例させる（長い文のカードを広くして、並べたときの高さをそろえる）
            return (
              <div key={hint.label} className="hint opened" style={{ flexGrow: hintGrow(hint.label, body) }}>
                <span className="hint-label">{hint.label}</span>
                <span className="hint-body">{body}</span>
              </div>
            );
          }
          if (state === 'ready') {
            return (
              <button key={hint.label} type="button" className="hint ready" onClick={() => setOpenedHints(i + 1)}>
                {foldedHintLabel(hint.label, state)}
              </button>
            );
          }
          return (
            <div key={hint.label} className="hint locked" aria-disabled="true">
              {foldedHintLabel(hint.label, state)}
            </div>
          );
        })}
      </section>
    </main>
  );
}
