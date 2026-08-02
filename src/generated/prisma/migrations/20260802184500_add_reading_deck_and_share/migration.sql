-- AlterTable
ALTER TABLE "Reading" ADD COLUMN     "deckId" TEXT,
ADD COLUMN     "shareId" TEXT;

-- CreateIndex
-- Safe on existing rows: every shareId starts NULL, and Postgres unique indexes
-- permit unlimited NULLs.
CREATE UNIQUE INDEX "Reading_shareId_key" ON "Reading"("shareId");
