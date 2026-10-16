import { useEffect, useMemo, useReducer, useState } from 'react';
import { AffineCalculator } from './AffineCalculator';
import { AffineStrip } from './AffineStrip';
import { hoverSentence, isInvertible, keyTotal, restoreText } from './affine';
import { affineReducer, initialAffineState } from './affineState';
import { affineAlignedMessage, columnClasses, columnPair, pickableColumns, toggleColumn } from './calcSteps';
import type { ColumnPick } from './calcSteps';
import { useCompactLayout } from '../layout';
import { pairWords } from './clock';
import { highlightedCells, hoverTarget, tapCell, usedCipherLetters } from './mapping';
import type { CellPos } from './mapping';
import { ownersOfWords } from './multiState';
import type { ToolProps } from './types';

/** 手がかりの段に並べる与件の id（stages/affine.ts の最初の単語。EXHIBITION.md「ステージ 3」） */
const HINT_WORD_ID = 'first-word';

/**
 * 1 語の 1 段。1 文字ずつ同じ幅のセルに入れ、上段と下段の字の大きさが違っても文字が縦に揃うようにする。
 * 文字にマウスを重ねると onHover に位置を渡し（離れたら null）、lit の文字は朱で光らせる。
 * column を渡した行（最初の単語の各段）は、手がかりのある列のクリックを列の番号で通知し、
 * 選んだ列は朱の塗り、マウスが乗った列は薄い地で示す（鍵の計算機への入力）。
 * 戻した文の「?」（戻し先が 1 つに決まらない文字）は薄く描く。
 * スマホ版（compact）は、重ねる代わりにタップで光らせる（もう一度タップで消す）。手がかりのある列のタップは、計算機への入力と光る表示を同時に行う。
 * タッチ端末はタップでマウスのイベントも合成するため、compact では onMouseEnter/Leave を付けない。
 * 添字を key にするのは、同じ語の中で文字が重複するため（並びは変わらない）。
 */
