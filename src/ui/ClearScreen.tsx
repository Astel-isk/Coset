import type { Puzzle, Stage } from '../stages/types';
import { PAPER_HEAD } from './record';
import { useIdleTimeout } from './useIdleTimeout';

/** クリア画面で無操作が続いたら待機へ戻すまでの時間 */
const IDLE_MS = 60 * 1000;

interface ClearScreenProps {
  readonly stage: Stage;
  readonly puzzle: Puzzle;
  readonly tried: number;
  readonly total: number;
  readonly onRestart: () => void;
}

/** クリア画面。左に解読した電文（判子つき）、右に試した鍵の数と強い暗号との対比を見せる */
export function ClearScreen({ stage, puzzle, tried, total, onRestart }: ClearScreenProps) {
  useIdleTimeout(IDLE_MS, onRestart);
  const { debrief } = stage;

  return (
    <main className="screen clear">
      <section className="paper clear-paper" aria-label="解読した電文">
        <p className="paper-head">{PAPER_HEAD}</p>
        <p className="clear-plain">{puzzle.plaintext}</p>
        <p className="clear-translation">{puzzle.translation}</p>
        <p className="stamp" aria-hidden="true">
          解読
        </p>
      </section>
      <section className="clear-result">
        <p className="clear-count-sub">{total} 通りのうち</p>
        <p className="clear-count">
          <strong>{tried}</strong> 通りで破った
        </p>
        <dl className="versus">
          <div className="versus-row">
            <dt>{stage.title}の鍵</dt>
            <dd className="mono">{total} 通り</dd>
          </div>
          <div className="versus-row">
            <dt>{debrief.rivalName}の鍵</dt>
            <dd className="mono wrap">
              {debrief.rivalKeys} <span className="nowrap">通り</span>
            </dd>
            <dd className="duration">{debrief.rivalDuration}</dd>
          </div>
        </dl>
        <p className="closing">{debrief.closing}</p>
        <button type="button" className="primary" onClick={onRestart}>
          次の人へ
        </button>
      </section>
    </main>
  );
}
