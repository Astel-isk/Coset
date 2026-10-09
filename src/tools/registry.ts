import { ModularClock } from './ModularClock';
import type { ToolRegistry } from './types';

/** ツール ID から実体を引く。ステージ定義はこのレジストリ越しにしかツールを参照しない */
export const toolRegistry: ToolRegistry = {
  'modular-clock': ModularClock,
};
