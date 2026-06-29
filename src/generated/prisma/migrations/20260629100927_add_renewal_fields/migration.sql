-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "lastRenewalAttemptAt" TIMESTAMP(3),
ADD COLUMN     "renewalAttempts" INTEGER NOT NULL DEFAULT 0;
