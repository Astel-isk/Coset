import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel'] as const;

/**
 * 無操作が ms ミリ秒続いたら onTimeout を呼ぶ（展示で次の来場者のために待機へ戻すため）。
 * マウス・キーボード・ホイールの操作で時間を数え直す。
 */
export function useIdleTimeout(ms: number, onTimeout: () => void): void {
  const callbackRef = useRef(onTimeout);
  useEffect(() => {
    callbackRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    let timer = window.setTimeout(() => callbackRef.current(), ms);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callbackRef.current(), ms);
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, reset);
    return () => {
      window.clearTimeout(timer);
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, reset);
    };
  }, [ms]);
}
