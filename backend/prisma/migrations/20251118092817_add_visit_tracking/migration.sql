-- CreateTable
CREATE TABLE "Visit" (
    "id" UUID NOT NULL,
    "userAddress" TEXT NOT NULL,
    "creatorId" UUID NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_userAddress_idx" ON "Visit"("userAddress");

-- CreateIndex
CREATE INDEX "Visit_creatorId_idx" ON "Visit"("creatorId");

-- CreateIndex
CREATE INDEX "Visit_userAddress_visitedAt_idx" ON "Visit"("userAddress", "visitedAt");

-- CreateIndex
CREATE INDEX "Visit_userAddress_creatorId_idx" ON "Visit"("userAddress", "creatorId");
