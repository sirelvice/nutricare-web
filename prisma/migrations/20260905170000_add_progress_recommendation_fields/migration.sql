-- Create recommendation enums before adding columns that depend on them.

CREATE TYPE "RecommendedAction" AS ENUM (
    'CONTINUE',
    'REVIEW_ADHERENCE',
    'CONSIDER_ADJUSTMENT',
    'SUGGEST_PROFESSIONAL_CONSULT'
);

CREATE TYPE "RecommendationReason" AS ENUM (
    'INSUFFICIENT_DATA',
    'ON_TRACK',
    'FIRST_PROBLEM',
    'CONSECUTIVE_PROBLEM',
    'RECURRENCE_AFTER_ADJUSTMENT'
);

-- Add recommendation fields as nullable so existing evaluation records
-- can be backfilled explicitly before enforcing NOT NULL.

ALTER TABLE "ProgressEvaluation"
ADD COLUMN "recommendedAction" "RecommendedAction",
ADD COLUMN "recommendationReason" "RecommendationReason";

-- Existing evaluations were created before recommendation persistence
-- existed. Their state is INSUFFICIENT_DATA, so the historical
-- recommendation is deterministically CONTINUE / INSUFFICIENT_DATA.

UPDATE "ProgressEvaluation"
SET
    "recommendedAction" = 'CONTINUE',
    "recommendationReason" = 'INSUFFICIENT_DATA'
WHERE "recommendedAction" IS NULL
   OR "recommendationReason" IS NULL;

ALTER TABLE "ProgressEvaluation"
ALTER COLUMN "recommendedAction" SET NOT NULL,
ALTER COLUMN "recommendationReason" SET NOT NULL;
