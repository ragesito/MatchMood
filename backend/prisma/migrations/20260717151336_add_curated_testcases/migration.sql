-- AlterTable
ALTER TABLE "curated_challenges" ADD COLUMN     "testCases" JSONB NOT NULL DEFAULT '[]';
