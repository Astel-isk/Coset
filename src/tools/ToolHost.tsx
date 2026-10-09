import { toolRegistry } from './registry';
import type { ToolId, ToolMount, ToolProps } from './types';

type ToolHostProps = { readonly mount: ToolMount } & Omit<ToolProps<ToolId>, 'mount'>;

/**
 * 装備指定（ToolMount）からツールを描く。
 * ランナー（ui/）がツールの種類ごとの分岐を持たないよう、ID の振り分けはここに閉じ込める。
 * ツールを追加したら case を 1 つ足す。足し忘れは型検査で出る。
 */
export function ToolHost({ mount, ...props }: ToolHostProps) {
  switch (mount.id) {
    case 'modular-clock': {
      const Tool = toolRegistry[mount.id];
      return <Tool mount={mount} {...props} />;
    }
  }
}
