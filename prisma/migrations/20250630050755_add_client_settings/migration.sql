/*
  Warnings:

  - You are about to drop the column `createdAt` on the `client_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `client_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `client_privacy` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `client_privacy` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_client_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientProfileId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "serviceReminders" BOOLEAN NOT NULL DEFAULT false,
    "reviewRequests" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "client_preferences_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_client_preferences" ("clientProfileId", "emailNotifications", "id", "marketingEmails", "reviewRequests", "serviceReminders", "smsNotifications", "whatsappNotifications") SELECT "clientProfileId", "emailNotifications", "id", "marketingEmails", "reviewRequests", "serviceReminders", "smsNotifications", "whatsappNotifications" FROM "client_preferences";
DROP TABLE "client_preferences";
ALTER TABLE "new_client_preferences" RENAME TO "client_preferences";
CREATE UNIQUE INDEX "client_preferences_clientProfileId_key" ON "client_preferences"("clientProfileId");
CREATE TABLE "new_client_privacy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientProfileId" TEXT NOT NULL,
    "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showLocation" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "client_privacy_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_client_privacy" ("clientProfileId", "id", "profileVisibility", "showEmail", "showLocation", "showPhone") SELECT "clientProfileId", "id", "profileVisibility", "showEmail", "showLocation", "showPhone" FROM "client_privacy";
DROP TABLE "client_privacy";
ALTER TABLE "new_client_privacy" RENAME TO "client_privacy";
CREATE UNIQUE INDEX "client_privacy_clientProfileId_key" ON "client_privacy"("clientProfileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
