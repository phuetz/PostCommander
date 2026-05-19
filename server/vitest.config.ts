import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    // Kept false: route/controller tests share a single Postgres DB and rely
    // on resetTestDatabase() between tests. Parallel files race the truncate
    // (seen: FK violations like "Key (user_id)=… not present in users"). To
    // re-enable, give each test file its own schema (SET search_path) or wrap
    // each test in a transaction + ROLLBACK.
    fileParallelism: false,
    setupFiles: ['dotenv/config'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'src/db/migrations/**',
        'src/test-utils/**',
        'src/mcp/**',
      ],
      // Soft thresholds — flag drift, don't fail the build (yet).
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 50,
        statements: 40,
      },
    },
  },
});
