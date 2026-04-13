-- CreateTable
CREATE TABLE "private_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "maxPlayers" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curated_challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tags" TEXT[],
    "starterCode" TEXT NOT NULL,
    "runnerCode" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'javascript',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curated_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "private_rooms_code_key" ON "private_rooms"("code");

-- AddForeignKey
ALTER TABLE "private_rooms" ADD CONSTRAINT "private_rooms_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
