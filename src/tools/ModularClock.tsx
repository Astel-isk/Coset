import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { decrypt } from '../stages/caesarStub'; // core/ciphers/caesar.ts の実装後にここを差し替える
import { ALPHABET, mod, normalizeAngleDelta, pairWords } from './clock';
import { Dial } from './Dial';
import { restoreSentence } from './formula';
import { highlightedCells, hoverTarget, outerIndexOf, usedCipherLetters } from './mapping';
import type { CellPos } from './mapping';
import { DialLegend, MappingStrip } from './MappingStrip';
import { ownersOfWords } from './multiState';
import type { ToolProps } from './types';

/** ホイールを何ピクセルぶん回すと 1 目盛り進むか */
const WHEEL_PX_PER_STEP = 50;

interface State {
  /** 内周を回した目盛りの累計（剰余に畳まない。アニメーションが巻き戻らないように） */
  readonly pos: number;
  /** これまでに試したずらし量（剰余）。開始時の 0 は数えない（来場者が操作して止めた位置だけを数える） */
  readonly tried: ReadonlySet<number>;
}

type Action =
  | { readonly type: 'move'; readonly delta: number; readonly modulus: number }
  | { readonly type: 'set'; readonly pos: number; readonly modulus: number };

function reducer(state: State, action: Action): State {
  const pos = action.type === 'move' ? state.pos + action.delta : action.pos;
  if (pos === state.pos) return state;
  const k = mod(pos, action.modulus);
  const tried = state.tried.has(k) ? state.tried : new Set(state.tried).add(k);
  return { pos, tried };
}

/**
 * 1 語の 1 段。1 文字ずつ同じ幅のセルに入れ、上段と下段の字の大きさが違っても文字が縦に揃うようにする。
 * 文字にマウスを重ねると onHover に位置を渡し（離れたら null）、lit の文字は朱で光らせる。
 * 添字を key にするのは、同じ語の中で文字が重複するため（並びは変わらない）。
 */
