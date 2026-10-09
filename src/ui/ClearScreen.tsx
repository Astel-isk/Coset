import type { Puzzle, Stage } from '../stages/types';
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

/** クリア画面。解読した平文・和訳・試した鍵の数と、教訓を見せる */
export function ClearScreen({ stage, puzzle, tried, total, onRestart }: ClearScreenProps) {
  useIdleTimeout(IDLE_MS, onRestart);

  return (
    <main className="screen clear">
      <h1 className="clear-title">解読成功</h1>
      <p className="clear-plain">{puzzle.plaintext}</p>
      <p className="clear-translation">{puzzle.translation}</p>
      <p className="clear-count">
        {total} 通りのうち <strong>{tried}</strong> 通り試して破った
      </p>
      <section className="debrief">
        <p className="lesson">{stage.debrief.lesson}</p>
        <p>{stage.debrief.contrast}</p>
        <p>{stage.debrief.closing}</p>
      </section>
      <button type="button" className="primary" onClick={onRestart}>
        最初から
      </button>
    </main>
  );
}
