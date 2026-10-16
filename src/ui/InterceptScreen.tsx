import { useCallback, useEffect, useRef, useState } from 'react';
import { useCompactLayout } from '../layout';
import { DONE_HOLD_MS, REDUCED_HOLD_MS, SKIP_GRACE_MS, typingInterval } from './intercept';
import type { InterceptRecord } from './record';
import { prefersReducedMotion } from './useReducedMotion';

interface InterceptScreenProps {
  readonly record: InterceptRecord;
  /** 打ち出す暗号文。出題（Puzzle）のものをそのまま受け取る。暗号方式は知らない */
  readonly ciphertext: string;
  /** 見出しの状態表示（例: 受信中。ステージ 2 の前は「新たな電文を傍受」） */
  readonly headline: string;
  /** 演出が終わったとき、または飛ばしたとき。解読画面へ進む */
  readonly onDone: () => void;
}

/**
 * 傍受演出。暗号文を電文の紙へ 1 文字ずつ打ち出し、「受信完了」の後で解読画面へ進む（EXHIBITION.md「傍受演出」）。
 * クリック・Enter・Space で飛ばせる。prefers-reduced-motion では全文を出してすぐ（約 0.8 秒で）切り替える。
 */
export function InterceptScreen({ record, ciphertext, headline, onDone }: InterceptScreenProps) {
  const compact = useCompactLayout();
  const [reduced] = useState(prefersReducedMotion);
  const length = ciphertext.length;
  const [count, setCount] = useState(reduced ? length : 0);
  const done = count >= length;

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // 1 文字ずつ打ち出す
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setCount((c) => Math.min(length, c + 1)), typingInterval(length));
    return () => window.clearInterval(id);
  }, [done, length]);

  // 打ち終わったら少し待って解読画面へ
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => onDoneRef.current(), reduced ? REDUCED_HOLD_MS : DONE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [done, reduced]);

  // 飛ばす操作。待機画面からのクリック・Enter が続けて効かないよう、開始直後は受け付けない
  const [openedAt] = useState(() => performance.now());
  const skip = useCallback(() => {
    if (performance.now() - openedAt < SKIP_GRACE_MS) return;
    onDoneRef.current();
  }, [openedAt]);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [skip]);

  return (
    <main className="screen intercept" onClick={skip}>
      <header className="intercept-head">
        <p className="record">
          傍受記録 {record.no} ・ {headline}
        </p>
        <p className="record">傍受時刻 {record.time}</p>
      </header>
      <section className="paper intercept-paper" aria-label="傍受した電文">
        {/* 打ち出し前の文字も見えない状態で並べ、紙の大きさと折り返しが途中で変わらないようにする */}
        <p className="intercept-text" aria-label={ciphertext}>
          <span aria-hidden="true">{ciphertext.slice(0, count)}</span>
          <span aria-hidden="true" className="intercept-rest">
            {ciphertext.slice(count)}
          </span>
        </p>
      </section>
      <p className="intercept-status" role="status">
        {done ? '受信完了' : ''}
      </p>
      <p className="intercept-skip">{compact ? 'タップで先へ進む' : 'クリックか Enter で先へ進む'}</p>
    </main>
  );
}
