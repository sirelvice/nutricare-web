BEGIN;

CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "userId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityEvent_occurredAt_idx"
  ON "SecurityEvent"("occurredAt");

CREATE INDEX "SecurityEvent_userId_occurredAt_idx"
  ON "SecurityEvent"("userId", "occurredAt");

CREATE INDEX "SecurityEvent_type_occurredAt_idx"
  ON "SecurityEvent"("type", "occurredAt");

ALTER TABLE "SecurityEvent"
  ADD CONSTRAINT "SecurityEvent_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Preserve the existing database-security boundary.
REVOKE ALL PRIVILEGES ON TABLE "SecurityEvent"
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "SecurityEvent"
  TO nutricare_app;

ALTER TABLE "SecurityEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutricare_app_all_access"
  ON "SecurityEvent"
  FOR ALL
  TO nutricare_app
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'nutricare_runtime_v2'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "SecurityEvent"
      TO nutricare_runtime_v2;

    CREATE POLICY "nutricare_runtime_v2_all_access"
      ON "SecurityEvent"
      FOR ALL
      TO nutricare_runtime_v2
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

COMMIT;
