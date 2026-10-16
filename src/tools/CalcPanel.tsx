import { useCompactLayout } from '../layout';
import type { CalcStep } from './calcSteps';
import { currentStep } from './calcSteps';

interface CalcPanelProps {
  /** 見出し（「鍵の計算機」） */
  readonly title: string;
  /** 目的の 1 行 */
  readonly purpose: string;
  /** 架空の例の 1 行（出題と無関係の固定値） */
  readonly example: string;
  /** 手順 2 の、列が未選択のときに薄く出す式の型（「暗号文 − 平文 = 鍵」） */
  readonly placeholder: string;
  /** 列を選んだか（選んだなら expression・result が入る） */
  readonly selected: boolean;
  /** 手順 2 の式（選んだ列から作る）。未選択なら null */
  readonly expression: string | null;
  /** 手順 2 の結果の強調（「鍵 16」「b = 15」）。未選択なら null */
  readonly result: string | null;
  /** ボタンを押したあとの 1 行。次に列を選ぶまで手順 2 の行に出す。なければ null */
  readonly doneMessage: string | null;
  /** ボタンの文言（列を選んだとき） */
  readonly buttonLabel: string;
  /** ボタンの文言（未選択のとき。枠だけで押せない） */
  readonly idleButtonLabel: string;
  readonly onAlign: () => void;
  /** ボタンの右に出す注意（ステージ 3 の戻せない a）。なければ空 */
  readonly caution?: string;
}

const STEP_ONE = '電文の最初の単語から、手がかりと組になった列を 1 つクリック';
/** スマホ版（タッチ操作）では「クリック」を「タップ」にする */
const STEP_ONE_TOUCH = '電文の最初の単語から、手がかりと組になった列を 1 つタップ';

/**
 * 鍵の計算機の表示（ステージ 2・3 共通）。見出し・目的・例と、番号付きの 3 手順
 * （1. 列をクリック / 2. 式と結果 / 3. ボタン）を出す。今の手順の番号だけ朱にする。
 * 状態は持たない。どの列を選ぶかの判断は来場者が電文の列のクリックで行い、計算機は判断しない。
 */
export function CalcPanel({
  title,
  purpose,
  example,
  placeholder,
  selected,
  expression,
  result,
  doneMessage,
  buttonLabel,
  idleButtonLabel,
  onAlign,
  caution = '',
}: CalcPanelProps) {
  const compact = useCompactLayout();
  const step = currentStep(selected);
  const stepClass = (n: CalcStep) => (n === step ? 'calc-step now' : 'calc-step');
  const showFormula = selected && expression !== null;
  return (
    <section className="key-calc" aria-label={title} data-testid="key-calc" data-step={step}>
      <p className="calc-title">{title}</p>
      <p className="calc-purpose">{purpose}</p>
      <p className="calc-example">{example}</p>
      <ol className="calc-steps">
        <li className={stepClass(1)} data-step="1">
          <span className="step-no">1</span>
          <span className="step-text">{compact ? STEP_ONE_TOUCH : STEP_ONE}</span>
        </li>
        <li className={stepClass(2)} data-step="2">
          <span className="step-no">2</span>
          {showFormula ? (
            <>
              <span className="calc-expression" data-testid="calc-expression">
                {expression}
              </span>
              <strong className="calc-result" data-testid="calc-result">
                {result}
              </strong>
            </>
          ) : doneMessage !== null ? (
            <span className="step-text done" data-testid="calc-done">
              {doneMessage}
            </span>
          ) : (
            <span className="step-text faint" data-testid="calc-placeholder">
              {placeholder}
            </span>
          )}
        </li>
        <li className={stepClass(3)} data-step="3">
          <span className="step-no">3</span>
          <button type="button" className="secondary calc-align" disabled={!selected} onClick={onAlign}>
            {selected ? buttonLabel : idleButtonLabel}
          </button>
          <span className="calc-caution" data-testid="calc-caution">
            {caution}
          </span>
        </li>
      </ol>
    </section>
  );
}
