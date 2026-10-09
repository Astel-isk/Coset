import { keyExpression } from './formula';

interface KeyCalculatorProps {
  /** 手がかりの単語（与件 'first-word' の値）。1 文字ずつクリックできる */
  readonly hintWord: string;
  /** 1 つ目の欄「暗号文の文字」。電文の暗号文（上段）でクリックした文字。未選択なら null */
  readonly cipherLetter: string | null;
  /** 手がかりの単語のうち、選んだ文字の位置（2 つ目の欄「平文の文字」）。未選択なら null */
  readonly plainIndex: number | null;
  /** 操作対象の円盤の番号表記（例: ②）。ボタンの文言に出す */
  readonly dialLabel: string;
  readonly modulus: number;
  /** 手がかりの文字をクリックしたとき（位置を渡す） */
  readonly onPickPlain: (index: number) => void;
  /** 「消す」。両方の欄を空にする */
  readonly onClear: () => void;
  /** 「合わせる」。操作対象の円盤を鍵 key に合わせる */
  readonly onAlign: (key: number) => void;
}

/**
 * 鍵の計算機（ステージ 2）。mod 26 の引き算（暗号文 − 平文 = 鍵）をするだけで、
 * どの文字どうしを組にするか（何文字目がどの円盤か）は来場者が選ぶ（DESIGN.md §4: 計算の代行はしてよいが、判断は代行しない）。
 * 手がかりは与件（公開情報）の単語だけで、ツールは正解の平文全体を知らない。
 * 状態は持たない（選んだ文字は MultiClock が持ち、電文の紙の上段の強調にも使う）。
 */
export function KeyCalculator({
  hintWord,
  cipherLetter,
  plainIndex,
  dialLabel,
  modulus,
  onPickPlain,
  onClear,
  onAlign,
}: KeyCalculatorProps) {
  const plainLetter = plainIndex === null ? null : (hintWord[plainIndex] ?? null);
  const result = cipherLetter !== null && plainLetter !== null ? keyExpression(cipherLetter, plainLetter, modulus) : null;
  const empty = cipherLetter === null && plainLetter === null;
  return (
    <section className="key-calc" aria-label="鍵の計算機" data-testid="key-calc">
      <div className="calc-hint">
        <span className="calc-title">鍵の計算機</span>
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
          <span
            className={cipherLetter === null ? 'calc-value guide' : 'calc-value'}
            data-testid="calc-cipher"
          >
            {cipherLetter ?? '電文の暗号文の文字をクリック'}
          </span>
        </div>
        <span className="calc-op" aria-hidden="true">
          −
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
          onClick={() => result && onAlign(result.key)}
        >
          {result ? `操作中の円盤（${dialLabel}）を ${result.key} に合わせる` : `操作中の円盤（${dialLabel}）を合わせる`}
        </button>
        <button type="button" className="secondary calc-clear" disabled={empty} onClick={onClear}>
          消す
        </button>
      </div>
    </section>
  );
}
