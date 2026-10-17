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
  /** 解説画面の「結果に戻る」から戻ってきたか。戻ったときは判子を押し直さない */
  readonly revisited: boolean;
  /** 「解説を読む」。解説画面（もっと知る）へ進む。次の操作は解説画面に置く（全員に解説を見せるため） */
  readonly onNotes: () => void;
  /** 無操作が続いたときに待機へ戻す */
  readonly onRestart: () => void;
}

/**
 * クリア画面。左に解読した電文（判子つき）、右に試した鍵の数と強い暗号との対比を見せる。
 * ボタンは「解説を読む」だけ。次のステージへ進むか・次の人へ渡すかは解説画面で選ぶ
 */
export function ClearScreen({ game, tried, total, revisited, onNotes, onRestart }: ClearScreenProps) {
  // スマホ版は自分の端末で遊ぶので、自動では戻さない
  const compact = useCompactLayout();
  useIdleTimeout(IDLE_MS, onRestart, !compact);
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
          <button type="button" className="primary" onClick={onNotes}>
            解説を読む
          </button>
        </div>
      </section>
    </main>
  );
}
