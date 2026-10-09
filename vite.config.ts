import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * ビルド結果の JS と CSS を dist/index.html に埋め込み、単一ファイルにする（EXHIBITION.md「ビルドと配信」）。
 * ダブルクリック（file://）で開く予備の配布物を、同じビルドから得るため。
 * インラインの module script は file:// でも動く（外部ファイルの module script は動かない）。
 */
function inlineSingleFile(): Plugin {
  return {
    name: 'coset-inline-single-file',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset' || typeof html.source !== 'string') {
        throw new Error('index.html が bundle に見つからない');
      }
      let source = html.source;
      const inlined = new Set<string>();

      source = source.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
        const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
        const file = href ? bundle[href.replace(/^\.\//, '')] : undefined;
        if (!file || file.type !== 'asset') return tag;
        inlined.add(file.fileName);
        return `<style>${String(file.source)}</style>`;
      });

      source = source.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g, (tag, src: string) => {
        const file = bundle[src.replace(/^\.\//, '')];
        if (!file || file.type !== 'chunk') return tag;
        inlined.add(file.fileName);
        // </script が JS 内の文字列に含まれていると HTML が途中で閉じるため、エスケープする
        const code = file.code.replace(/<\/script/gi, '<\\/script');
        return `<script type="module">${code}</script>`;
      });

      html.source = source;
      for (const name of inlined) delete bundle[name];
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineSingleFile()],
  // 相対パスで出力する。Workers 配信と file:// の両方で動かすため。
  base: './',
  build: {
    // JS・CSS はすべて html に埋め込むので、別ファイルへ切り出さない
    cssCodeSplit: false,
    modulePreload: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
