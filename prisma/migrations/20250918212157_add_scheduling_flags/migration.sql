-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_service_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "isLeaf" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "requiresDriverLicense" BOOLEAN NOT NULL DEFAULT false,
    "allowScheduling" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "service_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_categories" ("createdAt", "description", "displayOrder", "icon", "id", "isActive", "isLeaf", "level", "name", "parentId", "requiresDriverLicense", "updatedAt") SELECT "createdAt", "description", "displayOrder", "icon", "id", "isActive", "isLeaf", "level", "name", "parentId", "requiresDriverLicense", "updatedAt" FROM "service_categories";
DROP TABLE "service_categories";
ALTER TABLE "new_service_categories" RENAME TO "service_categories";
CREATE UNIQUE INDEX "service_categories_name_key" ON "service_categories"("name");
CREATE TABLE "new_service_provider_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceProviderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "basePrice" REAL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "offersScheduling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_provider_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_provider_services_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_service_provider_services" ("basePrice", "createdAt", "description", "id", "isActive", "serviceId", "serviceProviderId", "unit", "updatedAt") SELECT "basePrice", "createdAt", "description", "id", "isActive", "serviceId", "serviceProviderId", "unit", "updatedAt" FROM "service_provider_services";
UPDATE "new_service_provider_services" AS sps
SET "offersScheduling" = (
  SELECT CASE WHEN sp."hasScheduling" THEN 1 ELSE 0 END
  FROM "service_providers" AS sp
  WHERE sp."id" = sps."serviceProviderId"
);
DROP TABLE "service_provider_services";
ALTER TABLE "new_service_provider_services" RENAME TO "service_provider_services";
CREATE UNIQUE INDEX "service_provider_services_serviceProviderId_serviceId_key" ON "service_provider_services"("serviceProviderId", "serviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
