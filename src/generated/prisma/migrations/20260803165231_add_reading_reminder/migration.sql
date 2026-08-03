-- AlterTable
ALTER TABLE "User" ADD COLUMN     "readingReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderSentOn" TEXT;
