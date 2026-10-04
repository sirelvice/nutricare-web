BEGIN;

-- Remove NutriCare table access from Supabase API roles and PUBLIC.
REVOKE ALL PRIVILEGES ON TABLE
  "User",
  "Profile",
  "WeightEntry",
  "NutritionPlan",
  "ProgressEvaluation",
  "ContactMessage",
  "PartnerInquiry",
  "RateLimitBucket",
  "PasswordResetToken"
FROM PUBLIC, anon, authenticated, service_role;

-- Runtime application role gets only required DML.
GRANT USAGE ON SCHEMA public TO nutricare_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "User",
  "Profile",
  "WeightEntry",
  "NutritionPlan",
  "ProgressEvaluation",
  "ContactMessage",
  "PartnerInquiry",
  "RateLimitBucket",
  "PasswordResetToken"
TO nutricare_app;

-- Enable RLS on every NutriCare application table.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeightEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NutritionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgressEvaluation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnerInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;

-- Remove legacy Supabase-Auth-specific policies from the application tables.
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'User',
        'Profile',
        'WeightEntry',
        'NutritionPlan',
        'ProgressEvaluation',
        'ContactMessage',
        'PartnerInquiry',
        'RateLimitBucket',
        'PasswordResetToken'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      p.policyname,
      p.schemaname,
      p.tablename
    );
  END LOOP;
END
$$;

-- The application server is the trusted database boundary.
-- Per-user authorization remains enforced in the application/repository layer.
CREATE POLICY "nutricare_app_all_access"
  ON "User"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "Profile"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "WeightEntry"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "NutritionPlan"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "ProgressEvaluation"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "ContactMessage"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "PartnerInquiry"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "RateLimitBucket"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nutricare_app_all_access"
  ON "PasswordResetToken"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

-- Prevent future public-schema objects created by postgres from
-- being automatically exposed to Supabase API roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS
  FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS
  FROM PUBLIC;

COMMIT;
