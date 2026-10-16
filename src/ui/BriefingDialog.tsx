import { useEffect, useRef } from 'react';
import type { Stage } from '../stages/types';
import { BriefingPaper } from './BriefingPaper';

interface BriefingDialogProps {
  readonly stage: Stage;
  readonly onClose: () => void;
}

const TITLE_ID = 'briefing-dialog-title';

/**
 * 解読画面の上に重ねる「暗号の規則」のダイアログ（EXHIBITION.md「ステージ前の説明」の見直し）。
 * 同じ紙を、例の行を全部出した状態で見せる。「閉じる」ボタン・Esc・紙の外のクリックで閉じる。
 * 解読画面の状態（円盤・試した鍵・開いたヒント）を保つため、呼び出し側は解読画面をマウントしたままこれを重ねる。
 *
 * 開いている間は、キー入力を解読画面のツール（window の keydown で ← → や 1・2・3 を拾う）へ届かせない。
 * window の捕捉段階で止めるので、ツールの実装を知らなくてよい。閉じるボタンが唯一の操作対象なので、Tab もその上にとどめる。
 * 開いたら「閉じる」へフォーカスを移し、閉じたら開いたボタンへ戻す。
 */
export function BriefingDialog({ stage, onClose }: BriefingDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      // 捕捉段階で止めて、解読画面のツールへ届かせない（既定の動作は止めない。Enter / Space は閉じるボタンの click になる）
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      opener?.focus();
    };
  }, []);

  return (
    <div
      className="briefing-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      data-testid="briefing-dialog"
      onClick={(e) => {
        // 紙とボタンの外（背景）のクリックだけ閉じる
        if (e.target instanceof Element && !e.target.closest('.briefing-paper, button')) onClose();
      }}
    >
      <div className="briefing-dialog">
        <BriefingPaper stage={stage} animate={false} titleId={TITLE_ID} />
        <div className="briefing-actions">
          <button type="button" className="secondary" ref={closeRef} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
