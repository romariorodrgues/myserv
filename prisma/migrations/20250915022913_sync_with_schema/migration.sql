-- AlterTable
ALTER TABLE "users" ADD COLUMN "dateOfBirth" DATETIME;

-- CreateTable
CREATE TABLE "user_moderation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_moderation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_moderation_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "service_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_categories" ("createdAt", "description", "displayOrder", "icon", "id", "isActive", "isLeaf", "level", "name", "parentId", "updatedAt") SELECT "createdAt", "description", "displayOrder", "icon", "id", "isActive", "isLeaf", "level", "name", "parentId", "updatedAt" FROM "service_categories";
DROP TABLE "service_categories";
ALTER TABLE "new_service_categories" RENAME TO "service_categories";
CREATE UNIQUE INDEX "service_categories_name_key" ON "service_categories"("name");
CREATE TABLE "new_service_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hasScheduling" BOOLEAN NOT NULL DEFAULT false,
    "hasQuoting" BOOLEAN NOT NULL DEFAULT true,
    "chargesTravel" BOOLEAN NOT NULL DEFAULT false,
    "travelCost" REAL,
    "waivesTravelOnHire" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "highlightUntil" DATETIME,
    "hasDriverLicense" BOOLEAN NOT NULL DEFAULT false,
    "driverLicenseNumber" TEXT,
    "driverLicenseCategory" TEXT,
    "driverLicenseExpiresAt" DATETIME,
    "planId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_providers_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_providers" ("chargesTravel", "createdAt", "hasQuoting", "hasScheduling", "highlightUntil", "id", "isHighlighted", "planId", "travelCost", "updatedAt", "userId", "waivesTravelOnHire") SELECT "chargesTravel", "createdAt", "hasQuoting", "hasScheduling", "highlightUntil", "id", "isHighlighted", "planId", "travelCost", "updatedAt", "userId", "waivesTravelOnHire" FROM "service_providers";
DROP TABLE "service_providers";
ALTER TABLE "new_service_providers" RENAME TO "service_providers";
CREATE UNIQUE INDEX "service_providers_userId_key" ON "service_providers"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "user_moderation_userId_createdAt_idx" ON "user_moderation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "user_moderation_adminId_createdAt_idx" ON "user_moderation"("adminId", "createdAt");
