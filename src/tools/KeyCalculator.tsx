import { CalcPanel } from './CalcPanel';
import { alignButtonLabel } from './calcSteps';
import { keyExpression } from './formula';

interface KeyCalculatorProps {
  /** 選んだ列の暗号文の文字と手がかりの文字（平文）。未選択なら null */
  readonly pair: { readonly cipher: string; readonly plain: string } | null;
  /** 選んだ列を受け持つ円盤の番号表記（例: ②）。未選択なら null */
  readonly dialLabel: string | null;
  readonly modulus: number;
  /** ボタンを押したあとの 1 行。なければ null */
  readonly doneMessage: string | null;
  /** 「合わせる」。選んだ列を受け持つ円盤を鍵 key に合わせる（円盤の切り替えは呼び出し側） */
  readonly onAlign: (key: number) => void;
}

/**
 * 鍵の計算機（ステージ 2）。mod 26 の引き算（暗号文 − 平文 = 鍵）をするだけ。
 * 組は電文の最初の単語の列をクリックして決まり（手がかりと組になった列）、合わせる円盤はその列を受け持つ円盤に決まる。
 * 手がかりは与件（公開情報）の単語だけで、ツールは正解の平文全体を知らない。
 * 状態は持たない（選んだ列は MultiClock が持ち、電文の紙の朱の塗りにも使う）。
 */
export function KeyCalculator({ pair, dialLabel, modulus, doneMessage, onAlign }: KeyCalculatorProps) {
  const result = pair ? keyExpression(pair.cipher, pair.plain, modulus) : null;
  const ready = result !== null && dialLabel !== null;
  return (
    <CalcPanel
      title="鍵の計算機"
      purpose="暗号文の文字と、それを戻した平文の文字が分かれば、引き算で鍵が出る"
      example="例: 暗号文の D(3) が平文の A(0) から来たなら、3 − 0 = 3 で鍵は 3"
      placeholder="暗号文 − 平文 = 鍵"
      selected={ready}
      expression={ready ? result.text : null}
      result={ready ? `鍵 ${result.key}` : null}
      doneMessage={doneMessage}
      buttonLabel={ready ? alignButtonLabel(dialLabel, result.key) : ''}
      idleButtonLabel="この列の円盤を鍵に合わせる"
      onAlign={() => result && onAlign(result.key)}
    />
  );
}
