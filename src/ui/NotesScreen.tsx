import { useCompactLayout } from '../layout';
import type { Stage } from '../stages/types';
import { useIdleTimeout } from './useIdleTimeout';

/** 解説画面で無操作が続いたら待機へ戻すまでの時間 */
const IDLE_MS = 2 * 60 * 1000;

interface NotesScreenProps {
  readonly stage: Stage;
  /** 次のステージへ進む主ボタンの文言（例: 次の暗号に挑む、最後の暗号に挑む）。次のステージがなければ undefined で、「次の人へ」が主ボタンになる */
  readonly nextLabel?: string;
  /** 次のステージへ進む主ボタン。次のステージの傍受演出へ進む */
  readonly onNext: () => void;
  /** 「結果に戻る」。クリア画面へ戻る */
  readonly onBack: () => void;
  /** 「次の人へ」（スマホ版は「もう一度遊ぶ」）と、無操作が続いたとき。待機へ戻る */
  readonly onRestart: () => void;
}

/**
 * 解説画面（もっと知る）。クリア画面の次に必ず通す（できるだけ多くの来場者に見せるため。EXHIBITION.md「もっと知る」）。
 * カード 4 枚を机の上の板として並べ、その下に次の操作（次のステージへ進む主ボタンと「次の人へ」）を置く。無操作 2 分で待機へ戻る
 */
export function NotesScreen({ stage, nextLabel, onNext, onBack, onRestart }: NotesScreenProps) {
  // スマホ版は自分の端末で遊ぶので、自動では戻さない。「次の人へ」は「もう一度遊ぶ」にする
  const compact = useCompactLayout();
  useIdleTimeout(IDLE_MS, onRestart, !compact);
  const restartLabel = compact ? 'もう一度遊ぶ' : '次の人へ';

  return (
    <main className="screen notes">
      <header className="notes-head">
        <h1 className="notes-title">この暗号の話</h1>
        <button type="button" className="secondary" onClick={onBack}>
          結果に戻る
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
      <div className="clear-actions notes-actions">
        {nextLabel !== undefined ? (
          <>
            <button type="button" className="secondary" onClick={onRestart}>
              {restartLabel}
            </button>
            <button type="button" className="primary" onClick={onNext}>
              {nextLabel}
            </button>
          </>
        ) : (
          <button type="button" className="primary" onClick={onRestart}>
            {restartLabel}
          </button>
        )}
      </div>
    </main>
  );
}
