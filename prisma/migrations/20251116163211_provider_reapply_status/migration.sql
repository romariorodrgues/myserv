-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileImage" TEXT,
    "userType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "rejectedAt" DATETIME,
    "reviewRequestedAt" DATETIME,
    "deactivatedAt" DATETIME,
    "termsAcceptedAt" DATETIME,
    "termsVersion" TEXT,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "dateOfBirth" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("cpfCnpj", "createdAt", "dateOfBirth", "deactivatedAt", "description", "email", "gender", "id", "isActive", "isApproved", "maritalStatus", "name", "password", "phone", "profileImage", "termsAcceptedAt", "termsVersion", "updatedAt", "userType") SELECT "cpfCnpj", "createdAt", "dateOfBirth", "deactivatedAt", "description", "email", "gender", "id", "isActive", "isApproved", "maritalStatus", "name", "password", "phone", "profileImage", "termsAcceptedAt", "termsVersion", "updatedAt", "userType" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_cpfCnpj_key" ON "users"("cpfCnpj");
UPDATE "users" SET "approvalStatus" = 'APPROVED' WHERE "isApproved" = 1;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
