import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { useCompactLayout } from '../layout';
import { decrypt } from '../stages/vigenereStub'; // core/ciphers/vigenere.ts の実装後にここを差し替える
import { ALPHABET, normalizeAngleDelta, pairWords } from './clock';
import { Dial } from './Dial';
import { alignedMessage, columnClasses, columnPair, pickableColumns, toggleColumn } from './calcSteps';
import type { ColumnPick } from './calcSteps';
import { restoreSentence } from './formula';
import { KeyCalculator } from './KeyCalculator';
import { highlightedCells, hoverTarget, outerIndexOf, tapCell, usedCipherLetters } from './mapping';
import type { CellPos } from './mapping';
import { DialLegend, MappingStrip } from './MappingStrip';
import { currentKeys, initialState, ownersOfWords, reducer, totalTried } from './multiState';
import { TurnButtons } from './TurnButtons';
import type { ToolProps } from './types';

/** ホイールを何ピクセルぶん回すと 1 目盛り進むか */
const WHEEL_PX_PER_STEP = 50;

/** 手がかりの段に並べる与件の id（stages/vigenere.ts の最初の単語。EXHIBITION.md「代数を使う」） */
const HINT_WORD_ID = 'first-word';

/** 円盤の番号の表記（① ② ③ …） */
function circled(index: number): string {
  return String.fromCodePoint(0x2460 + index);
}

/**
 * 1 語の 1 段。1 文字ずつ同じ幅のセルに入れ、上段と下段の字の大きさが違っても文字が縦に揃うようにする。
 * 操作対象の円盤が受け持つ文字を濃く（own）、他を薄く（dim）描く。
 * 文字にマウスを重ねると onHover に位置を渡し（離れたら null）、lit の文字は朱で光らせる。
 * column を渡した行（最初の単語の各段）は、手がかりのある列のクリックを列の番号で通知し、
 * 選んだ列は朱の塗り、マウスが乗った列は薄い地で示す（鍵の計算機への入力。重ねて光らせるのは強調で、クリックは入力）。
 * スマホ版（compact）は、重ねる代わりにタップで光らせる（もう一度タップで消す）。手がかりのある列のタップは、計算機への入力と光る表示を同時に行う（列の onPick が両方を扱う）。
 * タッチ端末はタップでマウスのイベントも合成するため、compact では onMouseEnter/Leave を付けない。
 * 添字を key にするのは、同じ語の中で文字が重複するため（並びは変わらない）。
 */
function OwnedRow({
  className,
  cells,
  owners,
  active,
  word,
  lit,
  onHover,
  onTap,
  compact,
  column,
}: {
  readonly className: string;
  /** 1 文字ずつの表示 */
  readonly cells: readonly string[];
  readonly owners: readonly (number | null)[];
  readonly active: number;
  /** 語の番号 */
  readonly word: number;
  readonly lit: readonly boolean[];
  readonly onHover: (pos: CellPos | null) => void;
  readonly onTap: (pos: CellPos) => void;
  readonly compact: boolean;
  readonly column?: ColumnPick;
}) {
  return (
    <span className={className}>
      {cells.map((cell, i) => (
        <span
          key={i}
          className={`${owners[i] === active ? 'cell own' : 'cell dim'}${lit[i] ? ' hl' : ''}${columnClasses(column, i)}`}
          onMouseEnter={compact ? undefined : () => onHover({ word, index: i })}
          onMouseLeave={compact ? undefined : () => onHover(null)}
          onClick={
            column?.pickable[i] ? () => column.onPick(i) : compact ? () => onTap({ word, index: i }) : undefined
          }
        >
          {cell}
        </span>
      ))}
    </span>
  );
}

/**
 * 円盤を複数枚並べた時計盤（ヴィジュネル暗号用）。1 枚が鍵の 1 文字ぶんを受け持つ。
 *
 * クリックした円盤、またはキーボードの 1・2・3… が操作対象。回転ボタン（操作対象の円盤の上半分の左右）・← →・ホイール・ドラッグは操作対象に効く
 * （ホイールとドラッグは、触れた円盤を操作対象にしてから回す）。
 * 操作対象の円盤だけ読み取り窓を朱にし、電文の紙では、その円盤が受け持つ文字（count 文字おき）を濃く描く。
 * 戻した文は全円盤の鍵で復号した文全体を onCandidate で返す。
 * 正解を知らない。判定はしない。全鍵を自動で試す機能は持たない（DESIGN.md §4）。
 */
