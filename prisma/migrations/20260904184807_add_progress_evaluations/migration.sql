-- CreateEnum
CREATE TYPE "ProgressState" AS ENUM (
    'ON_TRACK',
    'BEHIND_OPPOSITE',
    'PLATEAU',
    'INSUFFICIENT_DATA'
);

-- CreateTable
CREATE TABLE "ProgressEvaluation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "state" "ProgressState" NOT NULL,
    "changeKg" DOUBLE PRECISION,
    "entriesCount" INTEGER NOT NULL,
    "evaluationDays" INTEGER,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgressEvaluation_userId_evaluatedAt_idx"
ON "ProgressEvaluation"("userId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "ProgressEvaluation_planVersionId_evaluatedAt_idx"
ON "ProgressEvaluation"("planVersionId", "evaluatedAt");

-- AddForeignKey
ALTER TABLE "ProgressEvaluation"
ADD CONSTRAINT "ProgressEvaluation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEvaluation"
ADD CONSTRAINT "ProgressEvaluation_planVersionId_fkey"
FOREIGN KEY ("planVersionId") REFERENCES "NutritionPlan"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
