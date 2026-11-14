import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// 集計ロジックなど、ブラウザに依存しない純粋関数の単体テスト用設定
export default defineConfig({
  resolve: {
    // tsconfig.json の "@/*": ["./*"] と同じ別名を使えるようにする
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts', 'lib/**/*.test.ts'],
  },
});
