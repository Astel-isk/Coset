/** 「視覚効果を減らす」設定が有効か。画面を開いた時点の値を使う（展示中に設定が変わることは想定しない） */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
