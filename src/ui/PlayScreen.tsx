import { useCallback, useState } from 'react';
import type { Puzzle, Stage } from '../stages/types';
import { ToolHost } from '../tools/ToolHost';
import { fillHint, isCorrect } from './logic';
import { useIdleTimeout } from './useIdleTimeout';

/** 解読画面で無操作が続いたら待機へ戻すまでの時間 */
const IDLE_MS = 3 * 60 * 1000;

interface PlayScreenProps {
  readonly stage: Stage;
  readonly puzzle: Puzzle;
  /** 正解したとき。試した鍵の数と鍵の総数を渡す */
  readonly onSolved: (tried: number, total: number) => void;
  readonly onRestart: () => void;
}

/** 解読画面。ツール（時計盤）が返す候補平文を、「これで解読」で判定する */
export function PlayScreen({ stage, puzzle, onSolved, onRestart }: PlayScreenProps) {
  const [candidate, setCandidate] = useState('');
  const [attempts, setAttempts] = useState({ tried: 0, total: 0 });
  const [openedHints, setOpenedHints] = useState(0);
  const [failed, setFailed] = useState(false);

  useIdleTimeout(IDLE_MS, onRestart);

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

  return (
    <main className="screen play">
      <header className="play-head">
        <div>
          <p className="stage-title">{stage.title}</p>
          <p className="flavor">{stage.flavor}</p>
        </div>
        <button type="button" className="secondary" onClick={onRestart}>
          最初から
        </button>
      </header>

      {stage.tools.map((mount) => (
        <ToolHost
          key={mount.id}
          mount={mount}
          ciphertext={puzzle.ciphertext}
          onCandidate={handleCandidate}
          onAttempts={handleAttempts}
        />
      ))}

      <div className="play-actions">
        <button type="button" className="primary" onClick={submit}>
          これで解読
        </button>
        <p className="feedback" role="status">
          {failed ? 'まだ意味の通る文になっていないようだ' : ''}
        </p>
      </div>

      <section className="hints" aria-label="ヒント">
        {stage.hints.map((hint, i) => {
          const label = `ヒント ${i + 1}`;
          if (i < openedHints) {
            return (
              <p key={label} className="hint opened">
                <span className="hint-label">{label}</span>
                {fillHint(hint.body, puzzle.keyLabel)}
              </p>
            );
          }
          if (i === openedHints) {
            return (
              <button key={label} type="button" className="hint ready" onClick={() => setOpenedHints(i + 1)}>
                {label}を見る
              </button>
            );
          }
          return (
            <p key={label} className="hint locked">
              {label}（前のヒントを見ると開く）
            </p>
          );
        })}
      </section>
    </main>
  );
}
