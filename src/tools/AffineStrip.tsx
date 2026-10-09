import type { CSSProperties } from 'react';
import { affineColumns, clashExample, clashingColumns, clashWarning, isInvertible } from './affine';

interface AffineStripProps {
  /** 今の a・b */
  readonly a: number;
  readonly b: number;
  readonly modulus: number;
  /** 電文に出てくる暗号文の文字。この文字の列は明るく太く、他は暗く描く */
  readonly used: ReadonlySet<string>;
  /** 朱で光らせる暗号文の文字（電文に重ねている文字）。下の行のその文字（重なっていれば全部）と上の行の平文を光らせる。なければ null */
  readonly highlight: string | null;
}

/**
 * 対応表（暗号化の向き）: 上の行が平文の A〜Z と番号、下の行が (a × 番号 + b) を 26 で割った余りの文字。
 * 下の行で同じ文字に重なった列は朱の枠で囲み、その下に警告を出す（a が 26 と互いに素でないとき）。
 * 表示は渡された (a, b) から毎回作り、状態を持たない。ツールは正解を知らない。
 */
export function AffineStrip({ a, b, modulus, used, highlight }: AffineStripProps) {
  const columns = affineColumns(a, b, modulus);
  const clash = clashingColumns(columns);
  const invertible = isInvertible(a, modulus);
  const flags = (cipher: string, index: number): string[] => {
    const f = [used.has(cipher) ? 'used' : 'unused'];
    if (clash.has(index)) f.push('clash');
    if (cipher === highlight) f.push('hl');
    return f;
  };
  const example = invertible ? null : clashExample(a, b, modulus);
  return (
    <section className="mapping affine-strip" aria-label="対応表" data-testid="affine-strip">
      <p className="mapping-title">
        対応表（暗号化の向き）
        <span className="affine-formula">
          暗号文 = ({a} × 番号 + {b}) を {modulus} で割った余り
        </span>
      </p>
      <div className="mapping-grid" style={{ '--cols': modulus } as CSSProperties}>
        <span className="map-head map-head-num">番号</span>
        {columns.map((c) => (
          <span key={`n${c.index}`} className={['map-num', ...flags(c.cipher, c.index)].join(' ')} data-row="number" data-col={c.index}>
            {c.index}
          </span>
        ))}
        <span className="map-head map-head-top">平文</span>
        {columns.map((c) => (
          <span
            key={`p${c.index}`}
            className={['map-cell', 'aff-plain', ...flags(c.cipher, c.index)].join(' ')}
            data-row="plain"
            data-col={c.index}
          >
            {c.plain}
          </span>
        ))}
        <span className="map-head map-head-bottom">暗号文</span>
        {columns.map((c) => (
          <span
            key={`c${c.index}`}
            className={['map-cell', 'aff-cipher', ...flags(c.cipher, c.index)].join(' ')}
            data-row="cipher"
            data-col={c.index}
          >
            {c.cipher}
          </span>
        ))}
      </div>
      <p className="affine-warn" role="status" data-testid="affine-warning">
        {invertible ? '' : clashWarning(a)}
        {example ? <span className="affine-warn-eg">（{example}）</span> : null}
      </p>
    </section>
  );
}
