-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "lastChargedAt" TIMESTAMP(3),
ADD COLUMN     "monoCardToken" TEXT,
ADD COLUMN     "monoInvoiceId" TEXT,
ADD COLUMN     "nextChargeAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" TEXT;