export function MultiClock({ mount, ciphertext, heading, givens, onCandidate, onAttempts, actions }: ToolProps<'multi-clock'>) {
  const { modulus, count } = mount;
  const [state, dispatch] = useReducer(reducer, count, initialState);
  const compact = useCompactLayout();
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
  const labels = ALPHABET.slice(0, modulus).split('');
  const cipherWords = useMemo(() => pairs.map((p) => p.cipher), [pairs]);

  // 重ねている電文の文字。強調の状態は「暗号文の文字の位置」だけ持ち、
  // 受け持つ円盤・鍵・表示は今の状態から毎回計算する（キーボードや回転中も追従する）
  const [hover, setHover] = useState<CellPos | null>(null);
  const target = useMemo(() => hoverTarget(cipherWords, owners, hover), [cipherWords, owners, hover]);
  const lit = useMemo(() => highlightedCells(cipherWords, owners, target), [cipherWords, owners, target]);
  const onTap = (pos: CellPos) => setHover((cur) => tapCell(cipherWords, owners, cur, pos));
  // 対応表は操作対象の円盤の 1 本だけ。電文の出現は、その円盤が受け持つ位置の文字だけで判定する
  const used = useMemo(() => usedCipherLetters(cipherWords, owners, state.active), [cipherWords, owners, state.active]);
  // 鍵の計算機。電文の最初の単語の列を 1 回クリックすると、暗号文の文字と手がかりの文字の組が入る。
  // 選んだ列は番号だけ持ち、文字・受け持つ円盤は毎回そこから引く。ボタンを押したら解除する
  const hintWord = givens.find((g) => g.id === HINT_WORD_ID)?.value ?? null;
  const [selCol, setSelCol] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const pickable = useMemo(
    () => (hintWord === null ? [] : pickableColumns(cipherWords[0], hintWord, modulus)),
    [cipherWords, hintWord, modulus],
  );
  const selPair = hintWord !== null && selCol !== null ? columnPair(cipherWords[0], hintWord, selCol, modulus) : null;
  const selOwner = selCol !== null ? (owners[0]?.[selCol] ?? null) : null;
  const columnPick: ColumnPick | undefined =
    hintWord === null
      ? undefined
      : {
          pickable,
          selected: selCol,
          hovered: !compact && hover?.word === 0 ? hover.index : null,
          onPick: (col) => {
            const next = toggleColumn(selCol, col);
            setSelCol(next);
            setDone(null);
            // スマホ版: 列のタップで、計算機への入力と光る表示を同時に行う（もう一度タップで両方消える）
            if (compact) setHover(next === null ? null : { word: 0, index: col });
          },
        };
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

  return (
    <div className="tool tool-multi">
      <section ref={dialsRef} className="tool-dials" aria-label="円盤">
        {compact ? (
          // スマホ版: 円盤は 1 枚ずつ大きく出し、この切り替えで操作対象を選ぶ（鍵の今の値も添える）
          <div className="dial-tabs" role="group" aria-label="円盤の切り替え">
            {keys.map((k, d) => (
              <button
                key={d}
                type="button"
                aria-pressed={d === active}
                className={d === active ? 'dial-tab active' : 'dial-tab'}
                data-tab={d + 1}
                onClick={() => dispatch({ type: 'select', dial: d })}
              >
                {circled(d)} 鍵 {k}
              </button>
            ))}
          </div>
        ) : null}
        {keys.map((k, d) => {
          const isActive = d === active;
          return (
            <div
              key={d}
              className={isActive ? 'multi-dial active' : 'multi-dial'}
              data-dial={d}
              aria-current={isActive ? 'true' : undefined}
            >
              <div className="dial-holder">
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
                    grip={isActive}
                    highlight={target && target.owner === d ? outerIndexOf(target.letter, modulus) : undefined}
                  >
                    <text className="dial-hub-label" textAnchor="middle" y={-17}>
                      {circled(d)} ずらし量
                    </text>
                    <text className="dial-hub-value" textAnchor="middle" dominantBaseline="central" y={8}>
                      {k}
                    </text>
                  </Dial>
                </div>
                {isActive ? <TurnButtons onTurn={(delta) => dispatch({ type: 'move', delta, modulus })} /> : null}
              </div>
              <p className="attempts" data-testid="attempts" data-dial={d + 1}>
                {circled(d)} 試した鍵 <strong>{state.tried[d]?.size ?? 0}</strong> / {modulus}
              </p>
            </div>
          );
        })}
      </section>
      <div className="tool-controls">
        {compact ? null : (
          <p className="multi-target">
            操作中 <strong>{circled(active)}</strong>
          </p>
        )}
        <DialLegend grip />
      </div>
      {hintWord !== null ? (
        <KeyCalculator
          pair={selPair}
          dialLabel={selOwner === null ? null : circled(selOwner)}
          modulus={modulus}
          doneMessage={done}
          onAlign={(key) => {
            if (selOwner === null) return;
            // その列を受け持つ円盤を鍵に合わせ、操作対象もその円盤に切り替える。押したら選択を解除する
            dispatch({ type: 'align', key, modulus, dial: selOwner });
            setSelCol(null);
            setDone(alignedMessage(circled(selOwner), key));
          }}
        />
      ) : null}
      <MappingStrip
        title={`${circled(active)} の対応表`}
        k={keys[active] ?? 0}
        modulus={modulus}
        used={used}
        highlight={target && target.owner === active ? target.letter : null}
        dial={active + 1}
      />
      <section className="tool-text paper" aria-label="暗号文と戻した文">
        <p className="paper-head">
          <span>{heading}</span>
          <span className={target ? 'hover-note on' : 'hover-note'} data-testid="hover-note">
            {target
              ? restoreSentence(target.letter, keys[target.owner] ?? 0, modulus, circled(target.owner))
              : compact
                ? '電文の文字をタップすると、円盤の対応が光る'
                : '電文の文字にマウスを重ねると、円盤の対応が光る'}
          </span>
        </p>
        <div className="words">
          {pairs.map((pair, i) => {
            const wordOwners = owners[i] ?? [];
            // 最初の単語だけ、暗号文の段と戻した文の段の間に手がかりの段を挟み、列のクリックを受け付ける
            const column = i === 0 ? columnPick : undefined;
            return (
              <div key={i} className={column ? 'word first' : 'word'}>
                <OwnedRow
                  className="word-cipher"
                  cells={pair.cipher.split('')}
                  owners={wordOwners}
                  active={active}
                  word={i}
                  lit={lit[i] ?? []}
                  onHover={setHover}
                  onTap={onTap}
                  compact={compact}
                  column={column}
                />
                {column && hintWord !== null ? (
                  <OwnedRow
                    className="word-hint"
                    cells={pair.cipher.split('').map((_, j) => hintWord[j] ?? '')}
                    owners={wordOwners}
                    active={active}
                    word={i}
                    lit={[]}
                    onHover={setHover}
                    onTap={onTap}
                    compact={compact}
                    column={column}
                  />
                ) : null}
                <OwnedRow
                  className="word-restored"
                  cells={pair.restored.split('')}
                  owners={wordOwners}
                  active={active}
                  word={i}
                  lit={lit[i] ?? []}
                  onHover={setHover}
                  onTap={onTap}
                  compact={compact}
                  column={column}
                />
                <OwnedRow
                  className="word-owner"
                  cells={wordOwners.map((owner) => (owner === null ? '' : String(owner + 1)))}
                  owners={wordOwners}
                  active={active}
                  word={i}
                  lit={lit[i] ?? []}
                  onHover={setHover}
                  onTap={onTap}
                  compact={compact}
                  column={column}
                />
              </div>
            );
          })}
        </div>
      </section>
      {actions}
    </div>
  );
}
