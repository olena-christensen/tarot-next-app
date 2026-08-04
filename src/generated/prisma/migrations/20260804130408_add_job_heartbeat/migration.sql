-- CreateTable
CREATE TABLE "JobHeartbeat" (
    "job" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "detail" TEXT,

    CONSTRAINT "JobHeartbeat_pkey" PRIMARY KEY ("job")
);
