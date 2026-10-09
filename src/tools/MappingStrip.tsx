import type { CSSProperties } from 'react';
import { mappingColumns } from './mapping';

interface MappingStripProps {
  /** 見出し（ステージ 1: 「対応表（円盤を切り開いて伸ばしたもの）」、ステージ 2: 「② の対応表」） */
  readonly title: string;
  /** 表にする円盤の今のずらし量（鍵） */
  readonly k: number;
  readonly modulus: number;
  /** 電文に出てくる暗号文の文字。この文字の列は明るく太く、他は暗く描く */
  readonly used: ReadonlySet<string>;
  /** 朱で光らせる列の暗号文の文字。光らせないときは null */
  readonly highlight: string | null;
  /** 円盤の番号（1 起点。複数枚のとき、テスト・確認用に付ける） */
  readonly dial?: number;
  /** 暗号文の行の上に番号（A=0 … Z=25）を小さく添えるか。既定は添える */
  readonly numbers?: boolean;
}

/**
 * 対応表: 円盤を切り開いて伸ばした 2 行 × 26 列の表（円盤の外周と内周を、逆さの文字を読まずに一度に読めるようにする）。
 * 上の行は暗号文の A〜Z（固定）、下の行は今の鍵でその内側に来る平文の文字。A の列は朱の枠で囲み、
 * 円盤の読み取り窓と同じ列だと分かるようにする。表示は渡された鍵から毎回作り、状態を持たない。
 */
export function MappingStrip({ title, k, modulus, used, highlight, dial, numbers = true }: MappingStripProps) {
  const columns = mappingColumns(k, modulus);
  const cellClass = (cipher: string, row: 'num' | 'top' | 'bottom'): string => {
    const classes = row === 'num' ? ['map-num'] : ['map-cell', `map-${row}`];
    classes.push(used.has(cipher) ? 'used' : 'unused');
    if (row !== 'num' && cipher === columns[0]?.cipher) classes.push('map-a');
    if (cipher === highlight) classes.push('hl');
    return classes.join(' ');
  };
  return (
    <section className="mapping" aria-label={title} data-testid="mapping-strip" data-dial={dial}>
      <p className="mapping-title">{title}</p>
      <div className="mapping-grid" style={{ '--cols': modulus } as CSSProperties}>
        {numbers ? (
          <>
            <span className="map-head map-head-num">番号</span>
            {columns.map((c, i) => (
              <span key={`n${c.cipher}`} className={cellClass(c.cipher, 'num')} data-col={c.cipher} data-row="number">
                {i}
              </span>
            ))}
          </>
        ) : null}
        <span className="map-head map-head-top">暗号文</span>
        {columns.map((c) => (
          <span key={`c${c.cipher}`} className={cellClass(c.cipher, 'top')} data-col={c.cipher} data-row="cipher">
            {c.cipher}
          </span>
        ))}
        <span className="map-head map-head-bottom">平文</span>
        {columns.map((c) => (
          <span
            key={`p${c.cipher}`}
            className={cellClass(c.cipher, 'bottom')}
            data-col={c.cipher}
            data-row="plain"
            data-testid={c.cipher === 'A' ? 'window-letter' : undefined}
          >
            {c.plain}
          </span>
        ))}
      </div>
    </section>
  );
}

/** 輪の名札: 外側と内側が何の文字かを、各輪の文字色の色見本付きで示す（円盤の下に出す） */
export function DialLegend() {
  return (
    <p className="dial-legend" data-testid="dial-legend">
      <span className="legend-item">
        <span className="swatch swatch-outer" aria-hidden="true" />
        外側 = 暗号文の文字
      </span>{' '}
      <span className="legend-item">
        <span className="swatch swatch-inner" aria-hidden="true" />
        内側 = 平文の文字
      </span>
    </p>
  );
}
