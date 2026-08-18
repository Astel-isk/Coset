import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // 相対パスで出力する。GitHub Pages のプロジェクトページや、
  // 展示用にローカルで配信する場合に、置き場所を選ばないため。
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
