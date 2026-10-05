-- AlterTable
ALTER TABLE "PotionRound" ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "takenAt" TIMESTAMP(3),
ADD COLUMN     "takenById" TEXT,
ADD COLUMN     "takenDay" TEXT;

-- Potions finished before keep-or-send existed were all kept.
UPDATE "PotionRound" SET "outcome" = 'kept' WHERE "finishedAt" IS NOT NULL;

-- CreateIndex
CREATE INDEX "PotionRound_takenById_takenDay_idx" ON "PotionRound"("takenById", "takenDay");

-- AddForeignKey
ALTER TABLE "PotionRound" ADD CONSTRAINT "PotionRound_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
