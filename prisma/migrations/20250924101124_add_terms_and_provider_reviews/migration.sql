-- Add columns for user terms acceptance and deactivation
ALTER TABLE "users" ADD COLUMN "deactivatedAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "termsAcceptedAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "termsVersion" TEXT;

-- Add flag for providers indicating home service availability
ALTER TABLE "service_provider_services" ADD COLUMN "providesHomeService" BOOLEAN NOT NULL DEFAULT false;

-- Track provider reviews about clients
ALTER TABLE "service_requests" ADD COLUMN "providerReviewRating" INTEGER;
ALTER TABLE "service_requests" ADD COLUMN "providerReviewComment" TEXT;
ALTER TABLE "service_requests" ADD COLUMN "providerReviewGivenAt" DATETIME;
