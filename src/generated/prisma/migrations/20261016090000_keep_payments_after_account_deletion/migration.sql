-- Keep payment records when an account is deleted (code review 2026-10-15,
-- item 11). The row stays; only its link to the person is cleared.
ALTER TABLE "Payment" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
