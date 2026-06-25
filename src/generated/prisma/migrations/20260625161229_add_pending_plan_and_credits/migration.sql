-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "activatedInvoiceId" TEXT,
ADD COLUMN     "pendingPlanId" TEXT,
ADD COLUMN     "readingCredits" INTEGER NOT NULL DEFAULT 0;
