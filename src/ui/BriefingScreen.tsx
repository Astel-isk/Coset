import { useCallback, useEffect, useRef, useState } from 'react';
import { useCompactLayout } from '../layout';
import type { Stage } from '../stages/types';
import { BRIEFING_IDLE_MS, canAdvance } from './briefing';
import { BriefingPaper } from './BriefingPaper';
import type { InterceptRecord } from './record';
import { useIdleTimeout } from './useIdleTimeout';
import { prefersReducedMotion } from './useReducedMotion';

interface BriefingScreenProps {
  readonly stage: Stage;
  readonly record: InterceptRecord;
  /** 「解読にかかる」・Enter・Space で解読画面へ進む */
  readonly onDone: () => void;
  /** PC 版で 3 分間操作がなければ待機へ戻す */
  readonly onRestart: () => void;
}

/**
 * ステージ前の説明の画面（EXHIBITION.md「ステージ前の説明」）。傍受演出と同じ机の上に紙を 1 枚置く。
 * 進めるのは朱のボタンと Enter / Space だけ。画面のどこをクリックしても進む形にはしない
 * （傍受演出を連打した来場者が読まずに通り過ぎるのを防ぐため）。開いてから 0.6 秒は、ボタンもキーも受け付けない。
 * 例の行は prefers-reduced-motion では最初から全部出す。スマホ版では無操作で戻さない。
 */
export function BriefingScreen({ stage, record, onDone, onRestart }: BriefingScreenProps) {
  const compact = useCompactLayout();
  useIdleTimeout(BRIEFING_IDLE_MS, onRestart, !compact);
  const [reduced] = useState(prefersReducedMotion);

  const [openedAt] = useState(() => performance.now());
  const advanced = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // ボタンの click と window の keydown が同じ押下で重なっても、1 回しか進めない
  const advance = useCallback(() => {
    if (advanced.current) return;
    if (!canAdvance(performance.now() - openedAt)) return;
    advanced.current = true;
    onDoneRef.current();
  }, [openedAt]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance]);

  return (
    <main className="screen briefing" data-testid="briefing-screen">
      <header className="briefing-head">
        <p className="record">傍受記録 {record.no} ・ 解読の手引き</p>
      </header>
      <BriefingPaper stage={stage} animate={!reduced} />
      <div className="briefing-actions">
        <button type="button" className="primary" onClick={advance}>
          解読にかかる
        </button>
      </div>
    </main>
  );
}
