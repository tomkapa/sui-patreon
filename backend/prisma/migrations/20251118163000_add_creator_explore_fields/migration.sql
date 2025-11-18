-- AlterTable
ALTER TABLE "Creator" ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Creator',
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Creator_category_idx" ON "Creator"("category");

-- CreateIndex
CREATE INDEX "Creator_createdAt_idx" ON "Creator"("createdAt");
