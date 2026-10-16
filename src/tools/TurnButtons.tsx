/** 曲がった矢印（時計回りは ↻、反時計回りは ↺）。円弧と矢じりを SVG で描く（アイコンフォント・外部画像は使わない） */
function TurnArrow({ clockwise }: { readonly clockwise: boolean }) {
  return (
    <svg className="turn-arrow" viewBox="0 0 32 28" width="32" height="28" aria-hidden="true" focusable="false">
      <g transform={clockwise ? undefined : 'translate(32 0) scale(-1 1)'}>
        <path className="turn-arc" d="M 7.54 17.08 A 9 9 0 1 1 21.79 20.89" />
        <path className="turn-head" d="M 17.58 24.43 L 24.62 24.26 L 18.96 17.52 Z" />
      </g>
    </svg>
  );
}

/**
 * 回転ボタン（円盤の上半分の左右に置く）。左が ↺（反時計回り・ずらし量 −1）、右が ↻（時計回り・+1）。
 * 内側の輪を時計回りに回すとずらし量が増える。置き場所は親の `.dial-holder`（相対配置）が決める。
 * ドラッグを受ける `.dial-wrap` の外に置くこと（ポインタを捕まえられてクリックが届かなくなるため）
 */
export function TurnButtons({ onTurn }: { readonly onTurn: (delta: -1 | 1) => void }) {
  return (
    <>
      <button type="button" className="turn-btn ccw" aria-label="反時計回りに回す(ずらし量 −1)" onClick={() => onTurn(-1)}>
        <TurnArrow clockwise={false} />
        <span className="turn-delta" aria-hidden="true">
          −1
        </span>
      </button>
      <button type="button" className="turn-btn cw" aria-label="時計回りに回す(ずらし量 +1)" onClick={() => onTurn(1)}>
        <TurnArrow clockwise />
        <span className="turn-delta" aria-hidden="true">
          +1
        </span>
      </button>
    </>
  );
}
