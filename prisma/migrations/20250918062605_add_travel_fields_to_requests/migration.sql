-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN "basePriceSnapshot" REAL;
ALTER TABLE "service_requests" ADD COLUMN "travelDistanceKm" REAL;
ALTER TABLE "service_requests" ADD COLUMN "travelDurationMinutes" REAL;
ALTER TABLE "service_requests" ADD COLUMN "travelFixedFeeSnapshot" REAL;
ALTER TABLE "service_requests" ADD COLUMN "travelMinimumFeeSnapshot" REAL;
ALTER TABLE "service_requests" ADD COLUMN "travelRatePerKmSnapshot" REAL;
