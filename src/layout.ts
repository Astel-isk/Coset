import { useSyncExternalStore } from 'react';

/**
 * スマホ版（縦 1 列の配置）に切り替える条件（EXHIBITION.md「スマホ版」）。
 * 画面の幅が 1024px 未満、または高さが 600px 未満。CSS のメディアクエリ（ui/index.css 末尾の @media）と同じ文字列で、
 * 配置の切り替えと JS 側の判定（自動復帰の停止・文言の切り替え・タップ動作）が食い違わないようにする。
 * 小数の .98 は、1023.5px のような中間の幅でも min-width: 1024px の側と隙間を作らないための書き方。
 * ランナー（ui/）とツール（tools/）の両方から使うので、どちらにも属さない src 直下に置く。
 */
export const COMPACT_QUERY = '(max-width: 1023.98px), (max-height: 599.98px)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(COMPACT_QUERY).matches;
}

/** スマホ版の配置か。ウィンドウの大きさや端末の向きが変わると再描画される */
export function useCompactLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
