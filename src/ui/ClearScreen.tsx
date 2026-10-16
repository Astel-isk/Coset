import { useCompactLayout } from '../layout';
import type { Game } from './game';
import { fillPlaceholders } from './logic';
import { paperHead } from './record';
import { useIdleTimeout } from './useIdleTimeout';

/** クリア画面で無操作が続いたら待機へ戻すまでの時間 */
const IDLE_MS = 60 * 1000;

interface ClearScreenProps {
  readonly game: Game;
  readonly tried: number;
  readonly total: number;
  /** 「もっと知る」から戻ってきたか。戻ったときは判子を押し直さない */
  readonly revisited: boolean;
  /** 次のステージへ進む主ボタンの文言（例: 次の暗号に挑む、最後の暗号に挑む）。次のステージがなければ undefined で、「次の人へ」が主ボタンになる */
  readonly nextLabel?: string;
  /** 次のステージへ進む主ボタン。次のステージの傍受演出へ進む */
  readonly onNext: () => void;
  /** 「もっと知る」を開く */
  readonly onMore: () => void;
  readonly onRestart: () => void;
}

/** クリア画面。左に解読した電文（判子つき）、右に試した鍵の数と強い暗号との対比を見せる */
export function ClearScreen({ game, tried, total, revisited, nextLabel, onNext, onMore, onRestart }: ClearScreenProps) {
  // スマホ版は自分の端末で遊ぶので、自動では戻さない。「次の人へ」は「もう一度遊ぶ」にする
  const compact = useCompactLayout();
  useIdleTimeout(IDLE_MS, onRestart, !compact);
  const restartLabel = compact ? 'もう一度遊ぶ' : '次の人へ';
  const { stage, puzzle, record } = game;
  const { debrief } = stage;
  const values = { total: String(total) };

  return (
    <main className="screen clear">
      <section className="paper clear-paper" aria-label="解読した電文">
        <p className="paper-head">{paperHead(record)}</p>
        <p className="clear-plain">{puzzle.plaintext}</p>
        <p className="clear-translation">{puzzle.translation}</p>
        <p className={revisited ? 'stamp stamped' : 'stamp'} aria-hidden="true">
          解読
        </p>
      </section>
      <section className="clear-result">
        <p className="clear-count-sub">{fillPlaceholders(debrief.lead, values)}</p>
        <p className="clear-count">
          <strong>{tried}</strong> {debrief.countSuffix}
        </p>
        <dl className="versus">
          {debrief.rows.map((row) => (
            <div key={row.label} className="versus-row">
              <dt>{row.label}</dt>
              <dd className="mono wrap">
                {fillPlaceholders(row.value, values)} <span className="nowrap">{row.unit}</span>
              </dd>
              {row.note ? <dd className="duration">{row.note}</dd> : null}
            </div>
          ))}
        </dl>
        <p className="closing">{debrief.closing}</p>
        <div className="clear-actions">
          {nextLabel !== undefined ? (
            <>
              <button type="button" className="primary" onClick={onNext}>
                {nextLabel}
              </button>
              <button type="button" className="secondary" onClick={onRestart}>
                {restartLabel}
              </button>
            </>
          ) : (
            <button type="button" className="primary" onClick={onRestart}>
              {restartLabel}
            </button>
          )}
          <button type="button" className="secondary" onClick={onMore}>
            もっと知る
          </button>
        </div>
      </section>
    </main>
  );
}
