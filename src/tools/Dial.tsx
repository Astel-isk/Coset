import type { ReactNode } from 'react';

interface DialProps {
  /** 外周に並べる文字（固定）。内周は同じ並びで、steps だけ回る */
  readonly labels: readonly string[];
  /** 内周を時計回りに回した目盛りの数。巻き戻さないよう、剰余に畳まない値を渡す */
  readonly steps: number;
  /** 円盤の中央に重ねる SVG 要素 */
  readonly children?: ReactNode;
}

const OUTER_R = 94;
const INNER_R = 68;

/**
 * 二重リングの円盤（表示だけ。操作は持たない）。
 *
 * 内周を k 目盛り回すと、外周の文字 X の内側に X−k の文字が来る。
 */
export function Dial({ labels, steps, children }: DialProps) {
  const n = labels.length;
  const stepDeg = 360 / n;
  return (
    <svg className="dial" viewBox="-110 -110 220 220" role="img" aria-label="二重リングの円盤">
      <circle className="dial-outer-ring" r={108} />
      {labels.map((label, i) => (
        <text
          key={label}
          className="dial-outer-letter"
          transform={`rotate(${i * stepDeg}) translate(0 ${-OUTER_R})`}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label}
        </text>
      ))}
      <g className="dial-inner" style={{ transform: `rotate(${steps * stepDeg}deg)` }}>
        <circle className="dial-inner-ring" r={82} />
        {labels.map((label, i) => (
          <text
            key={label}
            className="dial-inner-letter"
            transform={`rotate(${i * stepDeg}) translate(0 ${-INNER_R})`}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {label}
          </text>
        ))}
      </g>
      <circle className="dial-hub" r={46} />
      {children}
    </svg>
  );
}
