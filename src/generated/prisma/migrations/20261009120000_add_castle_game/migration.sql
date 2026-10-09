-- CreateTable
CREATE TABLE "CastleItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "place" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "takenAt" TIMESTAMP(3),

    CONSTRAINT "CastleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CastleSpin" (
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CastleSpin_pkey" PRIMARY KEY ("userId","day","kind")
);

-- CreateIndex
CREATE INDEX "CastleItem_userId_idx" ON "CastleItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CastleItem_userId_place_key" ON "CastleItem"("userId", "place");

-- AddForeignKey
ALTER TABLE "CastleItem" ADD CONSTRAINT "CastleItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CastleSpin" ADD CONSTRAINT "CastleSpin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
