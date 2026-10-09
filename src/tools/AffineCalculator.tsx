import { CalcPanel } from './CalcPanel';
import { affineAlignButtonLabel } from './calcSteps';
import { affineKeyExpression } from './formula';

interface AffineCalculatorProps {
  /** 選んだ列の暗号文の文字と手がかりの文字（平文）。未選択なら null */
  readonly pair: { readonly cipher: string; readonly plain: string } | null;
  /** 今の a（計算に使う） */
  readonly a: number;
  /** 今の a が 26 と互いに素か。そうでなければ注意を出す（計算はする） */
  readonly invertible: boolean;
  readonly modulus: number;
  /** ボタンを押したあとの 1 行。なければ null */
  readonly doneMessage: string | null;
  /** 「b を合わせる」。b を value にする */
  readonly onAlign: (value: number) => void;
}

/**
 * 鍵の計算機（ステージ 3。b を出す）。今の a で b = 暗号文の文字 − a × 平文の文字（26 で割った余り）を計算するだけ。
 * 組は電文の最初の単語の列をクリックして決まる。a は今 AffineTable で選んでいるものを使い、
 * 計算機は a の良し悪しを判断しない（戻せない数のときは注意を出すだけで、ボタンは止めない）。
 * 手がかりは与件（公開情報）の単語だけで、ツールは正解の平文全体を知らない。状態は持たない。
 */
export function AffineCalculator({ pair, a, invertible, modulus, doneMessage, onAlign }: AffineCalculatorProps) {
  const result = pair ? affineKeyExpression(pair.cipher, pair.plain, a, modulus) : null;
  return (
    <CalcPanel
      title="鍵の計算機（b を出す）"
      purpose="a を決めれば、暗号文の文字と、それを戻した平文の文字から b が計算で出る"
      example="例: a = 3 のとき、暗号文の H(7) が平文の C(2) から来たなら、b = 7 − 3 × 2 = 1"
      placeholder="b = 暗号文 − a × 平文"
      selected={result !== null}
      expression={result ? result.text : null}
      result={result ? `b = ${result.b}` : null}
      doneMessage={doneMessage}
      buttonLabel={result ? affineAlignButtonLabel(result.b) : ''}
      idleButtonLabel="b を合わせる"
      onAlign={() => result && onAlign(result.b)}
      caution={invertible ? '' : `注意: a = ${a} は戻せない数`}
    />
  );
}
