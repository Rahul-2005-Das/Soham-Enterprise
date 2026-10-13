CREATE TYPE "PasswordResetPurpose" AS ENUM ('PASSWORD_RESET', 'AUTHENTICATION');

ALTER TABLE "PasswordResetToken"
  ADD COLUMN "purpose" "PasswordResetPurpose" NOT NULL DEFAULT 'PASSWORD_RESET';

CREATE INDEX "PasswordResetToken_email_purpose_used_createdAt_idx"
  ON "PasswordResetToken"("email", "purpose", "used", "createdAt");