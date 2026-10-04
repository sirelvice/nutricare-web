BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'nutricare_runtime_v2'
  ) THEN

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "User"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "Profile"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "WeightEntry"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "NutritionPlan"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "ProgressEvaluation"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "ContactMessage"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "PartnerInquiry"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "RateLimitBucket"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "PasswordResetToken"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);

  END IF;
END
$$;

COMMIT;
