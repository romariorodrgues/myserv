/*
  Warnings:

  - Made the column `unit` on table `service_provider_services` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_service_provider_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceProviderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "basePrice" REAL,
    "unit" TEXT NOT NULL DEFAULT 'per_service',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_provider_services_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_provider_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_service_provider_services" ("basePrice", "createdAt", "description", "id", "isActive", "serviceId", "serviceProviderId", "unit", "updatedAt") SELECT "basePrice", "createdAt", "description", "id", "isActive", "serviceId", "serviceProviderId", "unit", "updatedAt" FROM "service_provider_services";
DROP TABLE "service_provider_services";
ALTER TABLE "new_service_provider_services" RENAME TO "service_provider_services";
CREATE UNIQUE INDEX "service_provider_services_serviceProviderId_serviceId_key" ON "service_provider_services"("serviceProviderId", "serviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
