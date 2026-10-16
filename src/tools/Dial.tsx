import { useState } from 'react';
import type { ReactNode } from 'react';
import { innerIndexAt } from './mapping';

/** 目盛りの状態表示。解読画面だけが渡す（待機画面の円盤は渡さず、目盛りは無印で描く） */
export interface DialMarks {
  /** 試した鍵（ずらし量）の集合 */
  readonly tried: ReadonlySet<number>;
  /** 今のずらし量 */
  readonly current: number;
}

interface DialProps {
  /** 外周に並べる文字（固定）。内周は同じ並びで、steps だけ回る */
  readonly labels: readonly string[];
  /** 内周を時計回りに回した目盛りの数。巻き戻さないよう、剰余に畳まない値を渡す */
  readonly steps: number;
  /** 外周の外の目盛りに、試した鍵・今の鍵を出す。省けば無印の目盛りだけを描く */
  readonly marks?: DialMarks;
  /** 真上に読み取り窓（外周の先頭の文字と、その内側の内周の文字を囲む枠）を出すか */
  readonly showWindow?: boolean;
  /**
   * この円盤が操作対象か（複数枚並べるとき）。false なら読み取り窓を灰にし、今の鍵の目盛りも朱にしない。
   * 1 枚だけのときは省く（常に操作対象）
   */
  readonly active?: boolean;
  /**
   * 朱で光らせる外周の添字（電文の文字に重ねたとき。省けば光らせない）。
   * その外周の文字と、同じ角度にある内周の文字を、中心から放射状の朱の帯で結ぶ
   */
  readonly highlight?: number;
  /**
   * 内側の輪をつかんで回せることを見た目で示すか（操作対象の円盤だけ true。待機画面の円盤は省く）。
   * true なら、内側の輪の縁に小さなつまみを 120 度おきに 3 つ付け（輪と一緒に回る）、縁を少し明るくする。
   * あわせて、steps が変わった直後に回った向きの朱の弧を 0.3 秒ほど出して消す（動きを減らす設定では出さない）
   */
  readonly grip?: boolean;
  /** 円盤の中央に重ねる SVG 要素 */
  readonly children?: ReactNode;
}

/** 円盤の寸法（viewBox の単位）。中心が原点 */
const DISC_R = 108;
const OUTER_R = 94;
const PLATE_R = 82;
const INNER_R = 68;
const HUB_R = 46;
const TICK_FROM = 113;
const TICK_TO = 121;
const VIEW = 126;
/** 光らせる帯の半幅（外周・内周の文字の幅より少し広い） */
const BAND_HALF = 9;
/** つまみ: 内側の輪の縁にまたがる小さな角丸の突起（縁の内側 GRIP_IN、外側 GRIP_OUT）。幅は縁に沿った向き */
const GRIP_IN = 6;
const GRIP_OUT = 3;
const GRIP_WIDTH = 12;
/** 回した向きの弧: 内側の輪の外縁のすぐ外（外周の文字の内側）に置く */
const TRAIL_R = PLATE_R + 1.5;
/** 弧の中心の角度。時計回りは右上（↻ ボタンの側）、反時計回りは左上（↺ ボタンの側）。読み取り窓の真上は避ける */
const TRAIL_CENTER = 62;
const TRAIL_MIN_SPAN = 36;
const TRAIL_MAX_SPAN = 110;

/** 回した向きの弧（時計回りは dir=1）。角度は真上が 0 で時計回りが正。先端に小さな矢じりを付ける */
function trailShape(dir: 1 | -1, span: number): { readonly arc: string; readonly head: string } {
  const point = (deg: number, r: number): string => {
    const rad = (deg * Math.PI) / 180;
    return `${(r * Math.sin(rad)).toFixed(2)} ${(-r * Math.cos(rad)).toFixed(2)}`;
  };
  const mid = dir * TRAIL_CENTER;
  const from = mid - (dir * span) / 2;
  const to = mid + (dir * span) / 2;
  const sweep = dir === 1 ? 1 : 0;
  const arc = `M ${point(from, TRAIL_R)} A ${TRAIL_R} ${TRAIL_R} 0 0 ${sweep} ${point(to, TRAIL_R)}`;
  // 矢じり: 先端 to の少し先に頂点、to の手前の両側に底辺
  const tip = to + dir * 9;
  const head = `M ${point(tip, TRAIL_R)} L ${point(to, TRAIL_R + 4)} L ${point(to, TRAIL_R - 4)} Z`;
  return { arc, head };
}

