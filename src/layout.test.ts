import { describe, expect, it } from 'vitest';
import css from './ui/index.css?raw';
import { COMPACT_QUERY } from './layout';

describe('COMPACT_QUERY', () => {
  it('CSS のメディアクエリと同じ条件を使っている（配置と JS の判定が食い違わない）', () => {
    expect(css).toContain(`@media ${COMPACT_QUERY} {`);
  });

  it('幅 1024px 未満または高さ 600px 未満の条件になっている', () => {
    expect(COMPACT_QUERY).toBe('(max-width: 1023.98px), (max-height: 599.98px)');
  });
});
