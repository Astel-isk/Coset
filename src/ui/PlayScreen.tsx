import { useCallback, useState } from 'react';
import { ToolHost } from '../tools/ToolHost';
import type { Game } from './game';
import { fillPlaceholders, isCorrect } from './logic';
import { paperHead } from './record';
import { useIdleTimeout } from './useIdleTimeout';

/** 解読画面で無操作が続いたら待機へ戻すまでの時間 */
const IDLE_MS = 3 * 60 * 1000;

interface PlayScreenProps {
  readonly game: Game;
  /** 正解したとき。試した鍵の数と鍵の総数を渡す */
  readonly onSolved: (tried: number, total: number) => void;
  readonly onRestart: () => void;
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
    <main className="screen play" data-tool={stage.tools[0]?.id}>
      <header className="play-head">
        <p className="record">
          傍受記録 {record.no} ・ {stage.title}
        </p>
        <button type="button" className="secondary" onClick={onRestart}>
          最初から
        </button>
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
          if (i < openedHints) {
            return (
              <div key={hint.label} className="hint opened">
                <p className="hint-label">{hint.label}</p>
                <p className="hint-body">{fillPlaceholders(hint.body, puzzle.hintValues)}</p>
              </div>
            );
          }
          if (i === openedHints) {
            return (
              <button key={hint.label} type="button" className="hint ready" onClick={() => setOpenedHints(i + 1)}>
                <span className="hint-label">{hint.label}</span>
                <span className="hint-body">クリックで開く</span>
              </button>
            );
          }
          return (
            <div key={hint.label} className="hint locked" aria-disabled="true">
              <p className="hint-label">{hint.label}</p>
              <p className="hint-body">前を開くと読める</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
