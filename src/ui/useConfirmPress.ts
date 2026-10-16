import { useEffect, useState } from 'react';
import { CONFIRM_MS, pressConfirm, remainingMs } from './confirm';
import type { ArmedAt } from './confirm';

/**
 * 2 回押しで確定するボタンの状態（「最初から」。EXHIBITION.md「画面の整理」）。
 * 1 回目で armed が true になり、ms 以内にもう一度 press すると onConfirm を呼ぶ。ms がたつと armed は false に戻る。
 * 状態遷移は confirm.ts の純粋関数。ここは時計とタイマーをつなぐだけ。
 */
export function useConfirmPress(onConfirm: () => void, ms: number = CONFIRM_MS): { readonly armed: boolean; readonly press: () => void } {
  const [armedAt, setArmedAt] = useState<ArmedAt>(null);

  // 待ち受けにしたら、残り時間のあとに表示を元へ戻す
  useEffect(() => {
    if (armedAt === null) return;
    const id = window.setTimeout(() => setArmedAt(null), remainingMs(armedAt, Date.now(), ms));
    return () => window.clearTimeout(id);
  }, [armedAt, ms]);

  const press = () => {
    const { next, confirmed } = pressConfirm(armedAt, Date.now(), ms);
    setArmedAt(next);
    if (confirmed) onConfirm();
  };

  return { armed: armedAt !== null, press };
}
