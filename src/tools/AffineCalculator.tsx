import { affineKeyExpression } from './formula';

interface AffineCalculatorProps {
  /** 手がかりの単語（与件 'first-word' の値）。1 文字ずつクリックできる */
  readonly hintWord: string;
  /** 1 つ目の欄「暗号文の文字」。電文の暗号文（上段）でクリックした文字。未選択なら null */
  readonly cipherLetter: string | null;
  /** 手がかりの単語のうち、選んだ文字の位置（2 つ目の欄「平文の文字」）。未選択なら null */
  readonly plainIndex: number | null;
  /** 今の a（計算に使う） */
  readonly a: number;
  /** 今の a が 26 と互いに素か。そうでなければ注意を出す（計算はする） */
  readonly invertible: boolean;
  readonly modulus: number;
  /** 手がかりの文字をクリックしたとき（位置を渡す） */
  readonly onPickPlain: (index: number) => void;
  /** 「消す」。両方の欄を空にする */
  readonly onClear: () => void;
  /** 「b を合わせる」。b を value にする */
  readonly onAlign: (value: number) => void;
}

/**
 * 鍵の計算機（ステージ 3。b を出す）。今の a で b = 暗号文の文字 − a × 平文の文字（26 で割った余り）を計算するだけで、
 * どの文字どうしを組にするかは来場者が選ぶ（DESIGN.md §4: 計算の代行はしてよいが、判断は代行しない）。
 * a は今 AffineTable で選んでいるものを使い、計算機は a の良し悪しを判断しない（戻せない数のときは注意を出すだけ）。
 * 手がかりは与件（公開情報）の単語だけで、ツールは正解の平文全体を知らない。状態は持たない。
 */
export function AffineCalculator({
  hintWord,
  cipherLetter,
  plainIndex,
  a,
  invertible,
  modulus,
  onPickPlain,
  onClear,
  onAlign,
}: AffineCalculatorProps) {
  const plainLetter = plainIndex === null ? null : (hintWord[plainIndex] ?? null);
  const result =
    cipherLetter !== null && plainLetter !== null ? affineKeyExpression(cipherLetter, plainLetter, a, modulus) : null;
  const empty = cipherLetter === null && plainLetter === null;
  return (
    <section className="key-calc affine-calc" aria-label="鍵の計算機" data-testid="key-calc">
      <div className="calc-hint">
        <span className="calc-title">鍵の計算機（b を出す）</span>
        <span className="calc-label">手がかり</span>
        <span className="calc-letters">
          {hintWord.split('').map((ch, i) => (
            <button
              key={i}
              type="button"
              className={i === plainIndex ? 'calc-letter sel' : 'calc-letter'}
              data-index={i}
              onClick={() => onPickPlain(i)}
            >
              {ch}
            </button>
          ))}
        </span>
      </div>
      <div className="calc-fields">
        <div className="calc-field">
          <span className="calc-field-label">暗号文の文字</span>
          <span className={cipherLetter === null ? 'calc-value guide' : 'calc-value'} data-testid="calc-cipher">
            {cipherLetter ?? '電文の暗号文の文字をクリック'}
          </span>
        </div>
        <span className="calc-op" aria-hidden="true">
          − {a} ×
        </span>
        <div className="calc-field">
          <span className="calc-field-label">平文の文字</span>
          <span className={plainLetter === null ? 'calc-value guide' : 'calc-value'} data-testid="calc-plain">
            {plainLetter ?? '手がかりの文字をクリック'}
          </span>
        </div>
      </div>
      <p className="calc-expression" data-testid="calc-expression">
        {result ? result.text : ''}
      </p>
      <div className="calc-buttons">
        <button
          type="button"
          className="secondary calc-align"
          disabled={!result}
          onClick={() => result && onAlign(result.b)}
        >
          {result ? `b を ${result.b} に合わせる` : 'b を合わせる'}
        </button>
        <button type="button" className="secondary calc-clear" disabled={empty} onClick={onClear}>
          消す
        </button>
        <span className="calc-caution" data-testid="calc-caution">
          {invertible ? '' : `注意: a = ${a} は戻せない数`}
        </span>
      </div>
    </section>
  );
}
