-- CreateTable
CREATE TABLE "PotionRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "day" TEXT,

    CONSTRAINT "PotionRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PotionReward" (
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PotionReward_pkey" PRIMARY KEY ("userId","day")
);

-- CreateIndex
CREATE INDEX "PotionRound_userId_day_idx" ON "PotionRound"("userId", "day");

-- CreateIndex
CREATE INDEX "PotionRound_anonId_day_idx" ON "PotionRound"("anonId", "day");

-- CreateIndex
CREATE INDEX "PotionRound_startedAt_idx" ON "PotionRound"("startedAt");

-- AddForeignKey
ALTER TABLE "PotionRound" ADD CONSTRAINT "PotionRound_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotionReward" ADD CONSTRAINT "PotionReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
