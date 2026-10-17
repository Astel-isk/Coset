import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { HOLD_MS, IDLE, pressDown, pressEnd, pressHold, pressMove } from './longPress';
import type { PressState } from './longPress';

/** つまんだ瞬間の振動（ミリ秒）。振動に対応していない端末（iPhone など）では何も起きない */
const VIBRATE_MS = 15;

/** ドラッグの始まりに渡す情報 */
export interface GripStart<T> {
  /** 円盤の要素（中心の求め方と setPointerCapture に使う） */
  readonly el: HTMLElement;
  readonly pointerId: number;
  readonly x: number;
  readonly y: number;
  /** bind に渡した目印（ステージ 2 の円盤の番号など） */
  readonly tag: T;
}

interface GripGateOptions<T> {
  /** 長押しの判定を使うか（スマホ版 = true）。false なら、どの入力もすぐドラッグを始める */
  readonly enabled: boolean;
  /** ドラッグを始める。enabled のタッチでは、つまんだ瞬間に呼ぶ */
  readonly onStart: (info: GripStart<T>) => void;
  readonly onMove: (el: HTMLElement, x: number, y: number) => void;
  readonly onEnd: () => void;
}

/**
 * 円盤のドラッグの入り口。スマホ版のタッチだけ、長押しでつまむまでドラッグを始めない（longPress.ts の判定）。
 * マウス・ペンと、スマホ版でない画面のタッチは、今までどおり押してすぐドラッグを始める。どちらも、つまんでいる間は held が true になる
 * （内側の輪の縁とつまみを明るくする合図。2026 年 10 月 17 日に PC 版にも広げた）。
 *
 * つまんでいる間はページをスクロールさせない。touch-action（スマホ版は pan-y）だけでは、スクロールが始まった後に止められないため、
 * window に非 passive の touchmove を付け、つまんでいる間だけ preventDefault する。指を動かさないうちにつまむ設計なので、
 * 最初の touchmove でスクロールの始まりを止められる。
 * 長押しで文字選択やメニューが出ないよう、enabled のとき contextmenu も止める。
 */
export function useGripGate<T>({ enabled, onStart, onMove, onEnd }: GripGateOptions<T>) {
  const [held, setHeld] = useState(false);
  const stateRef = useRef<PressState>(IDLE);
  const timerRef = useRef<number | null>(null);
  const lastRef = useRef<GripStart<T> | null>(null);
  const handlers = useRef({ onStart, onMove, onEnd });
  useEffect(() => {
    handlers.current = { onStart, onMove, onEnd };
  }, [onStart, onMove, onEnd]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pinch = useCallback(() => {
    clearTimer();
    const last = lastRef.current;
    if (!last) return;
    setHeld(true);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(VIBRATE_MS);
    handlers.current.onStart(last);
  }, [clearTimer]);

  const finish = useCallback(() => {
    clearTimer();
    stateRef.current = pressEnd();
    lastRef.current = null;
    setHeld(false);
    handlers.current.onEnd();
  }, [clearTimer]);

  // つまんでいる間だけ、ページのスクロールを止める
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (stateRef.current.phase === 'pinched' && e.cancelable) e.preventDefault();
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => window.removeEventListener('touchmove', onTouchMove);
  }, []);

  // 画面が外れるとき（ステージの切り替えなど）にタイマーを残さない
  useEffect(() => clearTimer, [clearTimer]);

  const bind = (tag: T) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      const info: GripStart<T> = { el: e.currentTarget, pointerId: e.pointerId, x: e.clientX, y: e.clientY, tag };
      lastRef.current = info;
      if (enabled && e.pointerType === 'touch') {
        stateRef.current = pressDown(e.clientX, e.clientY, performance.now());
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          stateRef.current = pressHold(stateRef.current);
          if (stateRef.current.phase === 'pinched') pinch();
        }, HOLD_MS);
      } else {
        // マウス・ペン（PC 版）はすぐつまむ。つまんでいる間の明るい縁はスマホ版と同じに出す（振動はしない）
        stateRef.current = IDLE;
        setHeld(true);
        handlers.current.onStart(info);
      }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const last = lastRef.current;
      if (last) lastRef.current = { ...last, x: e.clientX, y: e.clientY };
      const before = stateRef.current;
      if (before.phase === 'pending') {
        const next = pressMove(before, e.clientX, e.clientY, performance.now());
        stateRef.current = next;
        if (next.phase === 'scroll') clearTimer();
        else if (next.phase === 'pinched') pinch();
        return;
      }
      if (before.phase === 'scroll') return;
      handlers.current.onMove(e.currentTarget, e.clientX, e.clientY);
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onContextMenu: (e: { preventDefault: () => void }) => {
      if (enabled) e.preventDefault();
    },
  });

  return { held, bind };
}
