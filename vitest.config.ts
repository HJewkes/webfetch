import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    // CC-433: parallel agents saturate the machine; vitest 3 reads poolOptions only from the root
    pool: 'threads',
    poolOptions: {
      threads: { maxThreads: 4, minThreads: 1 },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: ['src/cli.ts', 'src/fetch/patchright.ts', 'src/fetch/types.ts'],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 85,
        lines: 85,
      },
    },
  },
});
