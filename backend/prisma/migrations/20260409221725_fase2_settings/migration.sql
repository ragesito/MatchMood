-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notifMatches" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifMilestone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifSummary" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system';
