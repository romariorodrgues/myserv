-- CreateTable
CREATE TABLE "client_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientProfileId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "serviceReminders" BOOLEAN NOT NULL DEFAULT true,
    "reviewRequests" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "client_preferences_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "client_privacy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientProfileId" TEXT NOT NULL,
    "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "showPhone" BOOLEAN NOT NULL DEFAULT true,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "client_privacy_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "client_preferences_clientProfileId_key" ON "client_preferences"("clientProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "client_privacy_clientProfileId_key" ON "client_privacy"("clientProfileId");
