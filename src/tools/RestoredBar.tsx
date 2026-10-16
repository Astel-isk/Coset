import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { barVisible } from './barText';
import type { BarSegment } from './barText';

/**
 * 戻した文の帯（スマホ版だけ。呼び出し側が compact のときにだけ描く。EXHIBITION.md「スマホ版」）。
 *
 * 縦に長いスマホ版では、円盤を回している間は電文が画面の上へ流れて見えなくなる。そのあいだも今の鍵で戻した文が読めるよう、
 * 電文の紙（paperRef）を IntersectionObserver で監視し、紙が上へ流れて見えなくなったら画面の上端に固定して出す。
 * 紙が見えている間は出さない（紙と二重に出さない）。出し入れは短いフェードで、動きを減らす設定では切り替えだけ（CSS）。
 * 帯は操作を妨げない（pointer-events: none。円盤・ボタンへのタップは下へ通る）。出ていないあいだは読み上げにも出さない。
 * 正解を知らない。渡された文を並べるだけ。
 */
export function RestoredBar({
  paperRef,
  segments,
}: {
  /** 監視する電文の紙 */
  readonly paperRef: RefObject<HTMLElement | null>;
  readonly segments: readonly BarSegment[];
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const observer = new IntersectionObserver((entries) => {
      // 同じ回に複数の記録が来たときは最後（いちばん新しい）の状態に合わせる
      const entry = entries[entries.length - 1];
      if (entry) setShown(barVisible(entry.isIntersecting, entry.boundingClientRect.top));
    });
    observer.observe(paper);
    return () => observer.disconnect();
  }, [paperRef]);

  return (
    <div
      className={shown ? 'restored-bar on' : 'restored-bar'}
      data-testid="restored-bar"
      aria-hidden={!shown}
    >
      <p className="restored-bar-label">今の鍵で戻した文</p>
      <p className="restored-bar-text" data-testid="restored-bar-text">
        {segments.map((seg, i) => (
          <span key={i} className={seg.dim ? 'bar-dim' : undefined}>
            {seg.text}
          </span>
        ))}
      </p>
    </div>
  );
}
