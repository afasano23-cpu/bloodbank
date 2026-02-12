-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN "stripeAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_stripeAccountId_key" ON "Hospital"("stripeAccountId");