/**
 * 二重リングの円盤（表示だけ。操作は持たない）。
 *
 * 内周を k 目盛り回すと、外周の文字 X の内側に X−k の文字が来る。
 * 外周の外の目盛りのうち、鍵 k の目盛りは外周の文字 A+k（添字 k の文字）と同じ向きに置く。
 */
export function Dial({ labels, steps, marks, showWindow = false, active = true, highlight, grip = false, children }: DialProps) {
  const n = labels.length;
  const stepDeg = 360 / n;
  // 回した向きの軌跡。steps が変わったその描画で、回った量と向きを覚える（表示は CSS のアニメーションで消え、終わったら外す）
  const [seen, setSeen] = useState(steps);
  const [trail, setTrail] = useState<{ readonly id: number; readonly delta: number } | null>(null);
  if (seen !== steps) {
    setSeen(steps);
    if (grip && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTrail({ id: (trail?.id ?? 0) + 1, delta: steps - seen });
  }
  const shape = trail ? trailShape(trail.delta > 0 ? 1 : -1, Math.min(TRAIL_MAX_SPAN, TRAIL_MIN_SPAN + Math.abs(trail.delta) * stepDeg)) : null;
  return (
    <svg
      className="dial"
      viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
      role="img"
      aria-label="二重リングの円盤"
    >
      <circle className="dial-disc" r={DISC_R} />
      {labels.map((label, i) => {
        const currentClass = active ? ' current' : ' current off';
        const state = marks ? (i === marks.current ? currentClass : marks.tried.has(i) ? ' tried' : '') : '';
        return (
          <line
            key={label}
            className={`dial-tick${state}`}
            data-key={i}
            transform={`rotate(${i * stepDeg})`}
            y1={-TICK_FROM}
            y2={-TICK_TO}
          />
        );
      })}
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
        <circle className={grip ? 'dial-plate grip' : 'dial-plate'} r={PLATE_R} />
        {grip &&
          [0, 1, 2].map((i) => (
            <rect
              key={i}
              className="dial-grip"
              x={-GRIP_WIDTH / 2}
              y={-(PLATE_R + GRIP_OUT)}
              width={GRIP_WIDTH}
              height={GRIP_IN + GRIP_OUT}
              rx={3}
              transform={`rotate(${60 + i * 120})`}
            />
          ))}
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
      {highlight !== undefined && highlight >= 0 && highlight < n ? (
        <g className="dial-hl" data-outer={labels[highlight]} transform={`rotate(${highlight * stepDeg})`}>
          <rect
            className="dial-hl-band"
            x={-BAND_HALF}
            y={-(OUTER_R + BAND_HALF)}
            width={BAND_HALF * 2}
            height={OUTER_R - INNER_R + BAND_HALF * 2}
            rx={5}
          />
          <text
            className="dial-hl-letter"
            data-ring="outer"
            transform={`translate(0 ${-OUTER_R})`}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {labels[highlight]}
          </text>
          <text
            className="dial-hl-letter"
            data-ring="inner"
            transform={`translate(0 ${-INNER_R})`}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {labels[innerIndexAt(highlight, steps, n)]}
          </text>
        </g>
      ) : null}
      {trail && shape ? (
        <g key={trail.id} className="dial-trail" data-dir={trail.delta > 0 ? 'cw' : 'ccw'} onAnimationEnd={() => setTrail(null)}>
          <path className="dial-trail-arc" d={shape.arc} />
          <path className="dial-trail-head" d={shape.head} />
        </g>
      ) : null}
      <circle className="dial-hub" r={HUB_R} />
      {children}
      {showWindow && <rect className={active ? 'dial-window' : 'dial-window off'} x={-11} y={-104} width={22} height={48} rx={5} />}
    </svg>
  );
}