function WordRow({
  className,
  text,
  word,
  lit,
  onHover,
}: {
  readonly className: string;
  readonly text: string;
  /** 語の番号 */
  readonly word: number;
  readonly lit: readonly boolean[];
  readonly onHover: (pos: CellPos | null) => void;
}) {
  return (
    <span className={className}>
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className={lit[i] ? 'cell hl' : 'cell'}
          onMouseEnter={() => onHover({ word, index: i })}
          onMouseLeave={() => onHover(null)}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

const INITIAL: State = { pos: 0, tried: new Set<number>() };

/**
 * モジュラー時計盤（DESIGN.md §4）。
 *
 * 外周＝暗号文の文字（固定）、内周＝平文の文字（回る）。ずらし量 k のとき外周 X の内側に X−k が来る。
 * 回し方は ←→ ボタン・キーボードの ← →・円盤上のホイール・ドラッグ。
 * 正解を知らない。戻した文を候補としてランナーへ返すだけで、判定はしない。
 * 全鍵を自動で試す機能は持たない（DESIGN.md §4）。
 */
export function ModularClock({ mount, ciphertext, heading, onCandidate, onAttempts }: ToolProps<'modular-clock'>) {
  const modulus = mount.modulus;
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const dialRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ last: number; acc: number; start: number } | null>(null);

  const k = mod(state.pos, modulus);
  const restored = useMemo(() => decrypt(ciphertext, k), [ciphertext, k]);
  const pairs = useMemo(() => pairWords(ciphertext, restored), [ciphertext, restored]);
  const triedCount = state.tried.size;
  const labels = ALPHABET.slice(0, modulus).split('');

  // 重ねている電文の文字。強調の状態は「暗号文の文字の位置」だけ持ち、表示は今の鍵から毎回計算する
  const [hover, setHover] = useState<CellPos | null>(null);
  const cipherWords = useMemo(() => pairs.map((p) => p.cipher), [pairs]);
  const owners = useMemo(() => ownersOfWords(cipherWords, 1, modulus), [cipherWords, modulus]);
  const used = useMemo(() => usedCipherLetters(cipherWords, owners, 0), [cipherWords, owners]);
  const target = useMemo(() => hoverTarget(cipherWords, owners, hover), [cipherWords, owners, hover]);
  const lit = useMemo(() => highlightedCells(cipherWords, owners, target), [cipherWords, owners, target]);

  useEffect(() => {
    onCandidate(restored);
  }, [restored, onCandidate]);

  useEffect(() => {
    onAttempts(triedCount, modulus);
  }, [triedCount, modulus, onAttempts]);

  // キーボードの ← →
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatch({ type: 'move', delta: -1, modulus });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'move', delta: 1, modulus });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modulus]);

  // 円盤の上のホイール。ページのスクロールを止めるため passive:false で受ける
  useEffect(() => {
    const el = dialRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      acc += e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      const steps = Math.trunc(acc / WHEEL_PX_PER_STEP);
      if (steps !== 0) {
        acc -= steps * WHEEL_PX_PER_STEP;
        dispatch({ type: 'move', delta: steps, modulus });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [modulus]);

  // ドラッグ。円盤の中心まわりの角度の変化を目盛りに直す（時計回りで鍵が増える）
  const pointerAngle = (e: PointerEvent<HTMLDivElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { last: pointerAngle(e), acc: 0, start: state.pos };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const angle = pointerAngle(e);
    drag.acc += normalizeAngleDelta(angle - drag.last);
    drag.last = angle;
    dispatch({ type: 'set', pos: drag.start + Math.round(drag.acc / (360 / modulus)), modulus });
  };
  const onPointerEnd = () => {
    dragRef.current = null;
  };

  return (
    <div className="tool">
      <section className="tool-dial" aria-label="時計盤">
        <div
          ref={dialRef}
          className="dial-wrap"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <Dial
            labels={labels}
            steps={state.pos}
            marks={{ tried: state.tried, current: k }}
            showWindow
            highlight={target ? outerIndexOf(target.letter, modulus) : undefined}
          >
            <text className="dial-hub-label" textAnchor="middle" y={-17}>
              ずらし量
            </text>
            <text className="dial-hub-value" textAnchor="middle" dominantBaseline="central" y={8}>
              {k}
            </text>
          </Dial>
        </div>
        <DialLegend />
        <div className="dial-controls">
          <button
            type="button"
            className="secondary"
            onClick={() => dispatch({ type: 'move', delta: -1, modulus })}
            aria-label="1 つ戻す"
          >
            ← 戻す
          </button>
          <p className="attempts">
            試した鍵 <strong>{triedCount}</strong> / {modulus}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => dispatch({ type: 'move', delta: 1, modulus })}
            aria-label="1 つ進める"
          >
            進める →
          </button>
        </div>
      </section>
      <MappingStrip
        title="対応表（円盤を切り開いて伸ばしたもの）"
        k={k}
        modulus={modulus}
        used={used}
        highlight={target?.letter ?? null}
      />
      <section className="tool-text paper" aria-label="暗号文と戻した文">
        <p className="paper-head">
          <span>{heading}</span>
          <span className="paper-note">上段が暗号文、下段が今のずらし量で戻した文</span>
        </p>
        <div className="words">
          {pairs.map((pair, i) => (
            <div key={i} className="word">
              <WordRow className="word-cipher" text={pair.cipher} word={i} lit={lit[i] ?? []} onHover={setHover} />
              <WordRow className="word-restored" text={pair.restored} word={i} lit={lit[i] ?? []} onHover={setHover} />
            </div>
          ))}
        </div>
        <p className={target ? 'hover-note on' : 'hover-note'} data-testid="hover-note">
          {target ? restoreSentence(target.letter, k, modulus) : '電文の文字にマウスを重ねると、円盤の対応が光る'}
        </p>
      </section>
    </div>
  );
}
