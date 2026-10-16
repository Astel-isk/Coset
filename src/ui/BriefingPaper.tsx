import { useEffect, useState } from 'react';
import type { Stage } from '../stages/types';
import { BRIEFING_CLOSING, diskMark, lineTotal, revealedLines, STEP_INTERVAL_MS } from './briefing';

interface BriefingPaperProps {
  readonly stage: Stage;
  /** 例の行を 1 行ずつ出すか。false なら最初から全部出す（動きを減らす設定・見直しの重ね表示） */
  readonly animate: boolean;
  /** ステージ名の要素の id（ダイアログの aria-labelledby から指す） */
  readonly titleId?: string;
}

/**
 * ステージ前の説明の紙（EXHIBITION.md「ステージ前の説明」）。
 * ステージ名・規則・例の見出し・例の行・まとめ・共通の締めを上から並べる。
 * stage.briefing の文字列を並べて描くだけで、計算はしない（暗号方式を知らない）。
 * 出ていない行も見えない状態で場所を取り、紙の大きさが途中で変わらないようにする。
 */
export function BriefingPaper({ stage, animate, titleId }: BriefingPaperProps) {
  const { briefing } = stage;
  const total = lineTotal(briefing.steps.length);
  const [tick, setTick] = useState(0);

  // 約 0.5 秒おきに 1 行ずつ出す。全行が出たら止める
  useEffect(() => {
    if (!animate) return;
    const id = window.setInterval(() => setTick((t) => t + 1), STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [animate]);
  const shown = revealedLines(tick, total, animate);
  const hasDisk = briefing.steps.some((step) => step.disk !== undefined);

  return (
    <section className="paper briefing-paper" aria-labelledby={titleId} data-testid="briefing-paper">
      <h2 className="briefing-title" id={titleId}>
        {stage.title}
      </h2>
      <p className="briefing-rule">{briefing.rule}</p>
      <p className="briefing-example-title">{briefing.exampleTitle}</p>
      <ol className={hasDisk ? 'briefing-steps has-disk' : 'briefing-steps'}>
        {briefing.steps.map((step, i) => (
          <li key={i} className={i < shown ? 'briefing-step on' : 'briefing-step'}>
            {hasDisk ? (
              <span className={`briefing-disk disk-${step.disk ?? 0}`}>{diskMark(step.disk ?? 0)}</span>
            ) : null}
            <span className="briefing-plain">{step.plain}</span>
            <span className="briefing-formula">{step.formula}</span>
            <span className="briefing-arrow" aria-hidden="true">
              →
            </span>
            <span className="briefing-cipher">{step.cipher}</span>
          </li>
        ))}
      </ol>
      <p className={briefing.steps.length < shown ? 'briefing-summary on' : 'briefing-summary'}>
        {briefing.summary}
      </p>
      <p className="briefing-closing">{BRIEFING_CLOSING}</p>
    </section>
  );
}
