-- Add service radius column to service providers
ALTER TABLE "service_providers" ADD COLUMN "serviceRadiusKm" REAL;
