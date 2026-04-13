-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastPlayedDate" TIMESTAMP(3),
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferredLang" TEXT NOT NULL DEFAULT 'javascript',
ADD COLUMN     "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skillLevel" TEXT NOT NULL DEFAULT 'intermediate';

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_date_key" ON "daily_challenges"("date");
