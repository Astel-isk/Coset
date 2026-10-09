import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { PointerEvent } from 'react';
import { decrypt } from '../stages/vigenereStub'; // core/ciphers/vigenere.ts の実装後にここを差し替える
import { ALPHABET, mod, normalizeAngleDelta, pairWords } from './clock';
import { Dial } from './Dial';
import { currentKeys, initialState, ownersOfWords, reducer, totalTried } from './multiState';
import type { ToolProps } from './types';

/** ホイールを何ピクセルぶん回すと 1 目盛り進むか */
const WHEEL_PX_PER_STEP = 50;

/** 円盤の番号の表記（① ② ③ …） */
function circled(index: number): string {
  return String.fromCodePoint(0x2460 + index);
}

/**
 * 1 語の 1 段。1 文字ずつ同じ幅のセルに入れ、上段と下段の字の大きさが違っても文字が縦に揃うようにする。
 * 操作対象の円盤が受け持つ文字を濃く（own）、他を薄く（dim）描く。
 * 添字を key にするのは、同じ語の中で文字が重複するため（並びは変わらない）。
 */
function OwnedRow({
  className,
  cells,
  owners,
  active,
}: {
  readonly className: string;
  /** 1 文字ずつの表示 */
  readonly cells: readonly string[];
  readonly owners: readonly (number | null)[];
  readonly active: number;
}) {
  return (
    <span className={className}>
      {cells.map((cell, i) => (
        <span key={i} className={owners[i] === active ? 'cell own' : 'cell dim'}>
          {cell}
        </span>
      ))}
    </span>
  );
}

/**
 * 円盤を複数枚並べた時計盤（ヴィジュネル暗号用）。1 枚が鍵の 1 文字ぶんを受け持つ。
 *
 * クリックした円盤、またはキーボードの 1・2・3… が操作対象。← →・ホイール・ドラッグは操作対象に効く
 * （ホイールとドラッグは、触れた円盤を操作対象にしてから回す）。
 * 操作対象の円盤だけ読み取り窓を朱にし、電文の紙では、その円盤が受け持つ文字（count 文字おき）を濃く描く。
 * 戻した文は全円盤の鍵で復号した文全体を onCandidate で返す。
 * 正解を知らない。判定はしない。全鍵を自動で試す機能は持たない（DESIGN.md §4）。
 */
export function MultiClock({ mount, ciphertext, heading, onCandidate, onAttempts }: ToolProps<'multi-clock'>) {
  const { modulus, count } = mount;
  const [state, dispatch] = useReducer(reducer, count, initialState);
  const dialsRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ last: number; acc: number; start: number } | null>(null);

  const keys = useMemo(() => currentKeys(state, modulus), [state, modulus]);
  const restored = useMemo(() => decrypt(ciphertext, keys), [ciphertext, keys]);
  const pairs = useMemo(() => pairWords(ciphertext, restored), [ciphertext, restored]);
  const owners = useMemo(
    () =>
      ownersOfWords(
        pairs.map((p) => p.cipher),
        count,
        modulus,
      ),
    [pairs, count, modulus],
  );
  const triedCount = totalTried(state);
  const total = modulus * count;
  const active = state.active;

  useEffect(() => {
    onCandidate(restored);
  }, [restored, onCandidate]);

  useEffect(() => {
    onAttempts(triedCount, total);
  }, [triedCount, total, onAttempts]);

  // キーボード: ← → は操作対象を回し、1・2・3… は操作対象を切り替える
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatch({ type: 'move', delta: -1, modulus });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'move', delta: 1, modulus });
      } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= count) {
        e.preventDefault();
        dispatch({ type: 'select', dial: Number(e.key) - 1 });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modulus, count]);

  // 円盤の上のホイール。触れた円盤を操作対象にして回す（ページのスクロールを止めるため passive:false で受ける）
  useEffect(() => {
    const el = dialsRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-dial]') : null;
      if (target) dispatch({ type: 'select', dial: Number(target.dataset['dial']) });
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

  // ドラッグ。押した円盤を操作対象にし、その中心まわりの角度の変化を目盛りに直す（時計回りで鍵が増える）
  const pointerAngle = (e: PointerEvent<HTMLDivElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>, dial: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dispatch({ type: 'select', dial });
    dragRef.current = { last: pointerAngle(e), acc: 0, start: state.pos[dial] ?? 0 };
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

  const labels = ALPHABET.slice(0, modulus).split('');

  return (
    <div className="tool tool-multi">
      <section ref={dialsRef} className="tool-dials" aria-label="円盤">
        {keys.map((k, d) => {
          const isActive = d === active;
          return (
            <div
              key={d}
              className={isActive ? 'multi-dial active' : 'multi-dial'}
              data-dial={d}
              aria-current={isActive ? 'true' : undefined}
            >
              <div
                className="dial-wrap"
                onPointerDown={(e) => onPointerDown(e, d)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
              >
                <Dial
                  labels={labels}
                  steps={state.pos[d] ?? 0}
                  marks={{ tried: state.tried[d] ?? new Set<number>(), current: k }}
                  showWindow
                  active={isActive}
                >
                  <text className="dial-hub-label" textAnchor="middle" y={-17}>
                    {circled(d)} ずらし量
                  </text>
                  <text className="dial-hub-value" textAnchor="middle" dominantBaseline="central" y={8}>
                    {k}
                  </text>
                </Dial>
              </div>
              <p className="dial-window-note">
                窓の中: 暗号の <span className="mono">{labels[0]}</span> は 平文の{' '}
                <strong className="mono" data-testid="window-letter" data-dial={d + 1}>
                  {labels[mod(-k, modulus)] ?? ''}
                </strong>
              </p>
              <p className="attempts" data-testid="attempts" data-dial={d + 1}>
                {circled(d)} 試した鍵 <strong>{state.tried[d]?.size ?? 0}</strong> / {modulus}
              </p>
            </div>
          );
        })}
      </section>
      <div className="tool-controls">
        <button
          type="button"
          className="secondary"
          onClick={() => dispatch({ type: 'move', delta: -1, modulus })}
          aria-label="操作中の円盤を 1 つ戻す"
        >
          ← 戻す
        </button>
        <p className="multi-target">
          操作中 <strong>{circled(active)}</strong>
        </p>
        <button
          type="button"
          className="secondary"
          onClick={() => dispatch({ type: 'move', delta: 1, modulus })}
          aria-label="操作中の円盤を 1 つ進める"
        >
          進める →
        </button>
      </div>
      <section className="tool-text paper" aria-label="暗号文と戻した文">
        <p className="paper-head">{heading}</p>
        <div className="words">
          {pairs.map((pair, i) => {
            const wordOwners = owners[i] ?? [];
            return (
              <div key={i} className="word">
                <OwnedRow
                  className="word-cipher"
                  cells={pair.cipher.split('')}
                  owners={wordOwners}
                  active={active}
                />
                <OwnedRow
                  className="word-restored"
                  cells={pair.restored.split('')}
                  owners={wordOwners}
                  active={active}
                />
                <OwnedRow
                  className="word-owner"
                  cells={wordOwners.map((owner) => (owner === null ? '' : String(owner + 1)))}
                  owners={wordOwners}
                  active={active}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
