import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/**/*.test.ts",
            "src/**/*.test.tsx",
          ],
          exclude: [
            "src/lib/nutrition-plan/prisma-repository.test.ts",
            "src/lib/progress/evaluation-lifecycle.integration.test.ts",
            "src/lib/progress/repositories/adjustment-workflow-repository.test.ts",
            "src/lib/progress/repositories/prisma-progress-evaluation-repository.test.ts",
            "src/lib/profile/repositories/goal-change-workflow-repository.integration.test.ts",
          ],
          sequence: {
            groupOrder: 0,
          },
        },
      },
      {
        extends: true,
        test: {
          name: "database",
          include: [
            "src/lib/nutrition-plan/prisma-repository.test.ts",
            "src/lib/progress/evaluation-lifecycle.integration.test.ts",
            "src/lib/progress/repositories/adjustment-workflow-repository.test.ts",
            "src/lib/progress/repositories/prisma-progress-evaluation-repository.test.ts",
            "src/lib/profile/repositories/goal-change-workflow-repository.integration.test.ts",
          ],
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 30000,
          sequence: {
            groupOrder: 1,
          },
        },
      },
    ],
  },
});
