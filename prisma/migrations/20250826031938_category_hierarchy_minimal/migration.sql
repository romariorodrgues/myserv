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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "service_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_categories" ("createdAt", "description", "icon", "id", "isActive", "name", "updatedAt") SELECT "createdAt", "description", "icon", "id", "isActive", "name", "updatedAt" FROM "service_categories";
DROP TABLE "service_categories";
ALTER TABLE "new_service_categories" RENAME TO "service_categories";
CREATE UNIQUE INDEX "service_categories_name_key" ON "service_categories"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
