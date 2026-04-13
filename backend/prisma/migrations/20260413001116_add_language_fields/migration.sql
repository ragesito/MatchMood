-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'easy',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'javascript';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "languagesPlayed" JSONB NOT NULL DEFAULT '{}';
