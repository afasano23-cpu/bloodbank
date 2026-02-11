-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hospital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Hospital" ("address", "createdAt", "email", "id", "latitude", "licenseNumber", "longitude", "name", "password", "phoneNumber", "updatedAt") SELECT "address", "createdAt", "email", "id", "latitude", "licenseNumber", "longitude", "name", "password", "phoneNumber", "updatedAt" FROM "Hospital";
DROP TABLE "Hospital";
ALTER TABLE "new_Hospital" RENAME TO "Hospital";
CREATE UNIQUE INDEX "Hospital_licenseNumber_key" ON "Hospital"("licenseNumber");
CREATE UNIQUE INDEX "Hospital_email_key" ON "Hospital"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
