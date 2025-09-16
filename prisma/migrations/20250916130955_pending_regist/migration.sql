-- CreateTable
CREATE TABLE "pending_provider_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "personType" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "dateOfBirth" DATETIME,
    "hasDriverLicense" BOOLEAN NOT NULL DEFAULT false,
    "driverLicenseNumber" TEXT,
    "driverLicenseCategory" TEXT,
    "driverLicenseExpiresAt" DATETIME,
    "extraData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_coupon_redemptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "amountOff" REAL,
    "paymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coupon_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "coupon_redemptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "coupon_redemptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_coupon_redemptions" ("couponId", "createdAt", "id", "userId") SELECT "couponId", "createdAt", "id", "userId" FROM "coupon_redemptions";
DROP TABLE "coupon_redemptions";
ALTER TABLE "new_coupon_redemptions" RENAME TO "coupon_redemptions";
CREATE UNIQUE INDEX "coupon_redemptions_paymentId_key" ON "coupon_redemptions"("paymentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "pending_provider_registrations_email_idx" ON "pending_provider_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_provider_registrations_cpfCnpj_idx" ON "pending_provider_registrations"("cpfCnpj");
