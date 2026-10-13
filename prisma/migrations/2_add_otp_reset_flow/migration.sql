ALTER TABLE "PasswordResetToken"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "tokenHash" TEXT,
  ADD COLUMN "otpHash" TEXT,
  ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "attemptsUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 5;

UPDATE "PasswordResetToken"
SET "otpHash" = COALESCE("token", '')
WHERE "otpHash" IS NULL;

UPDATE "PasswordResetToken"
SET "tokenHash" = COALESCE("token", '')
WHERE "tokenHash" IS NULL;

ALTER TABLE "PasswordResetToken"
  ALTER COLUMN "otpHash" SET NOT NULL;

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key"
  ON "PasswordResetToken"("tokenHash")
  WHERE "tokenHash" IS NOT NULL;

CREATE INDEX "PasswordResetToken_userId_idx"
  ON "PasswordResetToken"("userId");

CREATE INDEX "PasswordResetToken_expiresAt_idx"
  ON "PasswordResetToken"("expiresAt");

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
