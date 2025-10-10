-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "service_requests" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "service_requests" ADD COLUMN "cancelledBy" TEXT;
ALTER TABLE "service_requests" ADD COLUMN "paymentMethod" TEXT;
