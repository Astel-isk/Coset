import type { Stage } from '../stages/types';
import { useIdleTimeout } from './useIdleTimeout';

/** 解説画面で無操作が続いたら待機へ戻すまでの時間 */
const IDLE_MS = 2 * 60 * 1000;

interface NotesScreenProps {
  readonly stage: Stage;
  readonly onBack: () => void;
  readonly onRestart: () => void;
}

/** 「もっと知る」の解説画面。カード 4 枚を机の上の板として並べる。無操作 2 分で待機へ戻る */
export function NotesScreen({ stage, onBack, onRestart }: NotesScreenProps) {
  useIdleTimeout(IDLE_MS, onRestart);

  return (
    <main className="screen notes">
      <header className="notes-head">
        <h1 className="notes-title">もっと知る</h1>
        <button type="button" className="secondary" onClick={onBack}>
          戻る
        </button>
      </header>
      <div className="notes-grid">
        {stage.notes.map((card, i) => (
          <section key={card.title} className="note">
            <p className="note-no">{i + 1}</p>
            <h2 className="note-title">{card.title}</h2>
            <p className="note-body">{card.body}</p>
            {card.figure ? (
              <pre className="note-figure" aria-label={`${card.title}の図`}>
                {card.figure.join('\n')}
              </pre>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
