/** [0, n) の整数を一様に選ぶ。random が 1 に達しても範囲外に出さない */
export function randomInt(random: () => number, n: number): number {
  return Math.min(n - 1, Math.floor(random() * n));
}
