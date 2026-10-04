-- CreateEnum
CREATE TYPE "AdjustmentDecision" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "ProgressEvaluation" ADD COLUMN     "adjustmentDecision" "AdjustmentDecision" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "respondedAt" TIMESTAMP(3);
