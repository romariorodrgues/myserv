-- Add phone verification columns
ALTER TABLE "users" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "phoneVerifiedAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "phoneVerificationCode" TEXT;
ALTER TABLE "users" ADD COLUMN "phoneVerificationExpiresAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "phoneVerificationSentAt" DATETIME;