function Row({
  className,
  cells,
  word,
  lit,
  onHover,
  onTap,
  compact,
  column,
}: {
  readonly className: string;
  readonly cells: readonly string[];
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
          className={`cell${lit[i] ? ' hl' : ''}${columnClasses(column, i)}${cell === '?' ? ' unknown' : ''}`}
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
 * アフィン表（アフィン暗号用。円盤は使わない）。鍵は a（1〜25 のボタン）と b（← →）の 2 つ。
 * 対応表（暗号化の向き）・電文（上段が暗号文、下段が今の a, b で戻した文）・鍵の計算機（b を出す）を並べる。
 * 戻せない a（26 と互いに素でない数）も選べて、そのときは対応表の重なりと警告、戻し先が決まらない文字の「?」で示す。
 * 正解を知らない。判定はしない。全鍵を自動で試す機能は持たない（DESIGN.md §4）。
 */
export function AffineTable({ mount, ciphertext, heading, givens, onCandidate, onAttempts, actions }: ToolProps<'affine-table'>) {
  const { modulus } = mount;
  const compact = useCompactLayout();
  const [state, dispatch] = useReducer(affineReducer, undefined, initialAffineState);
  const { a, b } = state;
  const invertible = isInvertible(a, modulus);

  const restored = useMemo(() => restoreText(ciphertext, a, b, modulus), [ciphertext, a, b, modulus]);
  const pairs = useMemo(() => pairWords(ciphertext, restored), [ciphertext, restored]);
  const cipherWords = useMemo(() => pairs.map((p) => p.cipher), [pairs]);
  // 円盤は無いので、全文字が同じ持ち主（0）。重ねたときの強調は暗号文の文字だけで決まる
  const owners = useMemo(() => ownersOfWords(cipherWords, 1, modulus), [cipherWords, modulus]);
  const used = useMemo(() => usedCipherLetters(cipherWords, owners, 0), [cipherWords, owners]);

  // 重ねている電文の文字。強調の状態は「暗号文の文字の位置」だけ持ち、表示は今の (a, b) から毎回計算する
  const [hover, setHover] = useState<CellPos | null>(null);
  const target = useMemo(() => hoverTarget(cipherWords, owners, hover), [cipherWords, owners, hover]);
  const lit = useMemo(() => highlightedCells(cipherWords, owners, target), [cipherWords, owners, target]);
  const onTap = (pos: CellPos) => setHover((cur) => tapCell(cipherWords, owners, cur, pos));

  // 鍵の計算機。電文の最初の単語の列を 1 回クリックすると、暗号文の文字と手がかりの文字の組が入る。
  // 選んだ列は番号だけ持ち、文字は毎回そこから引く。ボタンを押したら解除する
  const hintWord = givens.find((g) => g.id === HINT_WORD_ID)?.value ?? null;
  const [selCol, setSelCol] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const pickable = useMemo(
    () => (hintWord === null ? [] : pickableColumns(cipherWords[0], hintWord, modulus)),
    [cipherWords, hintWord, modulus],
  );
  const selPair = hintWord !== null && selCol !== null ? columnPair(cipherWords[0], hintWord, selCol, modulus) : null;
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

  const triedCount = state.tried.size;
  const total = useMemo(() => keyTotal(modulus), [modulus]);

  useEffect(() => {
    onCandidate(restored);
  }, [restored, onCandidate]);

  useEffect(() => {
    onAttempts(triedCount, total);
  }, [triedCount, total, onAttempts]);

  // キーボード: ← → は b を動かす
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatch({ type: 'moveB', delta: -1, modulus });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'moveB', delta: 1, modulus });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modulus]);

  return (
    <div className="tool tool-affine">
      <section className="affine-ctl" aria-label="鍵の選択" data-testid="affine-ctl">
        <div className="affine-ctl-head">
          <span className="calc-title">鍵を合わせる</span>
          <p className="attempts" data-testid="attempts">
            試した鍵 <strong>{triedCount}</strong> / {total}
          </p>
        </div>
        <div className="affine-row">
          <span className="affine-label">a</span>
          <div className="affine-a-buttons" role="group" aria-label="a を選ぶ">
            {Array.from({ length: modulus - 1 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={n === a ? 'a-btn sel' : 'a-btn'}
                aria-pressed={n === a}
                data-a={n}
                onClick={() => dispatch({ type: 'setA', a: n, modulus })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="affine-row affine-b-row">
          <span className="affine-label">b</span>
          <button
            type="button"
            className="secondary b-btn"
            aria-label="b を 1 つ戻す"
            onClick={() => dispatch({ type: 'moveB', delta: -1, modulus })}
          >
            ←
          </button>
          <button
            type="button"
            className="secondary b-btn"
            aria-label="b を 1 つ進める"
            onClick={() => dispatch({ type: 'moveB', delta: 1, modulus })}
          >
            →
          </button>
          <p className="affine-key" data-testid="affine-key">
            <span className="affine-key-item">
              a = <strong data-testid="affine-a">{a}</strong>
            </span>
            <span className="affine-key-item">
              b = <strong data-testid="affine-b">{b}</strong>
            </span>
          </p>
        </div>
      </section>
      {hintWord !== null ? (
        <AffineCalculator
          pair={selPair}
          a={a}
          invertible={invertible}
          modulus={modulus}
          doneMessage={done}
          onAlign={(value) => {
            // 今の a のまま b を合わせ、選択を解除する
            dispatch({ type: 'setB', b: value, modulus });
            setSelCol(null);
            setDone(affineAlignedMessage(value));
          }}
        />
      ) : null}
      <AffineStrip a={a} b={b} modulus={modulus} used={used} highlight={target ? target.letter : null} />
      <section className="tool-text paper" aria-label="暗号文と戻した文">
        <p className="paper-head">
          <span>{heading}</span>
          <span className={target ? 'hover-note on' : 'hover-note'} data-testid="hover-note">
            {target ? hoverSentence(target.letter, a, b, modulus) : compact ? '電文の文字をタップすると、対応表の元の文字が光る' : '電文の文字にマウスを重ねると、対応表の元の文字が光る'}
          </span>
        </p>
        <div className="words">
          {pairs.map((pair, i) => {
            // 最初の単語だけ、暗号文の段と戻した文の段の間に手がかりの段を挟み、列のクリックを受け付ける
            const column = i === 0 ? columnPick : undefined;
            return (
              <div key={i} className={column ? 'word first' : 'word'}>
                <Row
                  className="word-cipher"
                  cells={pair.cipher.split('')}
                  word={i}
                  lit={lit[i] ?? []}
                  onHover={setHover}
                  onTap={onTap}
                  compact={compact}
                  column={column}
                />
                {column && hintWord !== null ? (
                  <Row
                    className="word-hint"
                    cells={pair.cipher.split('').map((_, j) => hintWord[j] ?? '')}
                    word={i}
                    lit={[]}
                    onHover={setHover}
                    onTap={onTap}
                    compact={compact}
                    column={column}
                  />
                ) : null}
                <Row
                  className="word-restored"
                  cells={pair.restored.split('')}
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
